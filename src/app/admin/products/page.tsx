import Link from "next/link";
import { requireAdminPermission } from "@/lib/admin/server";
import { ProductModal } from "@/app/admin/products/product-modal";
import { ProductRowActions } from "@/app/admin/products/product-row-actions";

export const dynamic = "force-dynamic";

function formatCurrency(paise: number | null) {
  if (paise === null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

function nestedRecord(value: unknown): Record<string, unknown> | null {
  const record = Array.isArray(value) ? value[0] : value;
  return record && typeof record === "object"
    ? (record as Record<string, unknown>)
    : null;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    saved?: string;
    deleted?: string;
    updated?: string;
    error?: string;
  }>;
}) {
  const context = await requireAdminPermission("catalog.read");
  const canMutate = context.permissions.includes("catalog.write");
  const query = await searchParams;

  const [{ data: rawProducts, error: productsError }, { data: rawCategories }] =
    await Promise.all([
      context.supabase
        .from("products")
        .select(
          "id, name, slug, sku, description, short_description, regular_price_paise, sale_price_paise, primary_image, category_id, is_active, is_featured, is_bestseller, is_new_arrival, created_at, categories(id, name), product_images(id, storage_path, position, is_primary)",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      context.supabase
        .from("categories")
        .select("id, name, slug")
        .order("position", { ascending: true }),
    ]);

  const categories = (rawCategories ?? []).map((cat) => ({
    id: cat.id,
    name: cat.name,
  }));

  const term = (query.q ?? "").trim().toLowerCase();
  const categoryFilter = query.category ?? "";
  const statusFilter = query.status ?? "";

  const products = (rawProducts ?? []).filter((product) => {
    if (term) {
      const matchName = product.name.toLowerCase().includes(term);
      const matchSku = (product.sku ?? "").toLowerCase().includes(term);
      const matchSlug = product.slug.toLowerCase().includes(term);
      if (!matchName && !matchSku && !matchSlug) return false;
    }
    if (categoryFilter && product.category_id !== categoryFilter) return false;
    if (statusFilter === "active" && !product.is_active) return false;
    if (statusFilter === "archived" && product.is_active) return false;
    return true;
  });

  return (
    <main>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
            Catalog
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Products</h1>
          <p className="mt-2 text-sm text-zinc-600">
            {products.length} product{products.length === 1 ? "" : "s"} listed
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-800 transition hover:bg-zinc-50"
          >
            Overview
          </Link>
          {canMutate && <ProductModal categories={categories} />}
        </div>
      </header>

      {query.saved && (
        <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Product saved successfully.
        </p>
      )}
      {query.updated && (
        <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Product status updated.
        </p>
      )}
      {query.deleted && (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Product deleted.
        </p>
      )}
      {query.error && (
        <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {query.error === "invalid_data"
            ? "Invalid product data. Please check all required fields."
            : query.error === "sale_price_too_high"
              ? "Sale price cannot be greater than the regular price."
              : `Error: ${query.error}`}
        </p>
      )}

      {productsError && (
        <p role="alert" className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
          Could not load products: {productsError.message}
        </p>
      )}

      {/* Filter Toolbar */}
      <form className="mt-6 grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1fr)_200px_160px_auto]">
        <label className="grid gap-1 text-xs font-semibold text-zinc-600">
          Search products
          <input
            name="q"
            defaultValue={query.q}
            placeholder="Name, slug or SKU"
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900"
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-zinc-600">
          Category
          <select
            name="category"
            defaultValue={query.category ?? ""}
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-zinc-600">
          Status
          <select
            name="status"
            defaultValue={query.status ?? ""}
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900"
          >
            <option value="">All statuses</option>
            <option value="active">Active only</option>
            <option value="archived">Archived only</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="h-10 w-full rounded-lg bg-zinc-950 px-4 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-zinc-700 sm:w-auto"
          >
            Filter
          </button>
        </div>
      </form>

      {/* Products Table */}
      {!products.length ? (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <p className="font-semibold text-zinc-600">No products found matching the criteria.</p>
          {canMutate && (
            <div className="mt-4">
              <ProductModal
                categories={categories}
                triggerLabel="Create your first product"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">SKU</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Badges</th>
                {canMutate && <th className="px-5 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {products.map((product) => {
                const category = nestedRecord(product.categories);
                const hasSale =
                  product.sale_price_paise !== null &&
                  product.sale_price_paise < product.regular_price_paise;

                const rawImgs = Array.isArray(product.product_images)
                  ? (product.product_images as { id: string; storage_path: string; position: number | null; is_primary: boolean }[])
                  : [];
                const sortedImgs = [...rawImgs].sort(
                  (a, b) => (a.position ?? 0) - (b.position ?? 0)
                );
                const productImages = sortedImgs.map((img, idx) => ({
                  url: img.storage_path,
                  is_primary: img.is_primary,
                  position: img.position ?? idx,
                }));

                if (!productImages.length && product.primary_image) {
                  productImages.push({
                    url: product.primary_image,
                    is_primary: true,
                    position: 0,
                  });
                }

                const displayImage =
                  product.primary_image || productImages.find((i) => i.is_primary)?.url || productImages[0]?.url || null;

                const formValues = {
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  sku: product.sku ?? "",
                  category_id: product.category_id,
                  regular_price_inr: product.regular_price_paise / 100,
                  sale_price_inr: product.sale_price_paise
                    ? product.sale_price_paise / 100
                    : null,
                  short_description: product.short_description ?? "",
                  description: product.description ?? "",
                  primary_image: displayImage,
                  images: productImages,
                  is_active: product.is_active,
                  is_featured: product.is_featured,
                  is_bestseller: product.is_bestseller,
                  is_new_arrival: product.is_new_arrival,
                };

                return (
                  <tr key={product.id} className="transition hover:bg-zinc-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {displayImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={displayImage}
                              alt={product.name}
                              className="h-11 w-11 shrink-0 rounded-lg object-cover border border-zinc-200 shadow-xs"
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 text-[10px] font-bold uppercase text-zinc-400">
                              No img
                            </div>
                          )}
                          {productImages.length > 1 && (
                            <span
                              className="absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[9px] font-bold text-white shadow-xs"
                              title={`${productImages.length} images`}
                            >
                              +{productImages.length - 1}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900">{product.name}</p>
                          <p className="mt-0.5 text-xs text-zinc-500 font-mono">
                            /{product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-zinc-600">
                      {product.sku || "—"}
                    </td>
                    <td className="px-5 py-4 text-zinc-700">
                      {String(category?.name ?? "—")}
                    </td>
                    <td className="px-5 py-4">
                      {hasSale ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-red-700">
                            {formatCurrency(product.sale_price_paise)}
                          </span>
                          <del className="text-xs text-zinc-400">
                            {formatCurrency(product.regular_price_paise)}
                          </del>
                        </div>
                      ) : (
                        <span className="font-semibold text-zinc-900">
                          {formatCurrency(product.regular_price_paise)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                          product.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        {product.is_active ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 text-[11px]">
                        {product.is_featured && (
                          <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-blue-700 border border-blue-200">
                            Featured
                          </span>
                        )}
                        {product.is_bestseller && (
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700 border border-amber-200">
                            Bestseller
                          </span>
                        )}
                        {product.is_new_arrival && (
                          <span className="rounded bg-purple-50 px-1.5 py-0.5 font-medium text-purple-700 border border-purple-200">
                            New
                          </span>
                        )}
                        {!product.is_featured &&
                          !product.is_bestseller &&
                          !product.is_new_arrival && (
                            <span className="text-zinc-400">—</span>
                          )}
                      </div>
                    </td>
                    {canMutate && (
                      <td className="px-5 py-4 text-right">
                        <ProductRowActions
                          product={formValues}
                          categories={categories}
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
