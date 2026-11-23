import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { ProductCard } from "@/components/storefront/product-card";
import { VariantSelector } from "@/components/storefront/variant-selector";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { catalogue } from "@/data/catalog";
import {
  getStorefrontProduct,
  getStorefrontProducts,
} from "@/lib/storefront/products";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateStaticParams() {
  return catalogue.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStorefrontProduct(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} for ${product.compatibility}`,
    description: product.shortDescription,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      type: "website",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getStorefrontProduct(slug);
  if (!product) notFound();

  const allProducts = await getStorefrontProducts();
  const related = allProducts
    .filter((item) => item.slug !== product.slug)
    .slice(0, 4);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: "GHYAMAJHA" },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <Header />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/collections/all">Shop</Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>
        <section className="pdp">
          <ProductGallery product={product} />
          <div className="pdp-info">
            <p className="eyebrow">{product.compatibility}</p>
            <h1>{product.name}</h1>
            <div className="rating">
              <span>★★★★★</span>
              <a href="#reviews">Read reviews</a>
            </div>
            <div className="pdp-price">
              <strong>₹{product.price.toLocaleString("en-IN")}</strong>
              <del>₹{product.originalPrice.toLocaleString("en-IN")}</del>
              <span>
                {Math.round(
                  ((product.originalPrice - product.price) /
                    product.originalPrice) *
                    100,
                )}
                % off
              </span>
            </div>
            <p className="pdp-summary">{product.shortDescription}</p>
            <VariantSelector product={product} />
            <div className="pdp-accordions">
              <details open>
                <summary>Product description</summary>
                <p>{product.description}</p>
              </details>
              <details>
                <summary>Compatibility</summary>
                <p>{product.supportedDevices.join(" • ")}</p>
              </details>
              <details>
                <summary>Shipping & Quality Inspection</summary>
                <p>
                  Every order undergoes strict multi-point precision and quality inspection
                  prior to dispatch. Orders are prepared immediately upon confirmation. Due to the
                  bespoke luxury engineering of our cases, all sales are final.
                </p>
              </details>
            </div>
          </div>
        </section>
        <section className="section" id="reviews">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Customer reviews</p>
              <h2>Race-tested feedback</h2>
            </div>
          </div>
          <p style={{ color: "#777" }}>
            Reviews will appear once verified purchases are available.
          </p>
        </section>
        <section className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Keep exploring</p>
              <h2>Related products</h2>
            </div>
            <Link href="/collections/all">View all</Link>
          </div>
          <div className="product-grid">
            {related.map((item) => (
              <ProductCard
                key={item.slug}
                name={item.name}
                slug={item.slug}
                compatibility={item.compatibility}
                price={item.price}
                originalPrice={item.originalPrice}
                badge={item.badge}
                tone={item.tone}
                imageUrl={item.imageUrl}
              />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
