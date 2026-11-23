import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const supplied = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (supplied.length !== expectedBuffer.length || !timingSafeEqual(supplied, expectedBuffer)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let payload: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; method?: string } } } };
  try { payload = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const eventType = payload.event ?? "unknown";
  const paymentEntity = payload.payload?.payment?.entity;
  const eventId = `${eventType}:${paymentEntity?.id ?? paymentEntity?.order_id ?? createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: existing } = await supabase.from("webhook_events").select("id, processed_at").eq("event_id", eventId).maybeSingle();
  if (existing?.processed_at) return NextResponse.json({ status: "ok", duplicate: true });

  const { error: eventError } = await supabase.from("webhook_events").upsert({ event_id: eventId, event_type: eventType, payload, signature_valid: true }, { onConflict: "event_id" });
  if (eventError) return NextResponse.json({ error: "Could not record webhook." }, { status: 500 });

  if (paymentEntity?.order_id) {
    const { data: payment } = await supabase.from("payments").select("id, order_id").eq("provider_order_id", paymentEntity.order_id).maybeSingle();
    if (payment) {
      if (eventType === "payment.captured" || eventType === "order.paid") {
        await supabase.from("payments").update({ provider_payment_id: paymentEntity.id ?? null, status: "captured", method: paymentEntity.method ?? null, captured_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", payment.id);
        await supabase.from("orders").update({ payment_status: "captured", status: "confirmed", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", payment.order_id);
      }
      if (eventType === "payment.failed") {
        await supabase.from("payments").update({ provider_payment_id: paymentEntity.id ?? null, status: "failed", method: paymentEntity.method ?? null, updated_at: new Date().toISOString() }).eq("id", payment.id);
        await supabase.from("orders").update({ payment_status: "failed", updated_at: new Date().toISOString() }).eq("id", payment.order_id);
      }
    }
  }

  await supabase.from("webhook_events").update({ processed_at: new Date().toISOString() }).eq("event_id", eventId);
  return NextResponse.json({ status: "ok" });
}
