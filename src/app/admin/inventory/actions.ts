"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminPermission } from "@/lib/admin/server";

const adjustmentSchema = z.object({
  variantId: z.string().uuid(),
  delta: z.coerce.number().int().min(-100000).max(100000).refine((value) => value !== 0),
  reason: z.string().trim().min(3).max(500),
});

export async function adjustInventory(formData: FormData) {
  const parsed = adjustmentSchema.safeParse({
    variantId: formData.get("variantId"),
    delta: formData.get("delta"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) redirect("/admin/inventory?error=invalid_adjustment");

  const { supabase } = await requireAdminPermission("inventory.write");
  const { error } = await supabase.rpc("adjust_inventory", {
    target_variant_id: parsed.data.variantId,
    quantity_delta: parsed.data.delta,
    adjustment_reason: parsed.data.reason,
  });
  if (error) {
    console.error("Could not adjust inventory:", error.message);
    redirect("/admin/inventory?error=adjustment_failed");
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  redirect("/admin/inventory?updated=1");
}
