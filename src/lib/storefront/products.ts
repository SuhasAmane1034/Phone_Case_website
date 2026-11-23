import { createClient } from "@/lib/supabase/server";
import { catalogue, type CatalogProduct } from "@/data/catalog";

export async function getStorefrontProducts(): Promise<CatalogProduct[]> {
  try {
    const supabase = await createClient();
    const { data: dbProducts, error } = await supabase
      .from("products")
      .select(
        "id, name, slug, sku, description, short_description, regular_price_paise, sale_price_paise, primary_image, is_active, is_featured, is_bestseller, is_new_arrival, categories(id, name, slug), product_images(storage_path, position, is_primary)"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error || !dbProducts || dbProducts.length === 0) {
      return catalogue;
    }

    const liveProducts: CatalogProduct[] = dbProducts.map((p) => {
      const rawImgs = Array.isArray(p.product_images)
        ? (p.product_images as { storage_path: string; position: number | null; is_primary: boolean }[])
        : [];
      const sortedImgs = [...rawImgs].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0)
      );
      const images = sortedImgs.map((i) => i.storage_path);
      if (!images.length && p.primary_image) {
        images.push(p.primary_image);
      }

      const regularPrice = Math.round((p.regular_price_paise ?? 0) / 100);
      const salePrice = p.sale_price_paise
        ? Math.round(p.sale_price_paise / 100)
        : regularPrice;
      const originalPrice = regularPrice;
      const price = salePrice;

      const categoryRecord = Array.isArray(p.categories) ? p.categories[0] : p.categories;
      const category = categoryRecord && typeof categoryRecord === "object"
        ? (categoryRecord as { id?: string; name?: string; slug?: string })
        : null;

      const categoryName = category?.name ?? "Cases & Accessories";
      const categorySlug = category?.slug ?? "all";

      const badge = p.is_bestseller
        ? "Bestseller"
        : p.is_new_arrival
          ? "New"
          : p.is_featured
            ? "Featured"
            : undefined;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        shortDescription: p.short_description || p.name,
        description: p.description || p.short_description || "",
        compatibility: categoryName,
        supportedDevices: [
          "iPhone 17 Pro Max",
          "iPhone 17 Pro",
          "iPhone 16 Pro Max",
          "Samsung Galaxy S24 Ultra",
        ],
        colours: ["Black", "Brown", "Blue"],
        price,
        originalPrice,
        badge,
        tone: "black" as const,
        bestseller: Boolean(p.is_bestseller),
        newArrival: Boolean(p.is_new_arrival),
        featured: Boolean(p.is_featured),
        tags: [
          categorySlug,
          p.is_bestseller ? "bestseller" : "",
          p.is_new_arrival ? "new-arrival" : "",
          p.is_featured ? "motorsport" : "",
        ].filter(Boolean),
        imageUrl: p.primary_image || images[0] || null,
        images,
        variants: [
          {
            id: `${p.id}-std`,
            name: `${p.name} — Standard`,
            sku: p.sku || `SKU-${p.slug}`,
            colour: "Black",
            colourHex: "#171717",
            device: "Universal",
            price,
            originalPrice,
            stock: 50,
          },
        ],
      };
    });

    // Merge: live products first, then any static catalog products whose slug isn't already present
    const liveSlugs = new Set(liveProducts.map((p) => p.slug));
    const combined = [
      ...liveProducts,
      ...catalogue.filter((p) => !liveSlugs.has(p.slug)),
    ];

    return combined;
  } catch (err) {
    console.warn("Could not fetch storefront products from Supabase:", err);
    return catalogue;
  }
}

export async function getStorefrontProduct(slug: string): Promise<CatalogProduct | null> {
  const all = await getStorefrontProducts();
  return all.find((p) => p.slug === slug) ?? null;
}
