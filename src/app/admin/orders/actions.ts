"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminPermission } from "@/lib/admin/server";

const updateSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum([
    "confirmed",
    "processing",
    "packed",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "returned",
  ]),
  note: z.string().trim().max(1000).optional(),
  trackingNumber: z.string().trim().max(100).optional(),
  trackingUrl: z.string().trim().url().or(z.literal("")).optional(),
});

export async function updateOrderStatus(formData: FormData) {
  const parsed = updateSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    note: formData.get("note") ?? "",
    trackingNumber: formData.get("trackingNumber") ?? "",
    trackingUrl: formData.get("trackingUrl") ?? "",
  });

  if (!parsed.success) redirect("/admin/orders?error=invalid_update");

  const { supabase } = await requireAdminPermission("orders.write");
  const { error } = await supabase.rpc("admin_update_order_status", {
    target_order_id: parsed.data.orderId,
    next_status: parsed.data.status,
    internal_note: parsed.data.note || null,
  });

  if (error) {
    console.error("Could not update order status:", error.message);
    redirect(`/admin/orders/${parsed.data.orderId}?error=update_failed`);
  }

  // Update tracking details if provided
  if (parsed.data.trackingNumber || parsed.data.trackingUrl) {
    await supabase
      .from("orders")
      .update({
        tracking_number: parsed.data.trackingNumber || null,
        tracking_url: parsed.data.trackingUrl || null,
      })
      .eq("id", parsed.data.orderId);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  redirect(`/admin/orders/${parsed.data.orderId}?updated=1`);
}
