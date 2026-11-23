"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { catalogue, type CatalogProduct, type ProductVariant } from "@/data/catalog";

type CheckoutStoredItem = {
  variantId: string;
  quantity: number;
  product?: CatalogProduct;
  variant?: ProductVariant;
};

export default function CheckoutPage() {
  const [items, setItems] = useState<CheckoutStoredItem[]>([]);
  const [catalog, setCatalog] = useState<CatalogProduct[]>(catalogue);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderNumber: string;
    contact: string;
    totalPaise: number;
    paymentMethod: string;
  } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setItems(JSON.parse(localStorage.getItem("ghyamajha-cart") ?? "[]"));
      } catch {
        setItems([]);
      }
    }, 0);

    fetch("/api/products")
      .then((res) => res.json())
      .then((data: CatalogProduct[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setCatalog(data);
        }
      })
      .catch(() => {});

    return () => window.clearTimeout(timer);
  }, []);

  const lines = useMemo(() => {
    return items.flatMap((item: CheckoutStoredItem) => {
      if (item.product && item.variant) {
        return [{ ...item, product: item.product, variant: item.variant }];
      }

      const fullList = [...catalog, ...catalogue];
      for (const product of fullList) {
        const variant = product.variants?.find(
          (entry) => entry.id === item.variantId
        );
        if (variant) return [{ ...item, product, variant }];
      }

      for (const product of fullList) {
        if (
          item.variantId?.startsWith(product.slug) ||
          (product.id && item.variantId?.startsWith(product.id))
        ) {
          const fallbackVariant = product.variants?.[0] || {
            id: item.variantId,
            name: `${product.name} — Standard`,
            sku: `SKU-${product.slug}`,
            colour: "Default",
            colourHex: "#171717",
            device: product.compatibility || "Universal",
            price: product.price,
            originalPrice: product.originalPrice,
            stock: 50,
          };
          return [{ ...item, product, variant: fallbackVariant }];
        }
      }

      return [];
    });
  }, [items, catalog]);
  const subtotal = lines.reduce(
    (total, line) => total + line.variant.price * line.quantity,
    0,
  );
  const shipping = subtotal >= 1499 ? 0 : 99;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      fullName: String(form.get("fullName")),
      email: String(form.get("email") ?? ""),
      mobile: String(form.get("mobile")),
      house: String(form.get("house")),
      street: String(form.get("street")),
      landmark: String(form.get("landmark") ?? ""),
      city: String(form.get("city")),
      state: String(form.get("state")),
      pinCode: String(form.get("pinCode")),
      paymentMethod,
      couponCode: String(form.get("couponCode") ?? ""),
      items,
    };

    try {
      const response = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Checkout could not be completed.");
      if (result.status === "cod_pending") {
        localStorage.removeItem("ghyamajha-cart");
        window.dispatchEvent(new Event("ghyamajha-cart-updated"));
        setConfirmedOrder({
          orderNumber: result.orderNumber,
          contact: payload.email || payload.mobile,
          totalPaise: result.totalPaise,
          paymentMethod: "Cash on Delivery",
        });
        setSubmitting(false);
        return;
      }

      if (!result.razorpayKeyId || !result.razorpayOrderId)
        throw new Error("Razorpay checkout information was not returned.");
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay Checkout could not be loaded.");
      const RazorpayConstructor = (
        window as unknown as {
          Razorpay: new (options: Record<string, unknown>) => { open(): void };
        }
      ).Razorpay;
      const checkout = new RazorpayConstructor({
        key: result.razorpayKeyId,
        amount: result.totalPaise,
        currency: "INR",
        name: "GHYAMAJHA",
        description: `Order ${result.orderNumber}`,
        order_id: result.razorpayOrderId,
        prefill: {
          name: payload.fullName,
          email: payload.email,
          contact: payload.mobile,
        },
        theme: { color: "#090909" },
        handler: async (payment: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const verification = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payment),
          });
          const verified = await verification.json();
          if (!verification.ok) {
            setMessage(verified.error || "Payment could not be verified.");
            return;
          }
          localStorage.removeItem("ghyamajha-cart");
          window.dispatchEvent(new Event("ghyamajha-cart-updated"));
          setConfirmedOrder({
            orderNumber: verified.orderNumber ?? result.orderNumber,
            contact: payload.email || payload.mobile,
            totalPaise: result.totalPaise,
            paymentMethod: "Prepaid via Razorpay",
          });
        },
        modal: {
          ondismiss: () =>
            setMessage(
              "Payment was cancelled. Your order remains available for retry.",
            ),
        },
      });
      checkout.open();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Checkout could not be completed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function loadRazorpay() {
    if (document.querySelector('script[data-razorpay="standard"]')) return true;
    return new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.dataset.razorpay = "standard";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  return (
    <>
      <Header />

      {/* Mobile Collapsible Order Summary Drawer (Shopify / Seasonmade Style) */}
      {lines.length > 0 && !confirmedOrder && (
        <div className="lg:hidden border-b border-zinc-200 bg-[#F7F6F2] px-4 py-3.5 transition">
          <button
            type="button"
            onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
            className="flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-900"
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>{mobileSummaryOpen ? "Hide order summary" : "Show order summary"}</span>
              <span className="text-[10px] text-zinc-500">{mobileSummaryOpen ? "▲" : "▼"}</span>
            </span>
            <span className="text-sm font-black text-zinc-950">
              ₹{(subtotal + shipping).toLocaleString("en-IN")}
            </span>
          </button>

          {mobileSummaryOpen && (
            <div className="mt-4 pt-4 border-t border-zinc-200 animate-fadeIn space-y-3">
              {lines.map((line) => (
                <div className="flex items-center gap-3 text-xs" key={line.variantId}>
                  <div className="relative h-14 w-12 shrink-0 rounded-lg bg-zinc-200 overflow-hidden flex items-center justify-center p-1 border border-zinc-300">
                    {line.product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={line.product.imageUrl} alt={line.product.name} className="h-full w-auto object-contain" />
                    ) : (
                      <span className="text-[10px] font-bold">GY</span>
                    )}
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-black px-1 text-[9px] font-bold text-white">
                      {line.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-900 truncate">{line.product.name}</p>
                    <p className="text-[11px] text-zinc-500">{line.variant.name}</p>
                  </div>
                  <strong className="text-zinc-950">
                    ₹{(line.variant.price * line.quantity).toLocaleString("en-IN")}
                  </strong>
                </div>
              ))}

              <div className="pt-3 border-t border-zinc-200 space-y-1.5 text-xs text-zinc-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-zinc-950 pt-1.5 border-t border-zinc-200">
                  <span>Total</span>
                  <span>₹{(subtotal + shipping).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <main className="checkout-page bg-[#FDFBF7]">
        <section className="checkout-form">
          <Link className="checkout-brand text-xs font-black tracking-[0.2em] text-zinc-900 uppercase" href="/">
            GHYAMAJHA
          </Link>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-950 mb-6">
            Express Checkout
          </h1>

          {message && (
            <p
              className={
                message.startsWith("Order") || message.startsWith("Payment captured")
                  ? "checkout-success"
                  : "checkout-error"
              }
            >
              {message}
            </p>
          )}

          {confirmedOrder ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8 text-center my-6 shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white text-2xl font-bold shadow-md">
                ✓
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-emerald-800">
                Order Confirmed
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
                Thank You For Your Purchase
              </h2>
              <p className="mt-2 text-sm text-zinc-700">
                Order Reference: <strong className="font-mono text-zinc-900 font-bold">#{confirmedOrder.orderNumber}</strong>
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {confirmedOrder.paymentMethod} • Total: ₹{(confirmedOrder.totalPaise / 100).toLocaleString("en-IN")}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href={`/track-order?order=${confirmedOrder.orderNumber}&contact=${encodeURIComponent(confirmedOrder.contact)}`}
                  className="rounded-xl bg-black px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-zinc-800 transition"
                >
                  Track Your Order Progress →
                </Link>
                <Link
                  href="/collections/all"
                  className="rounded-xl border border-zinc-300 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-800 hover:bg-zinc-50 transition"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          ) : lines.length === 0 ? (
            <div className="checkout-empty">
              <p className="text-zinc-600">Your bag is empty.</p>
              <Link className="button button-secondary mt-4 inline-block" href="/collections/all">
                Continue shopping
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-6">
              <fieldset>
                <legend>1. Contact Information</legend>
                <div className="form-grid">
                  <label className="span-2">
                    Full name
                    <input name="fullName" required minLength={2} placeholder="Your full name" />
                  </label>
                  <label className="span-2">
                    Mobile number (for delivery SMS & updates)
                    <input
                      name="mobile"
                      required
                      inputMode="numeric"
                      pattern="[6-9][0-9]{9}"
                      placeholder="10-digit mobile number"
                    />
                  </label>
                  <label className="span-2">
                    Email address (optional, for tracking receipt)
                    <input name="email" type="email" placeholder="name@example.com" />
                  </label>
                </div>
              </fieldset>

              <fieldset>
                <legend>2. Shipping Address</legend>
                <div className="form-grid">
                  <label className="span-2">
                    Flat / House no. / Building name
                    <input name="house" required placeholder="e.g. Flat 402, Building A" />
                  </label>
                  <label className="span-2">
                    Street address / Area
                    <input name="street" required placeholder="Street, Sector, or Colony" />
                  </label>
                  <label className="span-2">
                    Landmark (optional)
                    <input name="landmark" placeholder="Near metro station, school, etc." />
                  </label>
                  <div className="span-2 grid grid-cols-2 gap-3">
                    <label>
                      City
                      <input name="city" required placeholder="City" />
                    </label>
                    <label>
                      State
                      <input name="state" required placeholder="State" />
                    </label>
                  </div>
                  <label className="span-2">
                    PIN code
                    <input
                      name="pinCode"
                      required
                      pattern="[0-9]{6}"
                      inputMode="numeric"
                      placeholder="6-digit postal code"
                    />
                  </label>
                </div>
              </fieldset>

              <fieldset>
                <legend>3. Payment Method</legend>
                <div className="payment-options">
                  <label className={`cursor-pointer ${paymentMethod === "razorpay" ? "border-2 border-black bg-zinc-50/80" : ""}`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "razorpay"}
                      onChange={() => setPaymentMethod("razorpay")}
                      className="h-4 w-4 accent-black"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-sm font-bold text-zinc-950">Razorpay Secure Online</strong>
                        <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">Fast & Secure</span>
                      </div>
                      <small className="text-xs text-zinc-500 block mt-0.5">UPI (Google Pay, PhonePe, Paytm), Cards, Netbanking</small>
                    </div>
                  </label>
                  <label className={`cursor-pointer ${paymentMethod === "cod" ? "border-2 border-black bg-zinc-50/80" : ""}`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="h-4 w-4 accent-black"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-sm font-bold text-zinc-950">Cash on Delivery (COD)</strong>
                        <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-200 px-2 py-0.5 rounded-full">Pay on arrival</span>
                      </div>
                      <small className="text-xs text-zinc-500 block mt-0.5">Pay in cash or UPI when parcel is delivered</small>
                    </div>
                  </label>
                </div>
              </fieldset>

              <fieldset>
                <legend>4. Promotional Discount</legend>
                <div className="coupon">
                  <input name="couponCode" placeholder="Discount code (e.g. GY10)" />
                  <button type="button" onClick={() => setMessage("Coupon validated at calculation.")}>Apply</button>
                </div>
              </fieldset>

              <button
                type="submit"
                style={{ backgroundColor: "#000000", color: "#ffffff" }}
                className="button button-primary checkout-submit !bg-black !text-white font-black text-sm uppercase tracking-wider py-4 rounded-xl shadow-lg hover:!bg-zinc-800 transition active:scale-95 cursor-pointer"
                disabled={submitting}
              >
                {submitting ? "Processing Order…" : `Place Order • ₹${(subtotal + shipping).toLocaleString("en-IN")}`}
              </button>
            </form>
          )}
        </section>

        {/* Desktop Sticky Order Summary (Hidden on Mobile) */}
        <aside className="checkout-summary hidden lg:block lg:sticky lg:top-16 self-start">
          <h2>Order summary ({lines.length})</h2>
          {lines.map((line) => (
            <div className="checkout-line" key={line.variantId}>
              <div className="checkout-thumb">
                {line.product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={line.product.imageUrl} alt={line.product.name} className="h-full w-auto object-contain" />
                ) : (
                  <div className={`phone-case phone-case-${line.product.tone} w-8 h-12 rounded`} />
                )}
                <span>{line.quantity}</span>
              </div>
              <div>
                <strong>{line.product.name}</strong>
                <small>{line.variant.name}</small>
              </div>
              <b>
                ₹{(line.variant.price * line.quantity).toLocaleString("en-IN")}
              </b>
            </div>
          ))}
          <div className="checkout-totals">
            <div>
              <span>Subtotal</span>
              <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
            </div>
            <div>
              <span>Shipping</span>
              <strong>{shipping === 0 ? "Free" : `₹${shipping}`}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>₹{(subtotal + shipping).toLocaleString("en-IN")}</strong>
            </div>
          </div>
        </aside>
      </main>
      <Footer />
    </>
  );
}
