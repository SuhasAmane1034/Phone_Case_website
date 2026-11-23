import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/print-button";
import { requireAdminPermission } from "@/lib/admin/server";

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

export default async function AdminOrderInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireAdminPermission("orders.read");
  const { id } = await params;
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_email, customer_phone, shipping_address, status, payment_status, payment_method, subtotal_paise, discount_paise, shipping_paise, total_paise, created_at, order_items(id, product_name_snapshot, variant_name_snapshot, sku_snapshot, quantity, unit_price_paise, line_total_paise)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Could not load admin invoice:", error.message);
    return (
      <p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">
        The order receipt could not be loaded.
      </p>
    );
  }
  if (!order) notFound();

  const addressLines = getAddressLines(order.shipping_address);

  return (
    <main className="admin-invoice mx-auto max-w-4xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
      <div className="admin-invoice-actions mb-8 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/admin/orders/${order.id}`}
          className="text-sm font-semibold text-zinc-600 underline underline-offset-4 hover:text-black"
        >
          ← Back to order
        </Link>
        <PrintButton />
      </div>

      <header className="flex flex-wrap justify-between gap-8 border-b border-zinc-200 pb-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em]">
            GHYAMAJHA
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight">
            Order receipt
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Order {order.order_number}
          </p>
        </div>
        <dl className="grid content-start gap-2 text-sm sm:text-right">
          <div>
            <dt className="inline text-zinc-500">Date: </dt>
            <dd className="inline font-semibold">
              {new Date(order.created_at).toLocaleDateString("en-IN")}
            </dd>
          </div>
          <div>
            <dt className="inline text-zinc-500">Order status: </dt>
            <dd className="inline font-semibold capitalize">
              {order.status.replaceAll("_", " ")}
            </dd>
          </div>
          <div>
            <dt className="inline text-zinc-500">Payment: </dt>
            <dd className="inline font-semibold capitalize">
              {order.payment_status.replaceAll("_", " ")} ·{" "}
              {order.payment_method}
            </dd>
          </div>
        </dl>
      </header>

      <section className="grid gap-8 border-b border-zinc-200 py-8 sm:grid-cols-2">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Customer
          </h2>
          <p className="mt-3 text-sm font-semibold">
            {order.customer_name || "Customer"}
          </p>
          {order.customer_email && (
            <p className="mt-1 break-all text-sm text-zinc-600">
              {order.customer_email}
            </p>
          )}
          <p className="mt-1 text-sm text-zinc-600">{order.customer_phone}</p>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Shipping address
          </h2>
          {addressLines.length ? (
            <address className="mt-3 space-y-1 text-sm not-italic text-zinc-700">
              {addressLines.map((line, index) => (
                <p key={`${index}-${line}`}>{line}</p>
              ))}
            </address>
          ) : (
            <p className="mt-3 text-sm text-zinc-600">
              No shipping address was recorded.
            </p>
          )}
        </div>
      </section>

      <section className="py-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Items
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="py-3 pr-4">Description</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Unit price</th>
                <th className="py-3 pl-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(order.order_items ?? []).map((item) => (
                <tr key={item.id}>
                  <td className="py-4 pr-4">
                    <p className="font-semibold">{item.product_name_snapshot}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {item.variant_name_snapshot} · SKU {item.sku_snapshot}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-right">{item.quantity}</td>
                  <td className="px-4 py-4 text-right">
                    {formatCurrency(item.unit_price_paise)}
                  </td>
                  <td className="py-4 pl-4 text-right font-semibold">
                    {formatCurrency(item.line_total_paise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <dl className="ml-auto max-w-sm space-y-2 border-t border-zinc-200 pt-5 text-sm">
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
        <div className="flex justify-between gap-4 border-t border-zinc-200 pt-3 text-base font-black">
          <dt>Total paid / due</dt>
          <dd>{formatCurrency(order.total_paise)}</dd>
        </div>
      </dl>
      <p className="mt-10 border-t border-zinc-200 pt-5 text-xs text-zinc-500">
        This receipt reflects the order records currently available in the
        store.
      </p>
    </main>
  );
}
