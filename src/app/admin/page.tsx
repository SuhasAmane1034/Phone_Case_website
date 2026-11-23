import Link from "next/link";
import { z } from "zod";
import { requireAdminPermission } from "@/lib/admin/server";

export const dynamic = "force-dynamic";

const metricsSchema = z.object({
  revenue_paise: z.number().nullable(),
  orders_count: z.number().nullable(),
  pending_orders_count: z.number().nullable(),
  captured_payments_count: z.number().nullable(),
  failed_payments_count: z.number().nullable(),
  customers_count: z.number().nullable(),
  active_products_count: z.number().nullable(),
  low_stock_count: z.number().nullable(),
  daily_revenue: z.array(
    z.object({
      date: z.string(),
      revenue_paise: z.number(),
    }),
  ),
});

type RangePreset = "today" | "7d" | "30d" | "90d" | "custom";

function getRange(
  preset: string | undefined,
  from: string | undefined,
  to: string | undefined,
) {
  const end = new Date();
  end.setUTCHours(24, 0, 0, 0);
  const start = new Date(end);
  const selected: RangePreset =
    preset === "today" || preset === "7d" || preset === "90d" || preset === "custom"
      ? preset
      : "30d";

  if (selected === "custom" && from && to) {
    const customStart = new Date(`${from}T00:00:00.000Z`);
    const customEnd = new Date(`${to}T00:00:00.000Z`);
    customEnd.setUTCDate(customEnd.getUTCDate() + 1);
    if (
      Number.isFinite(customStart.getTime()) &&
      Number.isFinite(customEnd.getTime()) &&
      customStart < customEnd
    ) {
      return { from: customStart, to: customEnd, preset: selected, fromDate: from, toDate: to };
    }
  }

  const days = selected === "today" ? 1 : selected === "7d" ? 7 : selected === "90d" ? 90 : 30;
  start.setUTCDate(start.getUTCDate() - days);
  return {
    from: start,
    to: end,
    preset: selected === "custom" ? "30d" : selected,
    fromDate: "",
    toDate: "",
  };
}

function formatCurrency(paise: number | null) {
  if (paise === null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const context = await requireAdminPermission("dashboard.read");
  const query = await searchParams;
  const range = getRange(query.range, query.from, query.to);
  const { data: rawMetrics, error: metricsError } = await context.supabase.rpc(
    "admin_dashboard_metrics",
    {
      range_start: range.from.toISOString(),
      range_end: range.to.toISOString(),
    },
  );

  let metrics: z.infer<typeof metricsSchema> | null = null;
  if (metricsError) {
    console.error("Could not load admin dashboard metrics:", metricsError.message);
  } else {
    const parsedMetrics = metricsSchema.safeParse(rawMetrics);
    if (parsedMetrics.success) {
      metrics = parsedMetrics.data;
    } else {
      console.error("Admin dashboard metrics had an unexpected shape.");
    }
  }

  const canReadOrders = context.permissions.includes("orders.read");
  const canReadCustomers = context.permissions.includes("customers.read");
  const [ordersResult, customersResult] = await Promise.all([
    canReadOrders
      ? context.supabase
          .from("orders")
          .select(
            "id, order_number, customer_name, customer_email, customer_phone, status, payment_status, total_paise, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(6)
      : Promise.resolve({ data: null, error: null }),
    canReadCustomers
      ? context.supabase
          .from("profiles")
          .select("id, full_name, email, created_at")
          .order("created_at", { ascending: false })
          .limit(6)
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (ordersResult.error)
    console.error("Could not load recent orders:", ordersResult.error.message);
  if (customersResult.error)
    console.error("Could not load recent customers:", customersResult.error.message);

  const summaryCards = [
    { label: "Revenue", value: metrics?.revenue_paise ?? null, kind: "currency" },
    { label: "Orders", value: metrics?.orders_count ?? null, kind: "count" },
    {
      label: "Pending orders",
      value: metrics?.pending_orders_count ?? null,
      kind: "count",
    },
    {
      label: "Captured payments",
      value: metrics?.captured_payments_count ?? null,
      kind: "count",
    },
    {
      label: "Customers",
      value: metrics?.customers_count ?? null,
      kind: "count",
    },
    {
      label: "Active products",
      value: metrics?.active_products_count ?? null,
      kind: "count",
    },
    {
      label: "Low-stock variants",
      value: metrics?.low_stock_count ?? null,
      kind: "count",
    },
    {
      label: "Failed payments",
      value: metrics?.failed_payments_count ?? null,
      kind: "count",
    },
  ].filter((card) => card.value !== null || !metrics);
  const maxRevenue = Math.max(
    1,
    ...(metrics?.daily_revenue ? metrics.daily_revenue.map((day) => day.revenue_paise) : []),
  );

  return (
    <main>
      {(ordersResult.error || customersResult.error || metricsError) && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 shadow-sm">
          <p className="font-bold text-sm text-amber-950">Database Permissions Notice</p>
          <p className="mt-1">
            PostgreSQL reported: <span className="font-mono text-[11px] text-red-700">{ordersResult.error?.message || customersResult.error?.message || metricsError?.message}</span>
          </p>
          <p className="mt-1 text-zinc-700">
            To grant full access to tables and sync admin roles, run <code className="font-mono font-semibold bg-amber-100 px-1 py-0.5 rounded text-amber-950">supabase/scripts/setup_admin_and_permissions.sql</code> in your Supabase SQL Editor.
          </p>
        </div>
      )}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
            Ghyamajha control
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Store overview
          </h1>
        </div>
        <form className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-xs font-semibold text-zinc-600">
            Period
            <select
              name="range"
              defaultValue={range.preset}
              className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-zinc-600">
            From
            <input
              type="date"
              name="from"
              defaultValue={range.fromDate}
              className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-zinc-600">
            To
            <input
              type="date"
              name="to"
              defaultValue={range.toDate}
              className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900"
            />
          </label>
          <button className="h-10 rounded-lg bg-zinc-950 px-4 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-zinc-700">
            Apply
          </button>
        </form>
      </header>

      {metricsError || !metrics ? (
        <p
          role="alert"
          className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
        >
          Dashboard data is unavailable. Confirm the database migrations are
          applied and try again.
        </p>
      ) : (
        <>
          <section
            aria-label="Store metrics"
            className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            {summaryCards.map((card) => (
              <article
                key={card.label}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-zinc-500">{card.label}</p>
                <p className="mt-3 text-2xl font-black tracking-tight">
                  {card.kind === "currency"
                    ? formatCurrency(card.value)
                    : card.value === null
                      ? "—"
                      : card.value.toLocaleString("en-IN")}
                </p>
              </article>
            ))}
          </section>

          {context.permissions.includes("payments.read") && (
            <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Daily revenue</h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Captured payments net of recorded refunds
                  </p>
                </div>
                <span className="text-xs font-medium text-zinc-500">
                  {range.from.toLocaleDateString("en-IN")} –{" "}
                  {new Date(range.to.getTime() - 1).toLocaleDateString("en-IN")}
                </span>
              </div>
              <div className="mt-6 flex h-48 items-end gap-1 border-b border-zinc-200">
                {metrics.daily_revenue.map((day) => (
                  <div
                    key={day.date}
                    className="group relative flex h-full min-w-0 flex-1 items-end justify-center"
                    title={`${day.date}: ${formatCurrency(day.revenue_paise)}`}
                  >
                    <div
                      className="w-full max-w-8 rounded-t bg-lime-400 transition-colors group-hover:bg-lime-500"
                      style={{
                        height: `${Math.max(2, (day.revenue_paise / maxRevenue) * 100)}%`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            {canReadOrders && (
              <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
                  <h2 className="font-bold">Recent orders</h2>
                  <Link
                    href="/admin/orders"
                    className="text-xs font-bold uppercase tracking-wider underline underline-offset-4"
                  >
                    View all
                  </Link>
                </div>
                {ordersResult.error ? (
                  <p className="p-5 text-sm text-red-700" role="alert">
                    Recent orders could not be loaded.
                  </p>
                ) : ordersResult.data?.length ? (
                  <div className="divide-y divide-zinc-100">
                    {ordersResult.data.map((order) => (
                      <Link
                        key={order.id}
                        href={`/admin/orders/${order.id}`}
                        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-zinc-50"
                      >
                        <div>
                          <p className="text-sm font-bold">
                            {order.order_number}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {order.customer_name ||
                              order.customer_email ||
                              order.customer_phone}{" "}
                            · {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">
                            {formatCurrency(order.total_paise)}
                          </p>
                          <p className="mt-1 text-xs capitalize text-zinc-500">
                            {order.status.replaceAll("_", " ")} /{" "}
                            {order.payment_status.replaceAll("_", " ")}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="p-5 text-sm text-zinc-600">No orders yet.</p>
                )}
              </section>
            )}

            {canReadCustomers && (
              <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                <div className="border-b border-zinc-200 px-5 py-4">
                  <h2 className="font-bold">Latest customers</h2>
                </div>
                {customersResult.error ? (
                  <p className="p-5 text-sm text-red-700" role="alert">
                    Customer records could not be loaded.
                  </p>
                ) : customersResult.data?.length ? (
                  <div className="divide-y divide-zinc-100">
                    {customersResult.data.map((customer) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between gap-3 px-5 py-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">
                            {customer.full_name || customer.email || "Customer"}
                          </p>
                          <p className="mt-1 truncate text-xs text-zinc-500">
                            {customer.email || "No email on file"}
                          </p>
                        </div>
                        <time className="shrink-0 text-xs text-zinc-500">
                          {new Date(customer.created_at).toLocaleDateString(
                            "en-IN",
                          )}
                        </time>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-5 text-sm text-zinc-600">
                    No customer profiles yet.
                  </p>
                )}
              </section>
            )}
          </div>
        </>
      )}
    </main>
  );
}
