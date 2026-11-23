import type { Metadata } from "next";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { ProductCard } from "@/components/storefront/product-card";
import { getStorefrontProducts } from "@/lib/storefront/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const term = q.trim().toLowerCase();
  const allProducts = await getStorefrontProducts();
  const results = term
    ? allProducts.filter((product) =>
        [
          product.name,
          product.compatibility,
          product.shortDescription,
          ...product.tags,
          ...product.supportedDevices,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term),
      )
    : [];

  return (
    <>
      <Header />
      <main className="section" style={{ minHeight: 520 }}>
        <p className="eyebrow">Search GHYAMAJHA</p>
        <h1 style={{ fontSize: 60, letterSpacing: "-.05em", margin: 0 }}>
          Find your fit
        </h1>
        <form
          role="search"
          style={{ display: "flex", maxWidth: 760, marginTop: 40 }}
        >
          <input
            name="q"
            required
            aria-label="Search products"
            placeholder="Search iPhone 17, MagSafe, leather…"
            style={{
              height: 56,
              flex: 1,
              minWidth: 0,
              border: "1px solid var(--line)",
              padding: "0 16px",
              background: "white",
            }}
            defaultValue={q}
          />
          <button type="submit" className="button button-primary">
            Search
          </button>
        </form>

        <div className="search-results" style={{ marginTop: 40 }}>
          {results.length > 0 ? (
            results.map((product) => (
              <ProductCard
                key={product.slug}
                name={product.name}
                slug={product.slug}
                compatibility={product.compatibility}
                price={product.price}
                originalPrice={product.originalPrice}
                badge={product.badge}
                tone={product.tone}
                imageUrl={product.imageUrl}
              />
            ))
          ) : (
            <p style={{ textAlign: "center", width: "100%" }}>
              No results found
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
