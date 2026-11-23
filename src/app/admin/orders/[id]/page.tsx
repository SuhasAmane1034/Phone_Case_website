import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { PrintButton } from "@/components/admin/print-button";
import { requireAdminPermission } from "@/lib/admin/server";

const transitions: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["packed", "cancelled"],
  packed: ["shipped"],
  shipped: ["out_for_delivery", "returned"],
  out_for_delivery: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

function formatCurrency(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

function getAddressLines(address: unknown) {
  if (!address || typeof address !== "object" || Array.isArray(address)) return [];
  return Object.values(address).filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
}

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const context = await requireAdminPermission("orders.read");
  const { id } = await params;
  const query = await searchParams;
  const { data: order, error } = await context.supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_email, customer_phone, shipping_address, billing_address, status, payment_status, payment_method, subtotal_paise, discount_paise, shipping_paise, total_paise, notes, created_at, paid_at, tracking_number, tracking_url, order_items(id, product_name_snapshot, variant_name_snapshot, sku_snapshot, device_name_snapshot, colour_snapshot, quantity, unit_price_paise, line_total_paise)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Could not load admin order:", error.message);
    return (
      <p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">
        The order could not be loaded.
      </p>
    );
  }
  if (!order) notFound();

  const canUpdate = context.permissions.includes("orders.write");
  const canReadPayments = context.permissions.includes("payments.read");
  const nextStatuses = (transitions[order.status] ?? []).filter(
    (status) =>
      status !== "cancelled" ||
      !["authorized", "captured", "partially_refunded"].includes(
        order.payment_status,
      ),
  );
  const [paymentsResult] = await Promise.all([
    canReadPayments
      ? context.supabase
          .from("payments")
          .select(
            "id, provider, provider_order_id, provider_payment_id, amount_paise, currency, status, method, created_at",
          )
          .eq("order_id", order.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (paymentsResult.error)
    console.error("Could not load order payments:", paymentsResult.error.message);

  const shippingAddress = getAddressLines(order.shipping_address);
  const items = order.order_items ?? [];

  return (
    <main>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/orders"
          className="text-sm font-semibold text-zinc-600 underline underline-offset-4 hover:text-black"
        >
          ← All orders
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/admin/orders/${order.id}/invoice`}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition hover:bg-zinc-100"
          >
            Invoice
          </Link>
          <PrintButton />
        </div>
      </div>

      <header className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
            Order {order.order_number}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Order details
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Placed {new Date(order.created_at).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold capitalize">
          <span className="rounded-full bg-zinc-200 px-3 py-2">
            {order.status.replaceAll("_", " ")}
          </span>
          <span className="rounded-full bg-zinc-200 px-3 py-2">
            Payment: {order.payment_status.replaceAll("_", " ")}
          </span>
        </div>
      </header>

      {query.updated && (
        <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Order status updated.
        </p>
      )}
      {query.error && (
        <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          The update could not be completed. Check the current payment and order
          state, then try again.
        </p>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,.8fr)]">
        <div className="space-y-6">
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold">Items</h2>
            {items.length ? (
              <div className="mt-4 divide-y divide-zinc-100">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="font-semibold">{item.product_name_snapshot}</p>
                      <p className="mt-1 text-sm text-zinc-600">
                        {item.variant_name_snapshot}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        SKU {item.sku_snapshot}
                        {item.device_name_snapshot
                          ? ` · ${item.device_name_snapshot}`
                          : ""}
                        {item.colour_snapshot ? ` · ${item.colour_snapshot}` : ""}
                        {` · Qty ${item.quantity}`}
                      </p>
                    </div>
                    <p className="text-sm font-bold">
                      {formatCurrency(item.line_total_paise)}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-600">
                No order-item records are available.
              </p>
            )}
            <dl className="mt-5 space-y-2 border-t border-zinc-200 pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-600">Subtotal</dt>
                <dd>{formatCurrency(order.subtotal_paise)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-600">Discount</dt>
                <dd>−{formatCurrency(order.discount_paise)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-600">Shipping</dt>
                <dd>{formatCurrency(order.shipping_paise)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-zinc-200 pt-3 font-bold">
                <dt>Total</dt>
                <dd>{formatCurrency(order.total_paise)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold">Customer</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Name
                </dt>
                <dd className="mt-1">{order.customer_name || "Guest customer"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Email
                </dt>
                <dd className="mt-1 break-all">{order.customer_email || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Phone
                </dt>
                <dd className="mt-1">{order.customer_phone}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Payment method
                </dt>
                <dd className="mt-1 capitalize">{order.payment_method}</dd>
              </div>
            </dl>
            <div className="mt-5 border-t border-zinc-200 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Shipping address
              </h3>
              {shippingAddress.length ? (
                <address className="mt-2 space-y-1 text-sm not-italic text-zinc-700">
                  {shippingAddress.map((line, index) => (
                    <p key={`${index}-${line}`}>{line}</p>
                  ))}
                </address>
              ) : (
                <p className="mt-2 text-sm text-zinc-600">
                  No address snapshot available.
                </p>
              )}
            </div>
          </section>

          {canReadPayments && (
            <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold">Payments</h2>
              {paymentsResult.error ? (
                <p role="alert" className="mt-3 text-sm text-red-700">
                  Payment records could not be loaded.
                </p>
              ) : paymentsResult.data?.length ? (
                <div className="mt-4 space-y-3">
                  {paymentsResult.data.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-lg bg-zinc-50 p-4 text-sm"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <strong className="capitalize">
                          {payment.provider} · {payment.status.replaceAll("_", " ")}
                        </strong>
                        <strong>{formatCurrency(payment.amount_paise)}</strong>
                      </div>
                      <p className="mt-2 break-all text-xs text-zinc-600">
                        Order ID: {payment.provider_order_id || "—"}
                      </p>
                      <p className="mt-1 break-all text-xs text-zinc-600">
                        Payment ID: {payment.provider_payment_id || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-zinc-600">
                  No payment records are available.
                </p>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-6">
          {canUpdate && (
            <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-bold">Update order</h2>
              <OrderStatusForm
                orderId={order.id}
                statuses={nextStatuses}
              />
            </section>
          )}
          {order.tracking_number && (
            <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold">Shipment</h2>
              <p className="mt-3 text-sm">Tracking: {order.tracking_number}</p>
              {order.tracking_url && (
                <a
                  href={order.tracking_url}
                  rel="noreferrer"
                  target="_blank"
                  className="mt-2 inline-flex text-sm font-semibold underline"
                >
                  Open tracking
                </a>
              )}
            </section>
          )}
          {order.notes && (
            <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold">Internal notes</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700">
                {order.notes}
              </p>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
