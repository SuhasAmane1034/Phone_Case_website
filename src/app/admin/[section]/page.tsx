import { notFound } from "next/navigation";
import { z } from "zod";
import {
  AdminDataTable,
  type AdminTableRow,
} from "@/components/admin/data-table";
import { AdjustInventoryForm } from "@/app/admin/inventory/adjust-inventory-form";
import { requireAdminPermission } from "@/lib/admin/server";

const sections = {
  products: { title: "Products", permission: "catalog.read" },
  categories: { title: "Categories", permission: "catalog.read" },
  collections: { title: "Collections", permission: "catalog.read" },
  inventory: { title: "Inventory", permission: "inventory.read" },
  customers: { title: "Customers", permission: "customers.read" },
  payments: { title: "Payments", permission: "payments.read" },
  coupons: { title: "Coupons & discounts", permission: "coupons.write" },
  reviews: { title: "Reviews", permission: "reviews.write" },
  content: { title: "Homepage & banners", permission: "content.write" },
  analytics: { title: "Analytics & reports", permission: "dashboard.read" },
  shipping: { title: "Shipping", permission: "shipping.write" },
  settings: { title: "Store settings", permission: "settings.read" },
  activity: { title: "Activity log", permission: "activity.read" },
  users: { title: "Admin users", permission: "admin.roles.manage" },
} as const;

type Section = keyof typeof sections;
const analyticsMetricsSchema = z.object({
  orders_count: z.number().nullable(),
  active_products_count: z.number().nullable(),
  low_stock_count: z.number().nullable(),
  captured_payments_count: z.number().nullable(),
});
const customerSummarySchema = z.array(
  z.object({
    customer_id: z.string(),
    full_name: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    total_orders: z.coerce.number(),
    total_spending_paise: z.coerce.number(),
    last_order_at: z.string().nullable(),
  }),
);

function formatCurrency(paise: number | null) {
  if (paise === null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

function nestedRecord(value: unknown): Record<string, unknown> | null {
  const record = Array.isArray(value) ? value[0] : value;
  return record && typeof record === "object"
    ? (record as Record<string, unknown>)
    : null;
}

export const dynamic = "force-dynamic";

export default async function AdminSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const { section: rawSection } = await params;
  if (!Object.hasOwn(sections, rawSection)) notFound();
  const section = rawSection as Section;
  const definition = sections[section];
  const context = await requireAdminPermission(definition.permission);
  const query = await searchParams;

  let columns: string[] = [];
  let rows: AdminTableRow[] = [];
  let loadError: string | null = null;
  let canAdjustInventory = false;

  switch (section) {
    case "products":
    case "collections":
      columns = ["Product", "SKU", "Category", "Price", "Status", "Flags"];
      {
        const { data, error } = await context.supabase
          .from("products")
          .select(
            "id, name, sku, regular_price_paise, sale_price_paise, is_active, is_featured, is_bestseller, is_new_arrival, categories(name)",
          )
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) loadError = error.message;
        else
          rows = data.map((product) => {
            const category = nestedRecord(product.categories);
            return {
              id: product.id,
              cells: [
                product.name,
                product.sku || "—",
                String(category?.name ?? "—"),
                formatCurrency(
                  product.sale_price_paise ?? product.regular_price_paise,
                ),
                product.is_active ? "Active" : "Archived",
                [
                  product.is_featured ? "Featured" : "",
                  product.is_bestseller ? "Bestseller" : "",
                  product.is_new_arrival ? "New" : "",
                ]
                  .filter(Boolean)
                  .join(" · ") || "—",
              ],
            };
          });
      }
      break;
    case "categories":
      columns = ["Name", "Slug", "Status", "Position"];
      {
        const { data, error } = await context.supabase
          .from("categories")
          .select("id, name, slug, is_active, position")
          .order("position", { ascending: true })
          .limit(100);
        if (error) loadError = error.message;
        else
          rows = data.map((category) => ({
            id: category.id,
            cells: [
              category.name,
              category.slug,
              category.is_active ? "Active" : "Archived",
              String(category.position),
            ],
          }));
      }
      break;
    case "inventory":
      columns = ["Product / variant", "SKU", "On hand", "Reserved", "Available", "Low-stock point", "Adjustment"];
      canAdjustInventory = context.permissions.includes("inventory.write");
      {
        const { data, error } = await context.supabase
          .from("inventory")
          .select(
            "variant_id, quantity, reserved_quantity, low_stock_threshold, product_variants(sku, name, products(name))",
          )
          .order("updated_at", { ascending: false })
          .limit(200);
        if (error) loadError = error.message;
        else
          rows = data.map((entry) => {
            const variant = nestedRecord(entry.product_variants);
            const product = nestedRecord(variant?.products);
            return {
              id: entry.variant_id,
              cells: [
                `${String(product?.name ?? "Product")} / ${String(variant?.name ?? "Variant")}`,
                String(variant?.sku ?? "—"),
                String(entry.quantity),
                String(entry.reserved_quantity),
                String(entry.quantity - entry.reserved_quantity),
                String(entry.low_stock_threshold),
              ],
            };
          });
      }
      break;
    case "customers":
      columns = ["Customer", "Email", "Phone", "Orders", "Spending", "Last order"];
      {
        const { data, error } = await context.supabase.rpc(
          "admin_customer_summary",
        );
        if (error) loadError = error.message;
        else {
          const parsed = customerSummarySchema.safeParse(data);
          if (!parsed.success) loadError = "Customer summary response was invalid";
          else
            rows = parsed.data.map((customer) => ({
              id: customer.customer_id,
              cells: [
                customer.full_name || "Customer",
                customer.email || "—",
                customer.phone || "—",
                String(customer.total_orders),
                formatCurrency(customer.total_spending_paise),
                customer.last_order_at
                  ? new Date(customer.last_order_at).toLocaleDateString("en-IN")
                  : "—",
              ],
            }));
        }
      }
      break;
    case "payments":
      columns = ["Order", "Provider", "Provider payment ID", "Amount", "Method", "Status", "Date"];
      {
        const { data, error } = await context.supabase
          .from("payments")
          .select(
            "id, provider, provider_payment_id, amount_paise, method, status, created_at, orders(order_number)",
          )
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) loadError = error.message;
        else
          rows = data.map((payment) => {
            const order = nestedRecord(payment.orders);
            return {
              id: payment.id,
              cells: [
                String(order?.order_number ?? "—"),
                payment.provider,
                payment.provider_payment_id || "—",
                formatCurrency(payment.amount_paise),
                payment.method || "—",
                payment.status.replaceAll("_", " "),
                new Date(payment.created_at).toLocaleDateString("en-IN"),
              ],
            };
          });
      }
      break;
    case "coupons":
      columns = ["Code", "Discount", "Minimum order", "Usage", "Status", "Valid until"];
      {
        const { data, error } = await context.supabase
          .from("coupons")
          .select(
            "id, code, discount_type, discount_value, minimum_order_paise, maximum_discount_paise, usage_limit, used_count, is_active, ends_at",
          )
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) loadError = error.message;
        else
          rows = data.map((coupon) => ({
            id: coupon.id,
            cells: [
              coupon.code,
              coupon.discount_type === "percentage"
                ? `${coupon.discount_value}%${coupon.maximum_discount_paise ? ` (max ${formatCurrency(coupon.maximum_discount_paise)})` : ""}`
                : formatCurrency(coupon.discount_value),
              formatCurrency(coupon.minimum_order_paise),
              `${coupon.used_count}${coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""}`,
              coupon.is_active ? "Active" : "Disabled",
              coupon.ends_at
                ? new Date(coupon.ends_at).toLocaleDateString("en-IN")
                : "No expiry",
            ],
          }));
      }
      break;
    case "reviews":
      columns = ["Product", "Rating", "Title", "Status", "Submitted"];
      {
        const { data, error } = await context.supabase
          .from("reviews")
          .select("id, rating, title, status, created_at, products(name)")
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) loadError = error.message;
        else
          rows = data.map((review) => {
            const product = nestedRecord(review.products);
            return {
              id: review.id,
              cells: [
                String(product?.name ?? "Product"),
                `${review.rating} / 5`,
                review.title || "—",
                review.status,
                new Date(review.created_at).toLocaleDateString("en-IN"),
              ],
            };
          });
      }
      break;
    case "content":
      columns = ["Title", "Destination", "Position", "Status", "Schedule"];
      {
        const { data, error } = await context.supabase
          .from("banners")
          .select("id, title, href, position, is_active, starts_at, ends_at")
          .order("position", { ascending: true })
          .limit(100);
        if (error) loadError = error.message;
        else
          rows = data.map((banner) => ({
            id: banner.id,
            cells: [
              banner.title,
              banner.href || "—",
              String(banner.position),
              banner.is_active ? "Active" : "Inactive",
              banner.starts_at
                ? `${new Date(banner.starts_at).toLocaleDateString("en-IN")} – ${banner.ends_at ? new Date(banner.ends_at).toLocaleDateString("en-IN") : "No end"}`
                : "Always",
            ],
          }));
      }
      break;
    case "analytics":
      columns = ["Order", "Products", "Inventory", "Payments"];
      {
        const { data, error } = await context.supabase.rpc(
          "admin_dashboard_metrics",
          {
            range_start: new Date(
              new Date().getTime() - 30 * 86400000,
            ).toISOString(),
            range_end: new Date().toISOString(),
          },
        );
        if (error) loadError = error.message;
        else {
          const parsed = analyticsMetricsSchema.safeParse(data);
          if (!parsed.success) {
            loadError = "Dashboard metrics response was invalid";
          } else {
            rows = [
              {
                id: "last-30-days",
                cells: [
                  String(parsed.data.orders_count ?? "Restricted"),
                  String(parsed.data.active_products_count ?? "Restricted"),
                  String(parsed.data.low_stock_count ?? "Restricted"),
                  String(parsed.data.captured_payments_count ?? "Restricted"),
                ],
              },
            ];
          }
        }
      }
      break;
    case "shipping":
    case "settings":
      columns = ["Store", "Currency", "Free-shipping threshold", "Shipping charge", "COD", "Maintenance mode"];
      {
        const { data, error } = await context.supabase
          .from("store_settings")
          .select(
            "id, store_name, currency, free_shipping_threshold_paise, standard_shipping_charge_paise, cod_enabled, maintenance_mode, updated_at",
          )
          .limit(1)
          .maybeSingle();
        if (error) loadError = error.message;
        else if (data)
          rows = [
            {
              id: data.id,
              cells: [
                data.store_name,
                data.currency,
                formatCurrency(data.free_shipping_threshold_paise),
                formatCurrency(data.standard_shipping_charge_paise),
                data.cod_enabled ? "Enabled" : "Disabled",
                data.maintenance_mode ? "On" : "Off",
              ],
            },
          ];
      }
      break;
    case "activity":
      columns = ["Action", "Entity", "Entity ID", "Admin", "Time"];
      {
        const { data, error } = await context.supabase
          .from("activity_logs")
          .select("id, action, entity_type, entity_id, admin_user_id, created_at")
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) loadError = error.message;
        else
          rows = data.map((entry) => ({
            id: entry.id,
            cells: [
              entry.action,
              entry.entity_type,
              entry.entity_id || "—",
              entry.admin_user_id || "—",
              new Date(entry.created_at).toLocaleString("en-IN"),
            ],
          }));
      }
      break;
    case "users":
      columns = ["User ID", "Role", "Created"];
      {
        const { data, error } = await context.supabase
          .from("admin_roles")
          .select("user_id, role, created_at")
          .order("created_at", { ascending: false });
        if (error) loadError = error.message;
        else
          rows = data.map((admin) => ({
            id: admin.user_id,
            cells: [
              admin.user_id,
              admin.role.replaceAll("_", " "),
              new Date(admin.created_at).toLocaleDateString("en-IN"),
            ],
          }));
      }
      break;
  }

  if (loadError)
    console.error(`Could not load admin section ${section}:`, loadError);

  return (
    <main>
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
          Administration
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">
          {definition.title}
        </h1>
      </header>

      {query.updated && (
        <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Inventory adjustment saved.
        </p>
      )}
      {query.error && (
        <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          The requested action could not be completed.
        </p>
      )}
      {loadError ? (
        <p
          role="alert"
          className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900"
        >
          This section is unavailable. Confirm the database migrations are
          applied and try again.
        </p>
      ) : (
        <AdminDataTable
          columns={
            canAdjustInventory ? [...columns, "Stock adjustment"] : columns
          }
          emptyMessage={`No ${definition.title.toLowerCase()} records found.`}
          rows={
            section === "inventory" && canAdjustInventory
              ? rows.map((row) => {
                  const form = <AdjustInventoryForm variantId={row.id} />;
                  return { ...row, cells: [...row.cells, form] };
                })
              : rows
          }
        />
      )}
    </main>
  );
}
