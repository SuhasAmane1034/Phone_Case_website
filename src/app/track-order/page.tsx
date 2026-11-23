import Link from "next/link";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { createClient } from "@/lib/supabase/server";
import { getAdminServiceClient } from "@/lib/admin/server";

export const dynamic = "force-dynamic";

type OrderItem = {
  id: string;
  product_name_snapshot: string;
  variant_name_snapshot: string;
  sku_snapshot?: string | null;
  device_name_snapshot?: string | null;
  colour_snapshot?: string | null;
  quantity: number;
  unit_price_paise: number;
  line_total_paise: number;
};

type Address = {
  fullName?: string;
  phone?: string;
  email?: string;
  house?: string;
  street?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pinCode?: string;
};

type TrackedOrder = {
  id: string;
  order_number: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal_paise: number;
  discount_paise: number;
  shipping_paise: number;
  total_paise: number;
  shipping_address?: Address | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  created_at: string;
  paid_at?: string | null;
  order_items: OrderItem[];
};

const ORDER_STAGES = [
  { key: "pending", label: "Order Placed", desc: "Received and awaiting processing" },
  { key: "confirmed", label: "Confirmed", desc: "Verified and accepted" },
  { key: "processing", label: "Crafting", desc: "Quality preparation & packaging" },
  { key: "packed", label: "Packed", desc: "Sealed in luxury gift boxing" },
  { key: "shipped", label: "Dispatched", desc: "Handed over to courier partner" },
  { key: "out_for_delivery", label: "Out for Delivery", desc: "With local courier agent" },
  { key: "delivered", label: "Delivered", desc: "Safely received at address" },
];

function getStageIndex(status: string) {
  const normalized = status.toLowerCase();
  const index = ORDER_STAGES.findIndex((s) => s.key === normalized);
  if (index >= 0) return index;
  if (normalized === "completed") return 6;
  return 0;
}

function formatCurrency(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function formatDate(isoString: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoString));
}

function calculateEstimatedDelivery(createdIso: string) {
  const date = new Date(createdIso);
  const minDate = new Date(date);
  minDate.setDate(minDate.getDate() + 3);
  const maxDate = new Date(date);
  maxDate.setDate(maxDate.getDate() + 5);

  const formatter = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
  });
  return `${formatter.format(minDate)} – ${formatter.format(maxDate)}`;
}

async function lookupOrder(orderParam: string, contactParam: string): Promise<{ order: TrackedOrder | null; error: string | null }> {
  const cleanOrderNum = orderParam.trim().replace(/^#/, "").toUpperCase();
  const cleanContact = contactParam.trim().toLowerCase();
  const numericContact = cleanContact.replace(/\D/g, "");

  // Use service client if available to bypass any RLS limitations, otherwise standard client
  const serviceClient = getAdminServiceClient();
  const supabase = serviceClient ?? (await createClient());

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      customer_name,
      customer_email,
      customer_phone,
      status,
      payment_status,
      payment_method,
      subtotal_paise,
      discount_paise,
      shipping_paise,
      total_paise,
      shipping_address,
      tracking_number,
      tracking_url,
      created_at,
      paid_at,
      order_items (
        id,
        product_name_snapshot,
        variant_name_snapshot,
        sku_snapshot,
        device_name_snapshot,
        colour_snapshot,
        quantity,
        unit_price_paise,
        line_total_paise
      )
    `)
    .ilike("order_number", cleanOrderNum)
    .maybeSingle();

  if (error || !data) {
    return { order: null, error: `No order found with number "${cleanOrderNum}". Please check your order ID.` };
  }

  const rawOrder = data as unknown as TrackedOrder;

  // Validate contact against email, phone, or address fields
  const orderEmail = (rawOrder.customer_email ?? rawOrder.shipping_address?.email ?? "").toLowerCase();
  const orderPhone = (rawOrder.customer_phone ?? rawOrder.shipping_address?.phone ?? "").replace(/\D/g, "");

  const emailMatches = Boolean(cleanContact && orderEmail && orderEmail.includes(cleanContact));
  const phoneMatches = Boolean(numericContact && orderPhone && (orderPhone.endsWith(numericContact) || numericContact.endsWith(orderPhone)));

  if (!emailMatches && !phoneMatches) {
    return {
      order: null,
      error: "The provided contact information (email or phone) does not match the records for this order.",
    };
  }

  return { order: rawOrder, error: null };
}

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; contact?: string }>;
}) {
  const { order: orderQuery, contact: contactQuery } = await searchParams;
  let trackedOrder: TrackedOrder | null = null;
  let lookupError: string | null = null;

  if (orderQuery && contactQuery) {
    const result = await lookupOrder(orderQuery, contactQuery);
    trackedOrder = result.order;
    lookupError = result.error;
  }

  const currentStageIndex = trackedOrder ? getStageIndex(trackedOrder.status) : 0;
  const isCancelled = trackedOrder?.status.toLowerCase() === "cancelled";
  const isReturned = trackedOrder?.status.toLowerCase() === "returned";

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FDFBF7] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Page Header */}
          <div className="mb-10 text-center">
            <span className="inline-block rounded-full bg-amber-100/80 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.25em] text-amber-900">
              GhayMajha Concierge
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-5xl">
              Track Your Order
            </h1>
            <p className="mt-3 text-sm text-zinc-600 sm:text-base">
              Enter your order reference and registered contact to view real-time fulfillment progress.
            </p>
          </div>

          {/* Search Card */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
            <form method="GET" action="/track-order" className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
              <div>
                <label htmlFor="order" className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Order Number
                </label>
                <input
                  id="order"
                  name="order"
                  type="text"
                  required
                  defaultValue={orderQuery ?? ""}
                  placeholder="e.g. GH1234567890"
                  className="mt-1.5 h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-900 uppercase placeholder:normal-case focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label htmlFor="contact" className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Email or Phone
                </label>
                <input
                  id="contact"
                  name="contact"
                  type="text"
                  required
                  defaultValue={contactQuery ?? ""}
                  placeholder="Registered email or mobile"
                  className="mt-1.5 h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-black px-6 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 sm:w-auto"
                >
                  Track Order
                </button>
              </div>
            </form>

            {lookupError && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <p className="font-semibold">Unable to locate shipment</p>
                <p className="mt-1 text-xs text-red-700">{lookupError}</p>
              </div>
            )}
          </div>

          {/* Order Details & Progress Banner */}
          {trackedOrder && (
            <div className="mt-10 space-y-8 animate-fadeIn">
              {/* Order Status Header Card */}
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 pb-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Order Reference</span>
                    <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">
                      #{trackedOrder.order_number}
                    </h2>
                    <p className="mt-1.5 text-xs text-zinc-500">
                      Placed on {formatDate(trackedOrder.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        isCancelled
                          ? "bg-red-100 text-red-800"
                          : isReturned
                            ? "bg-amber-100 text-amber-800"
                            : trackedOrder.status === "delivered"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-zinc-900 text-white"
                      }`}
                    >
                      {trackedOrder.status.replaceAll("_", " ")}
                    </span>

                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        trackedOrder.payment_status === "captured" || trackedOrder.payment_status === "paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : trackedOrder.payment_method === "cod"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {trackedOrder.payment_method === "cod"
                        ? "Cash on Delivery"
                        : trackedOrder.payment_status === "captured" || trackedOrder.payment_status === "paid"
                          ? "Payment Verified"
                          : "Payment Pending"}
                    </span>
                  </div>
                </div>

                {/* Estimated Delivery Notification */}
                {!isCancelled && !isReturned && (
                  <div className="mt-6 flex flex-wrap items-center justify-between rounded-xl bg-amber-50/60 p-4 text-sm text-amber-950 border border-amber-200/60">
                    <div className="flex items-center gap-3">
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                      <p className="font-semibold text-xs uppercase tracking-wider text-amber-900">
                        {trackedOrder.status === "delivered" ? "Delivered Successfully" : "Estimated Arrival"}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-amber-950">
                      {trackedOrder.status === "delivered"
                        ? formatDate(trackedOrder.created_at)
                        : calculateEstimatedDelivery(trackedOrder.created_at)}
                    </p>
                  </div>
                )}

                {/* Cancelled Alert Banner */}
                {isCancelled && (
                  <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <p className="font-bold">This order was cancelled</p>
                    <p className="mt-1 text-xs text-red-700">
                      If you have already made a payment, any refund will be processed back to your original payment method within 5–7 business days.
                    </p>
                  </div>
                )}

                {/* 7-Step Luxury Fulfillment Timeline */}
                {!isCancelled && (
                  <div className="mt-10">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">
                      Fulfillment Journey
                    </h3>

                    {/* Desktop Pipeline */}
                    <div className="hidden sm:grid sm:grid-cols-7 gap-2 relative">
                      {/* Connecting Line */}
                      <div className="absolute top-4 left-[7%] right-[7%] h-0.5 bg-zinc-200 -z-0" />
                      <div
                        className="absolute top-4 left-[7%] h-0.5 bg-black transition-all duration-500 -z-0"
                        style={{ width: `${(currentStageIndex / (ORDER_STAGES.length - 1)) * 86}%` }}
                      />

                      {ORDER_STAGES.map((stage, idx) => {
                        const isPast = idx < currentStageIndex;
                        const isCurrent = idx === currentStageIndex;
                        return (
                          <div key={stage.key} className="flex flex-col items-center text-center relative z-10">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                                isPast
                                  ? "bg-black text-white"
                                  : isCurrent
                                    ? "bg-black text-white ring-4 ring-amber-300/60 shadow-md"
                                    : "bg-white border-2 border-zinc-300 text-zinc-400"
                              }`}
                            >
                              {isPast ? "✓" : idx + 1}
                            </div>
                            <p
                              className={`mt-2.5 text-xs font-bold uppercase tracking-wider ${
                                isCurrent ? "text-zinc-950" : isPast ? "text-zinc-700" : "text-zinc-400"
                              }`}
                            >
                              {stage.label}
                            </p>
                            <p className="mt-0.5 text-[10px] text-zinc-500 leading-tight">
                              {stage.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Mobile Stepper */}
                    <div className="sm:hidden space-y-4">
                      {ORDER_STAGES.map((stage, idx) => {
                        const isPast = idx < currentStageIndex;
                        const isCurrent = idx === currentStageIndex;
                        return (
                          <div key={stage.key} className="flex items-start gap-3">
                            <div
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                isPast
                                  ? "bg-black text-white"
                                  : isCurrent
                                    ? "bg-black text-white ring-2 ring-amber-300"
                                    : "bg-zinc-100 text-zinc-400"
                              }`}
                            >
                              {isPast ? "✓" : idx + 1}
                            </div>
                            <div>
                              <p className={`text-xs font-bold uppercase tracking-wider ${isCurrent ? "text-black" : "text-zinc-600"}`}>
                                {stage.label}
                              </p>
                              <p className="text-[11px] text-zinc-500">{stage.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Carrier & Tracking Link (if available) */}
                {trackedOrder.tracking_number && (
                  <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Courier Tracking / AWB</p>
                        <p className="mt-1 font-mono text-base font-bold text-zinc-900">{trackedOrder.tracking_number}</p>
                      </div>
                      {trackedOrder.tracking_url && (
                        <a
                          href={trackedOrder.tracking_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-zinc-800 transition"
                        >
                          Track on Courier Website ↗
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Items & Summary Grid */}
              <div className="grid gap-8 lg:grid-cols-3">
                {/* Items in this Order */}
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm lg:col-span-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
                    Items in this Order ({trackedOrder.order_items.length})
                  </h3>

                  <div className="divide-y divide-zinc-100">
                    {trackedOrder.order_items.map((item) => (
                      <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-bold text-sm text-zinc-900">{item.product_name_snapshot}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {item.device_name_snapshot && <span>{item.device_name_snapshot} • </span>}
                            {item.colour_snapshot && <span>{item.colour_snapshot} • </span>}
                            <span>Qty: {item.quantity}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-zinc-900">{formatCurrency(item.line_total_paise)}</p>
                          {item.quantity > 1 && (
                            <p className="text-[11px] text-zinc-400">
                              {formatCurrency(item.unit_price_paise)} each
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Address */}
                  {trackedOrder.shipping_address && (
                    <div className="mt-8 border-t border-zinc-100 pt-6">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
                        Delivery Destination
                      </h4>
                      <div className="rounded-xl bg-zinc-50 p-4 text-xs text-zinc-700 leading-relaxed">
                        <p className="font-bold text-zinc-900 text-sm">{trackedOrder.shipping_address.fullName}</p>
                        <p className="mt-1">
                          {trackedOrder.shipping_address.house && `${trackedOrder.shipping_address.house}, `}
                          {trackedOrder.shipping_address.street}
                        </p>
                        {trackedOrder.shipping_address.landmark && (
                          <p>Landmark: {trackedOrder.shipping_address.landmark}</p>
                        )}
                        <p>
                          {trackedOrder.shipping_address.city}, {trackedOrder.shipping_address.state} — {trackedOrder.shipping_address.pinCode}
                        </p>
                        <p className="mt-2 text-zinc-500">Phone: {trackedOrder.shipping_address.phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Summary */}
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm self-start">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
                    Price Breakdown
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-zinc-600">
                      <span>Subtotal</span>
                      <span>{formatCurrency(trackedOrder.subtotal_paise)}</span>
                    </div>

                    {trackedOrder.discount_paise > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Discount</span>
                        <span>-{formatCurrency(trackedOrder.discount_paise)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-zinc-600">
                      <span>Shipping</span>
                      <span>{trackedOrder.shipping_paise === 0 ? "Complimentary" : formatCurrency(trackedOrder.shipping_paise)}</span>
                    </div>

                    <div className="border-t border-zinc-200 pt-3 flex justify-between font-black text-base text-zinc-950">
                      <span>Total</span>
                      <span>{formatCurrency(trackedOrder.total_paise)}</span>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-zinc-100 pt-4 text-center">
                    <Link
                      href="/collections/all"
                      className="block w-full rounded-xl border border-zinc-300 py-3 text-xs font-bold uppercase tracking-wider text-zinc-800 transition hover:bg-zinc-100"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}