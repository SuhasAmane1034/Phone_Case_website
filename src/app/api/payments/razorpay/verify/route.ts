import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "node:crypto";
import { sendOrderConfirmationNotification } from "@/lib/notifications/order-confirmation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as null | {
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  };
  if (!body?.razorpay_payment_id || !body.razorpay_order_id || !body.razorpay_signature) {
    return NextResponse.json({ error: "Incomplete payment response." }, { status: 400 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!secret || !keyId || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Payment verification is not configured." }, { status: 503 });
  }

  const expected = createHmac("sha256", secret)
    .update(`${body.razorpay_order_id}:${body.razorpay_payment_id}`)
    .digest("hex");
  const supplied = Buffer.from(body.razorpay_signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (supplied.length !== expectedBuffer.length || !timingSafeEqual(supplied, expectedBuffer)) {
    return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, order_id, amount_paise, provider_order_id, orders(id, order_number, total_paise, payment_status)")
    .eq("provider_order_id", body.razorpay_order_id)
    .maybeSingle();

  if (paymentError || !payment) return NextResponse.json({ error: "Unknown Razorpay order." }, { status: 404 });

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: secret });
    const providerPayment = await razorpay.payments.fetch(body.razorpay_payment_id) as unknown as { status?: string; amount?: number; order_id?: string };
    if (providerPayment.status !== "captured" || providerPayment.order_id !== body.razorpay_order_id || providerPayment.amount !== payment.amount_paise) {
      await supabase.from("payments").update({ provider_payment_id: body.razorpay_payment_id, status: providerPayment.status === "failed" ? "failed" : "authorized", updated_at: new Date().toISOString() }).eq("id", payment.id);
      return NextResponse.json({ error: "Payment is not captured." }, { status: 409 });
    }

    await supabase.from("payments").update({ provider_payment_id: body.razorpay_payment_id, provider_signature: body.razorpay_signature, status: "captured", method: "razorpay", captured_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", payment.id);
    await supabase.from("orders").update({ payment_status: "captured", status: "confirmed", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", payment.order_id);

    const { data: fullOrder } = await supabase
      .from("orders")
      .select("order_number, customer_name, customer_email, customer_phone, total_paise, payment_method, shipping_address, order_items(product_name_snapshot, variant_name_snapshot, quantity, unit_price_paise)")
      .eq("id", payment.order_id)
      .maybeSingle();

    if (fullOrder) {
      try {
        await sendOrderConfirmationNotification({
          orderNumber: fullOrder.order_number,
          customerName: fullOrder.customer_name || "Valued Customer",
          customerEmail: fullOrder.customer_email,
          customerPhone: fullOrder.customer_phone,
          items: (fullOrder.order_items || []).map((i: { product_name_snapshot?: string; variant_name_snapshot?: string; quantity?: number; unit_price_paise?: number }) => ({
            name: i.product_name_snapshot || "GhayMajha Case",
            variant: i.variant_name_snapshot || "Standard",
            quantity: i.quantity || 1,
            price: (i.unit_price_paise || 0) / 100,
          })),
          totalPaise: fullOrder.total_paise,
          paymentMethod: "prepaid_razorpay",
          shippingAddress: fullOrder.shipping_address || {},
        });
      } catch (e) {
        console.error("[Notification] Non-fatal notification error:", e);
      }
    }

    const order = Array.isArray(payment.orders) ? payment.orders[0] : payment.orders;
    return NextResponse.json({ status: "captured", orderNumber: order?.order_number ?? null });
  } catch {
    return NextResponse.json({ error: "Could not confirm payment with Razorpay." }, { status: 502 });
  }
}
