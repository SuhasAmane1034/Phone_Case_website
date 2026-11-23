import Link from "next/link";
import { requireAdminPermission } from "@/lib/admin/server";

const orderStatuses = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
];
const paymentStatuses = [
  "pending",
  "authorized",
  "captured",
  "failed",
  "refunded",
  "partially_refunded",
];

function formatCurrency(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    payment?: string;
  }>;
}) {
  const { supabase } = await requireAdminPermission("orders.read");
  const query = await searchParams;
  const term = (query.q ?? "").trim().replace(/[^a-zA-Z0-9 @.+_-]/g, "").slice(0, 100);
  const status = orderStatuses.includes(query.status ?? "")
    ? query.status
    : undefined;
  const payment = paymentStatuses.includes(query.payment ?? "")
    ? query.payment
    : undefined;

  let ordersQuery = supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_email, customer_phone, status, payment_status, total_paise, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (term) {
    const pattern = `%${term}%`;
    ordersQuery = ordersQuery.or(
      `order_number.ilike.${pattern},customer_name.ilike.${pattern},customer_email.ilike.${pattern},customer_phone.ilike.${pattern}`,
    );
  }
  if (status) ordersQuery = ordersQuery.eq("status", status);
  if (payment) ordersQuery = ordersQuery.eq("payment_status", payment);

  const { data: orders, error, count } = await ordersQuery;
  if (error) console.error("Could not load admin orders:", error.message);

  return (
    <main>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
            Commerce
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Orders</h1>
          <p className="mt-2 text-sm text-zinc-600">
            {count ?? 0} matching orders
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider"
        >
          Overview
        </Link>
      </header>

      <form className="mt-6 grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1fr)_180px_200px_auto]">
        <label className="grid gap-1 text-xs font-semibold text-zinc-600">
          Search orders
          <input
            name="q"
            defaultValue={query.q}
            placeholder="Number, name, email or phone"
            className="h-10 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-900"
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-zinc-600">
          Order status
          <select
            name="status"
            defaultValue={status ?? ""}
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900"
          >
            <option value="">All statuses</option>
            {orderStatuses.map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-zinc-600">
          Payment status
          <select
            name="payment"
            defaultValue={payment ?? ""}
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900"
          >
            <option value="">All payments</option>
            {paymentStatuses.map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <button className="h-10 self-end rounded-lg bg-zinc-950 px-5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-zinc-700">
          Filter
        </button>
      </form>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900"
        >
          Orders are unavailable. Confirm the database migrations are applied
          and try again.
        </p>
      ) : orders?.length ? (
        <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-4">Order</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(orders ?? []).map((order) => (
                <tr key={order.id} className="transition hover:bg-zinc-50">
                  <td className="px-5 py-4 font-bold">{order.order_number}</td>
                  <td className="px-5 py-4">
                    <p className="font-semibold">
                      {order.customer_name || "Guest customer"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {order.customer_email || order.customer_phone}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {new Date(order.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-5 py-4 font-semibold">
                    {formatCurrency(order.total_paise)}
                  </td>
                  <td className="px-5 py-4 capitalize text-zinc-600">
                    {order.payment_status.replaceAll("_", " ")}
                  </td>
                  <td className="px-5 py-4 capitalize text-zinc-600">
                    {order.status.replaceAll("_", " ")}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-bold underline underline-offset-4"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <h2 className="text-lg font-bold">No orders found</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Try changing your search or filters.
          </p>
        </div>
      )}
    </main>
  );
}
