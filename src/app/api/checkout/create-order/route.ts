import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { catalogue } from "@/data/catalog";
import { getStorefrontProducts } from "@/lib/storefront/products";
import Razorpay from "razorpay";
import { sendOrderConfirmationNotification } from "@/lib/notifications/order-confirmation";

const checkoutSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.email().optional().or(z.literal("")),
  mobile: z.string().regex(/^[6-9]\d{9}$/),
  house: z.string().trim().min(2).max(200),
  street: z.string().trim().min(2).max(200),
  landmark: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pinCode: z.string().regex(/^\d{6}$/),
  paymentMethod: z.enum(["razorpay", "cod"]),
  couponCode: z.string().trim().max(40).optional(),
  items: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(100) })).min(1).max(200),
});

export async function POST(request: Request) {
  const parsed = checkoutSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Please check your checkout information.", issues: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const allProducts = await getStorefrontProducts();
  const fullList = [...allProducts, ...catalogue];

  const lines = data.items.flatMap((item) => {
    for (const product of fullList) {
      const variant = product.variants?.find(
        (entry) => entry.id === item.variantId
      );
      if (variant) return [{ item, product, variant }];
    }

    for (const product of fullList) {
      if (
        item.variantId.startsWith(product.slug) ||
        (product.id && item.variantId.startsWith(product.id))
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
        return [{ item, product, variant: fallbackVariant }];
      }
    }

    return [];
  });

  if (lines.length !== data.items.length) return NextResponse.json({ error: "One or more items are unavailable or exceed available stock." }, { status: 409 });

  const subtotalPaise = lines.reduce((total, line) => total + line.variant.price * 100 * line.item.quantity, 0);
  const shippingPaise = subtotalPaise >= 149900 ? 0 : 9900;
  let discountPaise = 0;
  if (data.couponCode?.toUpperCase() === "GY10") discountPaise = Math.round(subtotalPaise * 0.1);
  const totalPaise = subtotalPaise - discountPaise + shippingPaise;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Checkout database is not configured yet. Please configure your Supabase keys in .env.local." },
      { status: 503 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const orderId = crypto.randomUUID();
  const orderNumber = `GH${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 100).toString().padStart(2, "0")}`;
  const address = { fullName: data.fullName, phone: data.mobile, email: data.email || null, house: data.house, street: data.street, landmark: data.landmark || null, city: data.city, state: data.state, pinCode: data.pinCode };

  const isValidUuid = (val?: string) =>
    Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

  // 1. Insert order with pre-generated UUID (avoids RLS returning errors)
  const { error: orderError } = await supabase
    .from("orders")
    .insert({
      id: orderId,
      order_number: orderNumber,
      customer_name: data.fullName,
      customer_email: data.email || null,
      customer_phone: data.mobile,
      status: "pending",
      payment_status: "pending",
      payment_method: data.paymentMethod,
      subtotal_paise: subtotalPaise,
      discount_paise: discountPaise,
      shipping_paise: shippingPaise,
      total_paise: totalPaise,
      shipping_address: address,
      billing_address: address,
    });

  if (orderError) {
    console.error("Supabase Order Creation Error:", orderError);
    return NextResponse.json(
      {
        error: `Database error: ${orderError.message}. (Please run supabase/scripts/setup_admin_and_permissions.sql in your Supabase SQL Editor or add SUPABASE_SERVICE_ROLE_KEY to .env.local)`,
      },
      { status: 500 }
    );
  }

  const order = {
    id: orderId,
    order_number: orderNumber,
    total_paise: totalPaise,
  };

  const orderItems = lines.map((line) => ({
    order_id: order.id,
    product_id: isValidUuid(line.product.id) ? line.product.id : null,
    product_name_snapshot: line.product.name,
    variant_name_snapshot: line.variant.name,
    sku_snapshot: line.variant.sku,
    device_name_snapshot: line.variant.device,
    colour_snapshot: line.variant.colour,
    quantity: line.item.quantity,
    unit_price_paise: line.variant.price * 100,
    line_total_paise: line.variant.price * 100 * line.item.quantity,
  }));

  const { error: itemError } = await supabase.from("order_items").insert(orderItems);
  if (itemError) {
    console.error("Supabase Order Items Error:", itemError);
    return NextResponse.json(
      { error: `Could not save order items: ${itemError.message}` },
      { status: 500 }
    );
  }

  if (data.paymentMethod === "cod") {
    // Send email & message notification for COD order
    try {
      await sendOrderConfirmationNotification({
        orderNumber: order.order_number,
        customerName: data.fullName,
        customerEmail: data.email || null,
        customerPhone: data.mobile,
        items: lines.map((l) => ({
          name: l.product.name,
          variant: `${l.variant.device} - ${l.variant.colour}`,
          quantity: l.item.quantity,
          price: l.variant.price,
        })),
        totalPaise: order.total_paise,
        paymentMethod: "cod",
        shippingAddress: address,
      });
    } catch (notifErr) {
      console.error("[Notification] Non-fatal notification error:", notifErr);
    }

    return NextResponse.json({ orderNumber: order.order_number, totalPaise: order.total_paise, status: "cod_pending" });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return NextResponse.json({ error: "Razorpay test credentials are not configured yet." }, { status: 503 });

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  try {
    const razorpayOrder = await razorpay.orders.create({ amount: totalPaise, currency: "INR", receipt: order.order_number, notes: { ghyamajha_order_id: order.id } });
    const { error: paymentError } = await supabase.from("payments").insert({ order_id: order.id, provider: "razorpay", provider_order_id: razorpayOrder.id, amount_paise: totalPaise, currency: "INR", status: "created" });
    if (paymentError) return NextResponse.json({ error: "Could not register the payment order." }, { status: 500 });

    return NextResponse.json({ orderNumber: order.order_number, totalPaise: order.total_paise, status: "payment_pending", razorpayKeyId: keyId, razorpayOrderId: razorpayOrder.id });
  } catch {
    return NextResponse.json({ error: "Razorpay could not create the payment order. Please retry." }, { status: 502 });
  }
}
