"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin/server";

function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/collections/[slug]", "page");
  revalidatePath("/product/[slug]", "page");
  revalidatePath("/search");
  revalidatePath("/admin/products");
  revalidatePath("/admin");
}

export async function saveProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  if (!slug && name) {
    slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const category_id = String(formData.get("category_id") ?? "").trim() || null;
  const short_description =
    String(formData.get("short_description") ?? "").trim() || null;
  const description =
    String(formData.get("description") ?? "").trim() || null;
  const regularPriceInr = parseFloat(String(formData.get("regular_price") ?? "0"));
  const salePriceInrStr = String(formData.get("sale_price") ?? "").trim();
  const salePriceInr = salePriceInrStr ? parseFloat(salePriceInrStr) : null;

  const is_active = formData.get("is_active") === "true";
  const is_featured = formData.get("is_featured") === "true";
  const is_bestseller = formData.get("is_bestseller") === "true";
  const is_new_arrival = formData.get("is_new_arrival") === "true";

  if (!name || isNaN(regularPriceInr) || regularPriceInr <= 0) {
    redirect("/admin/products?error=invalid_data");
  }

  const regular_price_paise = Math.round(regularPriceInr * 100);
  const sale_price_paise =
    salePriceInr !== null && !isNaN(salePriceInr) && salePriceInr > 0
      ? Math.round(salePriceInr * 100)
      : null;

  if (sale_price_paise !== null && sale_price_paise > regular_price_paise) {
    redirect("/admin/products?error=sale_price_too_high");
  }

  const { supabase } = await requireAdminPermission("catalog.write");

  // 1. Collect all uploaded image files
  const rawFiles = formData.getAll("image_files") as File[];
  const singleFile = formData.get("image_file") as File | null;
  if (singleFile && singleFile.size > 0 && !rawFiles.includes(singleFile)) {
    rawFiles.push(singleFile);
  }
  const imageFiles = rawFiles.filter(
    (f) => f && typeof f.size === "number" && f.size > 0 && typeof f.name === "string"
  );

  // 2. Upload ALL files simultaneously in parallel to Supabase Storage
  const uploadPromises = imageFiles.map(async (file, i) => {
    try {
      const fileExt = file.name.split(".").pop() || "png";
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileName = `${slug || "product"}-${Date.now()}-${i + 1}-${randomSuffix}.${fileExt}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, buffer, {
          contentType: file.type || "image/png",
          upsert: true,
        });

      if (uploadError) {
        console.error(`Storage upload error for "${file.name}":`, uploadError.message);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      return urlData?.publicUrl ?? null;
    } catch (err) {
      console.error(`Failed uploading file "${file.name}":`, err);
      return null;
    }
  });

  const uploadedUrls = await Promise.all(uploadPromises);

  // 3. Reconstruct all product images from manifest
  const allImages: { url: string; is_primary: boolean; position: number }[] = [];

  const manifestStr = String(formData.get("images_manifest") ?? "").trim();
  let manifest: { type?: string; url?: string; fileIndex?: number; is_primary?: boolean }[] = [];
  if (manifestStr) {
    try {
      const parsed = JSON.parse(manifestStr);
      if (Array.isArray(parsed)) {
        manifest = parsed;
      }
    } catch {}
  }

  if (manifest.length > 0) {
    manifest.forEach((item) => {
      if (item.type === "url" && item.url && item.url.trim()) {
        allImages.push({
          url: item.url.trim(),
          is_primary: Boolean(item.is_primary),
          position: allImages.length,
        });
      } else if (item.type === "file" && typeof item.fileIndex === "number") {
        const url = uploadedUrls[item.fileIndex];
        if (url) {
          allImages.push({
            url,
            is_primary: Boolean(item.is_primary),
            position: allImages.length,
          });
        }
      }
    });
  } else {
    // Fallback: any uploaded files
    uploadedUrls.forEach((url, idx) => {
      if (url) {
        allImages.push({
          url,
          is_primary: idx === 0,
          position: allImages.length,
        });
      }
    });

    const singleUrl = String(formData.get("primary_image") ?? "").trim();
    if (allImages.length === 0 && singleUrl) {
      allImages.push({ url: singleUrl, is_primary: true, position: 0 });
    }
  }

  // Ensure cover photo is designated
  if (allImages.length > 0 && !allImages.some((img) => img.is_primary)) {
    allImages[0].is_primary = true;
  }

  const primary_image =
    allImages.find((img) => img.is_primary)?.url || allImages[0]?.url || null;

  const productData = {
    name,
    slug,
    sku,
    category_id,
    short_description,
    description,
    regular_price_paise,
    sale_price_paise,
    primary_image,
    is_active,
    is_featured,
    is_bestseller,
    is_new_arrival,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase
      .from("products")
      .update(productData)
      .eq("id", id);
    if (error) {
      console.error("Could not update product:", error.message);
      redirect(`/admin/products?error=${encodeURIComponent(error.message)}`);
    }

    try {
      await supabase.from("product_images").delete().eq("product_id", id);
      if (allImages.length > 0) {
        const rows = allImages.map((img, idx) => ({
          product_id: id,
          storage_path: img.url,
          is_primary: Boolean(img.is_primary),
          position: idx,
        }));
        await supabase.from("product_images").insert(rows);
      }
    } catch (err) {
      console.warn("Could not sync product_images rows:", err);
    }
  } else {
    const { data: created, error } = await supabase
      .from("products")
      .insert({
        ...productData,
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Could not create product:", error.message);
      redirect(`/admin/products?error=${encodeURIComponent(error.message)}`);
    }

    if (created?.id && allImages.length > 0) {
      try {
        const rows = allImages.map((img, idx) => ({
          product_id: created.id,
          storage_path: img.url,
          is_primary: Boolean(img.is_primary),
          position: idx,
        }));
        await supabase.from("product_images").insert(rows);
      } catch (err) {
        console.warn("Could not sync product_images rows:", err);
      }
    }
  }

  revalidateStorefront();
  redirect("/admin/products?saved=1");
}

export async function toggleProductStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const currentStatus = formData.get("currentStatus") === "true";
  if (!id) redirect("/admin/products?error=missing_id");

  const { supabase } = await requireAdminPermission("catalog.write");
  const { error } = await supabase
    .from("products")
    .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Could not toggle product status:", error.message);
    redirect("/admin/products?error=toggle_failed");
  }

  revalidateStorefront();
  redirect("/admin/products?updated=1");
}

export async function deleteProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/products?error=missing_id");

  const { supabase } = await requireAdminPermission("catalog.write");
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("Could not delete product:", error.message);
    redirect("/admin/products?error=delete_failed");
  }

  revalidateStorefront();
  redirect("/admin/products?deleted=1");
}
