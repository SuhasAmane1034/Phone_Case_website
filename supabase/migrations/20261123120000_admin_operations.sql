alter table public.profiles
  add column if not exists email text,
  add column if not exists avatar_url text;

alter table public.categories
  add column if not exists description text,
  add column if not exists image_url text;

alter table public.products
  add column if not exists primary_image text;

alter table public.orders
  add column if not exists customer_name text,
  add column if not exists coupon_code text,
  add column if not exists notes text,
  add column if not exists reservation_expires_at timestamptz;

alter table public.order_items
  add column if not exists product_image_snapshot text;

alter table public.payments
  add column if not exists signature_verified boolean not null default false,
  add column if not exists refund_amount_paise integer not null default 0
    check (refund_amount_paise >= 0);

alter table public.coupons
  add column if not exists maximum_discount_paise integer,
  add column if not exists used_count integer not null default 0
    check (used_count >= 0);

alter table public.admin_roles
  add column if not exists permissions jsonb not null default '{}'::jsonb;

alter table public.admin_roles
  drop constraint if exists admin_roles_role_check;

alter table public.admin_roles
  add constraint admin_roles_role_check
  check (role in (
    'super_admin',
    'admin',
    'order_manager',
    'product_manager',
    'inventory_manager',
    'customer_support'
  ));

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id),
  movement_type text not null check (
    movement_type in (
      'purchase',
      'sale',
      'return',
      'manual_adjustment',
      'reservation',
      'reservation_release'
    )
  ),
  quantity_delta integer not null,
  previous_quantity integer not null check (previous_quantity >= 0),
  new_quantity integer not null check (new_quantity >= 0),
  reason text not null,
  order_id uuid references public.orders(id) on delete set null,
  admin_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint inventory_movement_delta_matches
    check (new_quantity - previous_quantity = quantity_delta)
);

create index if not exists inventory_movements_variant_created_idx
  on public.inventory_movements(variant_id, created_at desc);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_created_idx
  on public.activity_logs(created_at desc);
create index if not exists activity_logs_entity_idx
  on public.activity_logs(entity_type, entity_id, created_at desc);

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton),
  store_name text not null default 'GHYAMAJHA',
  support_email text,
  support_phone text,
  currency text not null default 'INR' check (currency = 'INR'),
  free_shipping_threshold_paise integer not null default 149900
    check (free_shipping_threshold_paise >= 0),
  standard_shipping_charge_paise integer not null default 9900
    check (standard_shipping_charge_paise >= 0),
  cod_enabled boolean not null default false,
  maintenance_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.store_settings (singleton)
values (true)
on conflict (singleton) do nothing;

create or replace function public.has_admin_permission(required_permission text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_roles as ar
    where ar.user_id = auth.uid()
      and (
        ar.role = 'super_admin'
        or (
          required_permission <> 'admin.roles.manage'
          and (
            ar.permissions ? required_permission
            or case ar.role
              when 'admin' then true
              when 'order_manager' then required_permission in (
                'dashboard.read',
                'orders.read',
                'orders.write',
                'payments.read',
                'customers.read'
              )
              when 'product_manager' then required_permission in (
                'dashboard.read',
                'catalog.read',
                'catalog.write',
                'inventory.read'
              )
              when 'inventory_manager' then required_permission in (
                'dashboard.read',
                'catalog.read',
                'inventory.read',
                'inventory.write'
              )
              when 'customer_support' then required_permission in (
                'dashboard.read',
                'orders.read',
                'customers.read'
              )
              else false
            end
          )
        )
      )
  );
$$;

create or replace function public.current_admin_permissions()
returns text[]
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(array_agg(permission), '{}'::text[])
  from unnest(array[
    'dashboard.read',
    'orders.read',
    'orders.write',
    'payments.read',
    'payments.write',
    'customers.read',
    'catalog.read',
    'catalog.write',
    'inventory.read',
    'inventory.write',
    'coupons.write',
    'reviews.write',
    'content.write',
    'shipping.write',
    'settings.read',
    'settings.write',
    'activity.read',
    'admin.roles.manage'
  ]) as permission_list(permission)
  where public.has_admin_permission(permission);
$$;

create or replace function public.adjust_inventory(
  target_variant_id uuid,
  quantity_delta integer,
  adjustment_reason text
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  previous_quantity integer;
  reserved_quantity integer;
  updated_quantity integer;
begin
  if not public.has_admin_permission('inventory.write') then
    raise exception 'Not authorized to adjust inventory' using errcode = '42501';
  end if;

  if quantity_delta = 0 or length(trim(adjustment_reason)) < 3 then
    raise exception 'A non-zero adjustment and reason are required'
      using errcode = '22023';
  end if;

  select i.quantity, i.reserved_quantity
  into previous_quantity, reserved_quantity
  from public.inventory as i
  where i.variant_id = target_variant_id
  for update;

  if not found then
    raise exception 'Inventory record not found' using errcode = 'P0002';
  end if;

  updated_quantity := previous_quantity + quantity_delta;
  if updated_quantity < reserved_quantity then
    raise exception 'Adjustment would reduce stock below reserved quantity'
      using errcode = '23514';
  end if;

  update public.inventory
  set quantity = updated_quantity, updated_at = now()
  where variant_id = target_variant_id;

  insert into public.inventory_movements (
    variant_id,
    movement_type,
    quantity_delta,
    previous_quantity,
    new_quantity,
    reason,
    admin_user_id
  )
  values (
    target_variant_id,
    'manual_adjustment',
    quantity_delta,
    previous_quantity,
    updated_quantity,
    trim(adjustment_reason),
    auth.uid()
  );

  insert into public.activity_logs (
    admin_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    auth.uid(),
    'inventory.adjusted',
    'inventory',
    target_variant_id,
    jsonb_build_object(
      'previous_quantity', previous_quantity,
      'new_quantity', updated_quantity,
      'reason', trim(adjustment_reason)
    )
  );

  return updated_quantity;
end;
$$;

create or replace function public.admin_update_order_status(
  target_order_id uuid,
  next_status text,
  internal_note text default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_order public.orders%rowtype;
  transition_allowed boolean := false;
begin
  if not public.has_admin_permission('orders.write') then
    raise exception 'Not authorized to update orders' using errcode = '42501';
  end if;

  select *
  into current_order
  from public.orders
  where id = target_order_id
  for update;

  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  transition_allowed := case current_order.status
    when 'pending' then next_status in ('confirmed', 'cancelled')
    when 'confirmed' then next_status in ('processing', 'cancelled')
    when 'processing' then next_status in ('packed', 'cancelled')
    when 'packed' then next_status = 'shipped'
    when 'shipped' then next_status in ('out_for_delivery', 'returned')
    when 'out_for_delivery' then next_status in ('delivered', 'returned')
    when 'delivered' then next_status = 'returned'
    else false
  end;

  if not transition_allowed then
    raise exception 'Invalid order status transition'
      using errcode = '23514';
  end if;

  if next_status = 'cancelled'
    and current_order.payment_status in ('authorized', 'captured', 'partially_refunded')
  then
    raise exception 'Refund or void the payment before cancelling this order'
      using errcode = '23514';
  end if;

  update public.orders
  set status = next_status,
      notes = case
        when nullif(trim(internal_note), '') is null then notes
        when nullif(notes, '') is null then trim(internal_note)
        else notes || E'\n' || trim(internal_note)
      end,
      cancelled_at = case when next_status = 'cancelled' then now() else cancelled_at end,
      updated_at = now()
  where id = target_order_id;

  insert into public.activity_logs (
    admin_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    auth.uid(),
    'order.status_changed',
    'order',
    target_order_id,
    jsonb_build_object(
      'from', current_order.status,
      'to', next_status,
      'note_added', nullif(trim(internal_note), '') is not null
    )
  );

  return next_status;
end;
$$;

create or replace function public.admin_dashboard_metrics(
  range_start timestamptz,
  range_end timestamptz
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  metrics jsonb;
begin
  if not public.has_admin_permission('dashboard.read') then
    raise exception 'Not authorized to view the admin dashboard'
      using errcode = '42501';
  end if;

  if range_start is null or range_end is null or range_start >= range_end then
    raise exception 'Invalid dashboard date range' using errcode = '22023';
  end if;

  select jsonb_build_object(
    'revenue_paise',
    case when public.has_admin_permission('payments.read') then coalesce((
      select sum(greatest(p.amount_paise - p.refund_amount_paise, 0))
      from public.payments as p
      join public.orders as o on o.id = p.order_id
      where p.status in ('captured', 'partially_refunded')
        and o.status not in ('cancelled', 'returned')
        and o.paid_at >= range_start
        and o.paid_at < range_end
    ), 0) else null end,
    'orders_count',
    case when public.has_admin_permission('orders.read') then
      (select count(*) from public.orders as o
        where o.created_at >= range_start and o.created_at < range_end)
      else null end,
    'pending_orders_count',
    case when public.has_admin_permission('orders.read') then
      (select count(*) from public.orders as o
        where o.status = 'pending'
          and o.created_at >= range_start and o.created_at < range_end)
      else null end,
    'captured_payments_count',
    case when public.has_admin_permission('payments.read') then
      (select count(*) from public.payments as p
        where p.status = 'captured'
          and p.created_at >= range_start and p.created_at < range_end)
      else null end,
    'failed_payments_count',
    case when public.has_admin_permission('payments.read') then
      (select count(*) from public.payments as p
        where p.status = 'failed'
          and p.created_at >= range_start and p.created_at < range_end)
      else null end,
    'customers_count',
    case when public.has_admin_permission('customers.read') then
      (select count(*) from public.profiles)
      else null end,
    'active_products_count',
    case when public.has_admin_permission('catalog.read') then
      (select count(*) from public.products as p where p.is_active)
      else null end,
    'low_stock_count',
    case when public.has_admin_permission('inventory.read') then
      (select count(*) from public.inventory as i
        where i.quantity - i.reserved_quantity <= i.low_stock_threshold)
      else null end,
    'daily_revenue',
    case when public.has_admin_permission('payments.read') then coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'date', daily.day,
          'revenue_paise', daily.revenue_paise
        ) order by daily.day
      )
      from (
        select series.day::date as day,
          coalesce(sum(greatest(p.amount_paise - p.refund_amount_paise, 0)), 0)
            as revenue_paise
        from generate_series(
          date_trunc('day', range_start),
          date_trunc('day', range_end - interval '1 microsecond'),
          interval '1 day'
        ) as series(day)
        left join public.orders as o
          on o.paid_at >= series.day
          and o.paid_at < series.day + interval '1 day'
          and o.status not in ('cancelled', 'returned')
        left join public.payments as p
          on p.order_id = o.id
          and p.status in ('captured', 'partially_refunded')
        group by series.day
      ) as daily
    ), '[]'::jsonb) else '[]'::jsonb end
  ) into metrics;

  return metrics;
end;
$$;

create or replace function public.admin_customer_summary()
returns table (
  customer_id uuid,
  full_name text,
  email text,
  phone text,
  created_at timestamptz,
  total_orders bigint,
  total_spending_paise bigint,
  last_order_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.has_admin_permission('customers.read') then
    raise exception 'Not authorized to view customers' using errcode = '42501';
  end if;

  return query
    with order_summaries as (
      select
        o.user_id,
        count(*) filter (where o.status not in ('cancelled', 'returned')) as order_count,
        coalesce(sum(payment_summary.net_amount), 0)::bigint as spending,
        max(o.created_at) as last_order
      from public.orders as o
      left join lateral (
        select coalesce(
          sum(greatest(p.amount_paise - p.refund_amount_paise, 0)),
          0
        ) as net_amount
        from public.payments as p
        where p.order_id = o.id
          and p.status in ('captured', 'partially_refunded', 'refunded')
      ) as payment_summary on true
      where o.user_id is not null
      group by o.user_id
    )
    select
      p.id,
      p.full_name,
      p.email,
      p.phone,
      p.created_at,
      coalesce(os.order_count, 0)::bigint,
      coalesce(os.spending, 0)::bigint,
      os.last_order
    from public.profiles as p
    left join order_summaries as os on os.user_id = p.id
    order by p.created_at desc;
end;
$$;

create or replace function public.bootstrap_first_super_admin(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if coalesce(auth.role(), 'postgres') not in ('postgres', 'service_role') then
    raise exception 'Only a trusted bootstrap context can grant the first administrator'
      using errcode = '42501';
  end if;

  if exists (select 1 from public.admin_roles) then
    raise exception 'An administrator already exists; use Super Admin role management'
      using errcode = '23505';
  end if;

  insert into public.admin_roles (user_id, role)
  values (target_user_id, 'super_admin');
end;
$$;

revoke all on function public.has_admin_permission(text) from public;
grant execute on function public.has_admin_permission(text) to authenticated;
revoke all on function public.current_admin_permissions() from public;
grant execute on function public.current_admin_permissions() to authenticated;
revoke all on function public.adjust_inventory(uuid, integer, text) from public;
grant execute on function public.adjust_inventory(uuid, integer, text) to authenticated;
revoke all on function public.admin_update_order_status(uuid, text, text) from public;
grant execute on function public.admin_update_order_status(uuid, text, text) to authenticated;
revoke all on function public.admin_dashboard_metrics(timestamptz, timestamptz) from public;
grant execute on function public.admin_dashboard_metrics(timestamptz, timestamptz) to authenticated;
revoke all on function public.admin_customer_summary() from public;
grant execute on function public.admin_customer_summary() to authenticated;
revoke all on function public.bootstrap_first_super_admin(uuid) from public, anon, authenticated;
grant execute on function public.bootstrap_first_super_admin(uuid) to service_role;

alter table public.inventory_movements enable row level security;
alter table public.activity_logs enable row level security;
alter table public.store_settings enable row level security;

create policy "role permissions read inventory movements"
  on public.inventory_movements for select to authenticated
  using (public.has_admin_permission('inventory.read'));
create policy "role permissions read activity logs"
  on public.activity_logs for select to authenticated
  using (public.has_admin_permission('activity.read'));
create policy "role permissions insert activity logs"
  on public.activity_logs for insert to authenticated
  with check (public.has_admin_permission('admin.access'));
create policy "role permissions read store settings"
  on public.store_settings for select to authenticated
  using (public.has_admin_permission('settings.read'));
create policy "role permissions update store settings"
  on public.store_settings for update to authenticated
  using (public.has_admin_permission('settings.write'))
  with check (public.has_admin_permission('settings.write'));

create policy "users read own admin role"
  on public.admin_roles for select to authenticated
  using (user_id = auth.uid());
create policy "super admins manage admin roles"
  on public.admin_roles for all to authenticated
  using (public.has_admin_permission('admin.roles.manage'))
  with check (public.has_admin_permission('admin.roles.manage'));
create policy "role permissions read products"
  on public.products for select to authenticated
  using (public.has_admin_permission('catalog.read'));
create policy "role permissions read categories"
  on public.categories for select to authenticated
  using (public.has_admin_permission('catalog.read'));
create policy "role permissions read devices"
  on public.devices for select to authenticated
  using (public.has_admin_permission('catalog.read'));
create policy "role permissions read product images"
  on public.product_images for select to authenticated
  using (public.has_admin_permission('catalog.read'));
create policy "role permissions read product variants"
  on public.product_variants for select to authenticated
  using (public.has_admin_permission('catalog.read'));
create policy "role permissions read product compatibility"
  on public.product_device_compatibility for select to authenticated
  using (public.has_admin_permission('catalog.read'));
create policy "role permissions read inventory"
  on public.inventory for select to authenticated
  using (public.has_admin_permission('inventory.read'));
create policy "role permissions manage catalog"
  on public.products for all to authenticated
  using (public.has_admin_permission('catalog.write'))
  with check (public.has_admin_permission('catalog.write'));
create policy "role permissions manage categories"
  on public.categories for all to authenticated
  using (public.has_admin_permission('catalog.write'))
  with check (public.has_admin_permission('catalog.write'));
create policy "role permissions manage devices"
  on public.devices for all to authenticated
  using (public.has_admin_permission('catalog.write'))
  with check (public.has_admin_permission('catalog.write'));
create policy "role permissions manage product images"
  on public.product_images for all to authenticated
  using (public.has_admin_permission('catalog.write'))
  with check (public.has_admin_permission('catalog.write'));
create policy "role permissions manage product variants"
  on public.product_variants for all to authenticated
  using (public.has_admin_permission('catalog.write'))
  with check (public.has_admin_permission('catalog.write'));
create policy "role permissions manage product compatibility"
  on public.product_device_compatibility for all to authenticated
  using (public.has_admin_permission('catalog.write'))
  with check (public.has_admin_permission('catalog.write'));
create policy "role permissions manage inventory"
  on public.inventory for all to authenticated
  using (public.has_admin_permission('inventory.write'))
  with check (public.has_admin_permission('inventory.write'));
create policy "role permissions read orders"
  on public.orders for select to authenticated
  using (public.has_admin_permission('orders.read'));
create policy "role permissions update orders"
  on public.orders for update to authenticated
  using (public.has_admin_permission('orders.write'))
  with check (public.has_admin_permission('orders.write'));
create policy "role permissions read order items"
  on public.order_items for select to authenticated
  using (public.has_admin_permission('orders.read'));
create policy "role permissions read customer profiles"
  on public.profiles for select to authenticated
  using (public.has_admin_permission('customers.read'));
create policy "role permissions read customer addresses"
  on public.addresses for select to authenticated
  using (public.has_admin_permission('customers.read'));
create policy "role permissions read payments"
  on public.payments for select to authenticated
  using (public.has_admin_permission('payments.read'));
create policy "role permissions read webhook events"
  on public.webhook_events for select to authenticated
  using (public.has_admin_permission('payments.read'));
create policy "role permissions manage coupons"
  on public.coupons for all to authenticated
  using (public.has_admin_permission('coupons.write'))
  with check (public.has_admin_permission('coupons.write'));
create policy "role permissions manage reviews"
  on public.reviews for all to authenticated
  using (public.has_admin_permission('reviews.write'))
  with check (public.has_admin_permission('reviews.write'));
create policy "role permissions manage banners"
  on public.banners for all to authenticated
  using (public.has_admin_permission('content.write'))
  with check (public.has_admin_permission('content.write'));
create policy "role permissions manage shipping settings"
  on public.shipping_settings for all to authenticated
  using (public.has_admin_permission('shipping.write'))
  with check (public.has_admin_permission('shipping.write'));

notify pgrst, 'reload schema';
