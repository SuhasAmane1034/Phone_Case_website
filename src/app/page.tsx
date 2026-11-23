import Link from "next/link";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { ProductCard } from "@/components/storefront/product-card";
import { Marquee } from "@/components/storefront/marquee";
import { getStorefrontProducts } from "@/lib/storefront/products";

export const dynamic = "force-dynamic";

export default async function Home() {
  const allProducts = await getStorefrontProducts();

  // Categorize for Seasonmade-style dedicated showcases
  const foldProducts = allProducts.filter(
    (p) =>
      p.slug.includes("fold") ||
      p.tags?.includes("fold") ||
      p.compatibility?.toLowerCase().includes("fold")
  );

  const protectionProducts = allProducts.filter(
    (p) =>
      p.slug.includes("lens") ||
      p.slug.includes("glass") ||
      p.slug.includes("privacy") ||
      p.tags?.includes("screen protection") ||
      p.tags?.includes("camera lens") ||
      p.category === "protection"
  );

  const samsungProducts = allProducts.filter(
    (p) =>
      (p.compatibility?.toLowerCase().includes("samsung") ||
        p.compatibility?.toLowerCase().includes("galaxy") ||
        p.tags?.includes("samsung")) &&
      !p.slug.includes("fold") &&
      !p.tags?.includes("screen protection")
  );

  const iphoneProducts = allProducts.filter(
    (p) =>
      (p.compatibility?.toLowerCase().includes("iphone") ||
        p.tags?.includes("iphone")) &&
      !p.tags?.includes("screen protection")
  );

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FDFBF7] pb-24 lg:pb-12 text-zinc-900">
        {/* Seasonmade Style Dual Split Banners (Desktop 2-Col, Mobile Stacked) */}
        <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Left Card: iPhone Series */}
            <Link
              href="/collections/all?category=iphone"
              className="group relative block overflow-hidden rounded-3xl bg-[#090B0E] shadow-md transition-all duration-300 hover:shadow-xl active:scale-[0.99]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://www.seasonmade.com/cdn/shop/files/Seasonmade_Homepage_Square_2.png?v=1753986121&width=1200"
                alt="iPhone 18 Series Luxury Cases"
                className="w-full h-auto object-cover rounded-3xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </Link>

            {/* Right Card: Samsung Series */}
            <Link
              href="/collections/all?category=samsung"
              className="group relative block overflow-hidden rounded-3xl bg-[#090B0E] shadow-md transition-all duration-300 hover:shadow-xl active:scale-[0.99]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://www.seasonmade.com/cdn/shop/files/Seasonmade_Homepage_Square_1.png?v=1753986121&width=1200"
                alt="Samsung Galaxy Series Luxury Cases"
                className="w-full h-auto object-cover rounded-3xl transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </Link>
          </div>
        </section>

        {/* Mobile Swipeable Series Quick-Filter Chips */}
        <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-bold uppercase tracking-wider text-zinc-700">
            <Link
              href="/collections/all"
              style={{ backgroundColor: "#000000", color: "#ffffff" }}
              className="chip-all-products shrink-0 rounded-full !bg-black px-5 py-2.5 !text-white font-black shadow-sm tracking-wider"
            >
              All Products
            </Link>
            <Link
              href="#samsung-fold"
              style={{ backgroundColor: "#ffffff", color: "#18181b" }}
              className="shrink-0 rounded-full border border-zinc-300 !bg-white px-4 py-2 !text-zinc-900 font-bold hover:border-black transition"
            >
              Samsung Galaxy Z Fold 8
            </Link>
            <Link
              href="#screen-protection"
              style={{ backgroundColor: "#fef3c7", color: "#451a03" }}
              className="shrink-0 rounded-full border border-amber-300 !bg-amber-100 px-4 py-2 !text-amber-950 font-bold hover:bg-amber-200 transition"
            >
              Screen & Lens Protection ✨
            </Link>
            <Link
              href="#samsung-s26"
              style={{ backgroundColor: "#ffffff", color: "#18181b" }}
              className="shrink-0 rounded-full border border-zinc-300 !bg-white px-4 py-2 !text-zinc-900 font-bold hover:border-black transition"
            >
              Samsung S26 Ultra
            </Link>
            <Link
              href="#iphone-series"
              style={{ backgroundColor: "#ffffff", color: "#18181b" }}
              className="shrink-0 rounded-full border border-zinc-300 !bg-white px-4 py-2 !text-zinc-900 font-bold hover:border-black transition"
            >
              iPhone 18 Pro Max
            </Link>
          </div>
        </section>

        <Marquee />

        {/* SECTION 1: SAMSUNG GALAXY Z FOLD SERIES */}
        <section id="samsung-fold" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                Aerospace Alloy & Smart Covers
              </span>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
                Samsung Galaxy Z Fold 8
              </h2>
            </div>
            <Link
              href="/collections/all?category=fold"
              className="text-xs font-bold uppercase tracking-wider text-zinc-700 hover:text-black underline underline-offset-4"
            >
              View Collection ({foldProducts.length}) →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {foldProducts.slice(0, 4).map((product) => (
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
                colours={product.colours}
                colourHexes={product.colourHexes}
              />
            ))}
          </div>
        </section>

        {/* SECTION 2: SCREEN & CAMERA LENS PROTECTION (User Requested Specialist Section) */}
        <section id="screen-protection" className="bg-[#121316] py-14 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800 pb-6">
              <div>
                <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400">
                  9H Sapphire & 28° Privacy
                </span>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">
                  Screen & Camera Lens Protection
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Ultra-hard sapphire camera rings, anti-glare oleophobic glass, and side-view privacy guards.
                </p>
              </div>

              <Link
                href="/collections/all?category=protection"
                className="rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-zinc-200 transition"
              >
                Shop All Protection ({protectionProducts.length})
              </Link>
            </div>

            {/* Product Cards for Protection */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {protectionProducts.slice(0, 4).map((product) => (
                <div key={product.slug} className="rounded-2xl bg-[#1C1E24] p-1 border border-zinc-800">
                  <ProductCard
                    name={product.name}
                    slug={product.slug}
                    compatibility={product.compatibility}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    badge={product.badge}
                    tone={product.tone}
                    imageUrl={product.imageUrl}
                    colours={product.colours}
                    colourHexes={product.colourHexes}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: SAMSUNG GALAXY S26 ULTRA SERIES */}
        <section id="samsung-s26" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                Titanium Alloy & MagSafe
              </span>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
                Samsung Galaxy S26 Ultra
              </h2>
            </div>
            <Link
              href="/collections/all?category=samsung"
              className="text-xs font-bold uppercase tracking-wider text-zinc-700 hover:text-black underline underline-offset-4"
            >
              View S26 Ultra Cases →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {samsungProducts.slice(0, 4).map((product) => (
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
                colours={product.colours}
                colourHexes={product.colourHexes}
              />
            ))}
          </div>
        </section>

        {/* SECTION 4: IPHONE 18 PRO SERIES */}
        <section id="iphone-series" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                Cyber-Armor & Heritage
              </span>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
                iPhone 18 Series
              </h2>
            </div>
            <Link
              href="/collections/all?category=iphone"
              className="text-xs font-bold uppercase tracking-wider text-zinc-700 hover:text-black underline underline-offset-4"
            >
              View iPhone 18 Drops →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {iphoneProducts.slice(0, 4).map((product) => (
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
                colours={product.colours}
                colourHexes={product.colourHexes}
              />
            ))}
          </div>
        </section>

        {/* Luxury Trust Indicators */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-zinc-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-2xl bg-white border border-zinc-100 shadow-2xs">
              <span className="text-2xl">📦</span>
              <h3 className="mt-2 text-xs font-bold uppercase tracking-wider text-zinc-950">Free Express Delivery</h3>
              <p className="mt-1 text-[11px] text-zinc-500">Across all Indian pincodes via Blue Dart</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-zinc-100 shadow-2xs">
              <span className="text-2xl">🛡️</span>
              <h3 className="mt-2 text-xs font-bold uppercase tracking-wider text-zinc-950">Precision Fit Guarantee</h3>
              <p className="mt-1 text-[11px] text-zinc-500">100% exact alignment for your device model</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-zinc-100 shadow-2xs">
              <span className="text-2xl">⚡</span>
              <h3 className="mt-2 text-xs font-bold uppercase tracking-wider text-zinc-950">100% Quality Inspected</h3>
              <p className="mt-1 text-[11px] text-zinc-500">Zero-defect certified before dispatch</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-zinc-100 shadow-2xs">
              <span className="text-2xl">🔒</span>
              <h3 className="mt-2 text-xs font-bold uppercase tracking-wider text-zinc-950">Secure Checkout</h3>
              <p className="mt-1 text-[11px] text-zinc-500">UPI, Cards, Netbanking & Cash on Delivery</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}