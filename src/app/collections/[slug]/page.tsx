import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { ProductCard } from "@/components/storefront/product-card";
import { getStorefrontProducts } from "@/lib/storefront/products";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug.replaceAll("-", " ")} collection`,
    description: `Shop GHYAMAJHA ${slug.replaceAll("-", " ")} products.`,
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    sort?: string;
    device?: string;
    colour?: string;
    availability?: string;
    page?: string;
  }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const title = slug.replaceAll("-", " ");

  const allProducts = await getStorefrontProducts();
  let products = [...allProducts];
  if (slug === "bestsellers")
    products = products.filter((product) => product.bestseller);
  if (slug === "motorsport")
    products = products.filter((product) =>
      product.tags.includes("motorsport"),
    );
  if (slug === "magsafe")
    products = products.filter((product) => product.tags.includes("magsafe"));
  if (slug === "accessories")
    products = products.filter(
      (product) =>
        product.tags.includes("accessory") ||
        product.tags.includes("screen protection"),
    );
  if (slug === "new-arrivals")
    products = products.filter((product) => product.newArrival);
  if (query.device)
    products = products.filter((product) =>
      product.supportedDevices.some((device) =>
        device.toLowerCase().includes(query.device!.toLowerCase()),
      ),
    );
  if (query.colour)
    products = products.filter((product) =>
      product.colours.some(
        (colour) => colour.toLowerCase() === query.colour!.toLowerCase(),
      ),
    );
  if (query.availability === "in-stock")
    products = products.filter((product) =>
      product.variants.some((variant) => variant.stock > 0),
    );
  if (query.sort === "price-low") products.sort((a, b) => a.price - b.price);
  if (query.sort === "price-high") products.sort((a, b) => b.price - a.price);
  if (query.sort === "newest")
    products.sort(
      (a, b) => Number(Boolean(b.newArrival)) - Number(Boolean(a.newArrival)),
    );

  const page = Math.max(1, Number(query.page ?? 1));
  const pageSize = 8;
  const visible = products.slice(0, page * pageSize);
  const canLoadMore = visible.length < products.length;

  return (
    <>
      <Header />
      <main className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">GHYAMAJHA collection</p>
            <h2 style={{ textTransform: "capitalize" }}>{title}</h2>
          </div>
          <span>{products.length} products</span>
        </div>
        <form className="catalog-toolbar">
          <label>
            Device
            <select name="device" defaultValue={query.device ?? ""}>
              <option value="">All devices</option>
              <option>iPhone 17</option>
              <option>iPhone 16</option>
              <option>Samsung Galaxy S24</option>
              <option>Galaxy Z Fold</option>
            </select>
          </label>
          <label>
            Colour
            <select name="colour" defaultValue={query.colour ?? ""}>
              <option value="">All colours</option>
              <option>Black</option>
              <option>Brown</option>
              <option>Blue</option>
              <option>Silver</option>
              <option>Clear</option>
            </select>
          </label>
          <label>
            Availability
            <select name="availability" defaultValue={query.availability ?? ""}>
              <option value="">All</option>
              <option value="in-stock">In stock</option>
            </select>
          </label>
          <label>
            Sort
            <select name="sort" defaultValue={query.sort ?? "featured"}>
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="newest">Newest</option>
            </select>
          </label>
          <button type="submit">Apply</button>
          <Link href={`/collections/${slug}`}>Clear all</Link>
        </form>
        {visible.length > 0 ? (
          <div className="product-grid">
            {visible.map((product) => (
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
            ))}
          </div>
        ) : (
          <div className="catalog-empty">
            <h3>No matching products</h3>
            <p>Try clearing a filter or exploring another collection.</p>
          </div>
        )}
        {canLoadMore && (
          <div className="load-more">
            <Link
              className="button button-secondary"
              href={`/collections/${slug}?${new URLSearchParams({ ...query, page: String(page + 1) }).toString()}`}
            >
              Load more
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
