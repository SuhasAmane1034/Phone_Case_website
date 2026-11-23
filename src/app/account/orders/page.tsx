import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

export default async function AccountOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=%2Faccount%2Forders");

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, payment_status, payment_method, total_paise, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) console.error("Could not load account orders:", error);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16">
      <Link
        href="/account"
        className="text-sm font-semibold text-zinc-600 hover:text-black"
      >
        ← My account
      </Link>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
            Your GHYAMAJHA purchases
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Order history
          </h1>
        </div>
        <Link
          href="/collections/all"
          className="rounded-full bg-black px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-zinc-700"
        >
          Continue shopping
        </Link>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-10 rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800"
        >
          We couldn&apos;t load your orders right now. Please try again later.
        </p>
      ) : orders.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-zinc-300 p-10 text-center">
          <h2 className="text-xl font-bold">No orders yet</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Your confirmed purchases will appear here.
          </p>
          <Link
            href="/collections/all"
            className="mt-6 inline-flex rounded-full border border-black px-5 py-3 text-xs font-bold uppercase tracking-wider transition hover:bg-black hover:text-white"
          >
            Explore the collection
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-xl border border-zinc-200 p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Order {order.order_number}
                  </p>
                  <p className="mt-2 text-sm text-zinc-600">
                    {new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "medium",
                    }).format(new Date(order.created_at))}
                  </p>
                </div>
                <strong className="text-lg">
                  ₹
                  {(order.total_paise / 100).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </strong>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
                <div className="flex flex-wrap gap-2 text-xs font-semibold capitalize">
                  <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-900">
                    {formatStatus(order.status)}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-700">
                    Payment: {formatStatus(order.payment_status)}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-700">
                    {formatStatus(order.payment_method)}
                  </span>
                </div>
                <Link
                  href={`/track-order?order=${order.order_number}&contact=${encodeURIComponent(user.email ?? "")}`}
                  className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-black hover:text-amber-800 transition-colors"
                >
                  Track Order →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
