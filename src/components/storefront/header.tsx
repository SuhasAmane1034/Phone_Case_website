"use client";

import { useState } from "react";
import Link from "next/link";
import { CartCount } from "@/components/storefront/cart-count";

export function AnnouncementBar() {
  return (
    <div className="bg-[#171717] py-2 px-4 text-center text-[11px] font-bold tracking-wider text-white uppercase flex items-center justify-center gap-6 overflow-hidden">
      <span className="flex items-center gap-1.5">
        <span className="text-[#D4AF37]">✦</span> FREE EXPRESS SHIPPING ACROSS INDIA
      </span>
      <span className="hidden sm:inline-flex items-center gap-1.5 text-zinc-400">
        <span className="text-[#D4AF37]">✦</span> EXTRA 10% OFF ON PREPAID ORDERS
      </span>
      <span className="hidden md:inline-flex items-center gap-1.5 text-zinc-400">
        <span className="text-[#D4AF37]">✦</span> ALL-INDIA PRIORITY COURIER DISPATCH
      </span>
    </div>
  );
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <>
      <AnnouncementBar />
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Mobile Hamburger Button */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-900 hover:bg-zinc-100"
              aria-label="Open Navigation Menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Seasonmade Style Desktop Navigation (Left-aligned) */}
          <nav className="hidden lg:flex lg:items-center lg:gap-6 text-xs font-bold uppercase tracking-wider text-zinc-800">
            {/* iPhone Dropdown */}
            <div
              className="relative py-5"
              onMouseEnter={() => setActiveDropdown("iphone")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button type="button" className="flex items-center gap-1 hover:text-black transition">
                iPhone Zone <span className="text-[9px] text-zinc-400">▼</span>
              </button>
              {activeDropdown === "iphone" && (
                <div className="absolute top-full left-0 w-60 rounded-xl border border-zinc-200/80 bg-white p-3 shadow-xl animate-fadeIn">
                  <div className="space-y-1">
                    <Link href="/collections/all?category=iphone" className="block rounded-lg px-3 py-2 text-xs font-bold text-zinc-900 hover:bg-zinc-50">
                      iPhone 18 Pro Max
                    </Link>
                    <Link href="/collections/all?category=iphone" className="block rounded-lg px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                      iPhone 18 Pro
                    </Link>
                    <Link href="/collections/all?category=iphone" className="block rounded-lg px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                      iPhone 17 Pro Max
                    </Link>
                    <Link href="/collections/all?category=iphone" className="block rounded-lg px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                      iPhone 16 Series
                    </Link>
                    <div className="border-t border-zinc-100 my-1 pt-1">
                      <Link href="/collections/all" className="block rounded-lg px-3 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-50">
                        View All iPhone Cases →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Samsung S Series Dropdown */}
            <div
              className="relative py-5"
              onMouseEnter={() => setActiveDropdown("samsung-s")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button type="button" className="flex items-center gap-1 hover:text-black transition">
                Samsung S Series <span className="text-[9px] text-zinc-400">▼</span>
              </button>
              {activeDropdown === "samsung-s" && (
                <div className="absolute top-full left-0 w-64 rounded-xl border border-zinc-200/80 bg-white p-3 shadow-xl animate-fadeIn">
                  <div className="space-y-1">
                    <Link href="/collections/all?category=samsung" className="block rounded-lg px-3 py-2 text-xs font-bold text-zinc-900 hover:bg-zinc-50">
                      Galaxy S26 Ultra MagSafe
                    </Link>
                    <Link href="/collections/all?category=samsung" className="block rounded-lg px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                      Galaxy S26 / S26 Plus
                    </Link>
                    <Link href="/collections/all?category=samsung" className="block rounded-lg px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                      Galaxy S25 Ultra Series
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Samsung Fold / Flip Dropdown */}
            <div
              className="relative py-5"
              onMouseEnter={() => setActiveDropdown("fold")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button type="button" className="flex items-center gap-1 hover:text-black transition">
                Samsung Fold / Flip <span className="text-[9px] text-zinc-400">▼</span>
              </button>
              {activeDropdown === "fold" && (
                <div className="absolute top-full left-0 w-64 rounded-xl border border-zinc-200/80 bg-white p-3 shadow-xl animate-fadeIn">
                  <div className="space-y-1">
                    <Link href="/collections/all?category=fold" className="block rounded-lg px-3 py-2 text-xs font-bold text-zinc-900 hover:bg-zinc-50">
                      Galaxy Z Fold 8 (Hinge Armor)
                    </Link>
                    <Link href="/collections/all?category=fold" className="block rounded-lg px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                      Galaxy Z Flip 7
                    </Link>
                    <Link href="/collections/all?category=fold" className="block rounded-lg px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                      Galaxy Z Fold 7 Series
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Screen Protection Dropdown */}
            <div
              className="relative py-5"
              onMouseEnter={() => setActiveDropdown("protection")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button type="button" className="flex items-center gap-1 hover:text-black transition">
                Screen Protection <span className="text-[9px] text-zinc-400">▼</span>
              </button>
              {activeDropdown === "protection" && (
                <div className="absolute top-full left-0 w-68 rounded-xl border border-zinc-200/80 bg-white p-3 shadow-xl animate-fadeIn">
                  <div className="space-y-1">
                    <Link href="/collections/all?category=protection" className="block rounded-lg px-3 py-2 text-xs font-bold text-zinc-900 hover:bg-zinc-50">
                      Diamond Camera Lens Protectors
                    </Link>
                    <Link href="/collections/all?category=protection" className="block rounded-lg px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                      28° Anti-Peeping Privacy Glass
                    </Link>
                    <Link href="/collections/all?category=protection" className="block rounded-lg px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                      9H Oleophobic Tempered Glass
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Track Order Direct Link */}
            <Link href="/track-order" className="hover:text-black transition py-5">
              Track Order
            </Link>
          </nav>

          {/* Logo (Centered) */}
          <Link
            href="/"
            className="text-xl sm:text-2xl font-black tracking-[0.2em] text-zinc-950 uppercase"
            aria-label="GHYAMAJHA Luxury Cases"
          >
            GHYAMAJHA
          </Link>

          {/* Right Header Action Icons */}
          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/search"
              className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 hover:bg-zinc-100 transition"
              aria-label="Search Collection"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            <Link
              href="/account"
              className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 hover:bg-zinc-100 transition"
              aria-label="Customer Account"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>

            <Link
              href="/cart"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-900 hover:bg-zinc-100 transition"
              aria-label="Shopping Bag"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">
                <CartCount />
              </span>
            </Link>
          </div>
        </div>

        {/* Mobile Slide-Down Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-zinc-200 bg-white px-6 py-6 lg:hidden animate-fadeIn space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Collections</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold text-zinc-800">
                <Link
                  href="/collections/all?category=iphone"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-zinc-50 p-2.5 hover:bg-zinc-100"
                >
                  iPhone Series
                </Link>
                <Link
                  href="/collections/all?category=samsung"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-zinc-50 p-2.5 hover:bg-zinc-100"
                >
                  Samsung S Series
                </Link>
                <Link
                  href="/collections/all?category=fold"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-zinc-50 p-2.5 hover:bg-zinc-100"
                >
                  Galaxy Z Fold
                </Link>
                <Link
                  href="/collections/all?category=protection"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-zinc-50 p-2.5 hover:bg-zinc-100"
                >
                  Screen Protection
                </Link>
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-3 flex flex-col gap-2.5 text-xs font-semibold text-zinc-700">
              <Link href="/track-order" onClick={() => setMobileMenuOpen(false)} className="py-1 flex items-center justify-between">
                <span>Track My Order</span>
                <span>→</span>
              </Link>
              <Link href="/account" onClick={() => setMobileMenuOpen(false)} className="py-1 flex items-center justify-between">
                <span>My Account</span>
                <span>→</span>
              </Link>
              <Link href="/collections/all" onClick={() => setMobileMenuOpen(false)} className="py-1 font-bold text-black flex items-center justify-between">
                <span>Shop All Cases & Accessories</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Floating Bottom Navigation Bar for Mobile Browsers */}
      <nav
        aria-label="Mobile Bottom App Bar"
        className="fixed bottom-0 inset-x-0 z-50 flex h-16 items-center justify-around border-t border-zinc-200/80 bg-white/95 px-2 backdrop-blur-md lg:hidden shadow-lg"
      >
        <Link href="/" className="flex flex-col items-center justify-center gap-0.5 text-zinc-600 hover:text-black">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
        </Link>

        <Link href="/collections/all" className="flex flex-col items-center justify-center gap-0.5 text-zinc-600 hover:text-black">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-wider">Series</span>
        </Link>

        <Link href="/search" className="flex flex-col items-center justify-center gap-0.5 text-zinc-600 hover:text-black">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-wider">Search</span>
        </Link>

        <Link href="/cart" className="relative flex flex-col items-center justify-center gap-0.5 text-zinc-900">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="absolute top-0 right-3 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-black px-1 text-[9px] font-bold text-white">
            <CartCount />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Bag</span>
        </Link>

        <Link href="/track-order" className="flex flex-col items-center justify-center gap-0.5 text-zinc-600 hover:text-black">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-wider">Track</span>
        </Link>
      </nav>
    </>
  );
}