"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductImageMagnifier } from "@/components/storefront/product-image-magnifier";

type ProductCardProps = {
  name: string;
  slug: string;
  compatibility: string;
  price: number;
  originalPrice: number;
  badge?: string;
  tone?: "black" | "silver" | "blue" | "brown";
  imageUrl?: string | null;
  colours?: string[];
  colourHexes?: string[];
};

export function ProductCard({
  name,
  slug,
  compatibility,
  price,
  originalPrice,
  badge,
  tone = "black",
  imageUrl,
  colours = ["Gold", "Silver", "Black"],
  colourHexes = ["#D4AF37", "#C0C0C0", "#1C1C1C"],
}: ProductCardProps) {
  const [quickAdded, setQuickAdded] = useState(false);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const discount = Math.round(((originalPrice - price) / originalPrice) * 100);

  const activeColor = colours[selectedColorIdx] ?? "Standard";

  function handleQuickAdd() {
    const key = "ghyamajha-cart";
    const variantId = `${slug}-${activeColor.toLowerCase().replace(/\s+/g, "-")}`;
    const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as Array<{
      variantId: string;
      quantity: number;
      product?: unknown;
      variant?: unknown;
    }>;

    const found = existing.find((item) => item.variantId === variantId);
    const productSnapshot = {
      name,
      slug,
      price,
      originalPrice,
      imageUrl,
      tone,
      compatibility,
    };
    const variantSnapshot = {
      id: variantId,
      name: `${name} — ${activeColor}`,
      sku: `SKU-${slug}-${activeColor.slice(0, 3).toUpperCase()}`,
      price,
      originalPrice,
      device: compatibility,
      colour: activeColor,
      stock: 50,
    };

    const next = found
      ? existing.map((item) =>
          item.variantId === variantId
            ? { ...item, quantity: item.quantity + 1, product: productSnapshot, variant: variantSnapshot }
            : item
        )
      : [
          ...existing,
          {
            variantId,
            quantity: 1,
            product: productSnapshot,
            variant: variantSnapshot,
          },
        ];

    localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new Event("ghyamajha-cart-updated"));

    setQuickAdded(true);
    setTimeout(() => setQuickAdded(false), 1600);
  }

  return (
    <article className="product-card group relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:p-4 transition-all duration-300 hover:shadow-md hover:border-zinc-300">
      <div className="product-visual relative overflow-hidden rounded-xl bg-zinc-50/70 p-2">
        <Link
          href={`/product/${slug}`}
          className="product-art-link block"
          aria-label={`View ${name}`}
        >
          <ProductImageMagnifier label={name}>
            {imageUrl ? (
              <div className="flex h-48 sm:h-56 w-full items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={name}
                  loading="lazy"
                  className="max-h-full w-auto max-w-full rounded-lg object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className={`phone-case phone-case-${tone}`}>
                <div className="camera-cut">
                  <i />
                  <i />
                  <i />
                </div>
                <span className="case-mark">GY</span>
                <span className="racing-stripe" />
              </div>
            )}
          </ProductImageMagnifier>
        </Link>
        {badge && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-black/90 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
            {badge}
          </span>
        )}
        <button
          type="button"
          className="wishlist absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-zinc-600 backdrop-blur-xs shadow-xs hover:text-red-500 hover:bg-white transition"
          aria-label={`Add ${name} to wishlist`}
        >
          <span aria-hidden="true" className="text-sm">♡</span>
        </button>
      </div>

      <div className="product-meta mt-3.5 flex flex-1 flex-col justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            {compatibility}
          </p>
          <Link
            href={`/product/${slug}`}
            className="mt-1 block text-sm font-bold text-zinc-900 leading-snug line-clamp-2 hover:text-zinc-600 transition"
          >
            {name}
          </Link>
        </div>

        <div className="mt-3">
          {/* Seasonmade Style Price Display */}
          <div className="flex items-baseline gap-2">
            <span className="text-base font-black text-zinc-950">
              Rs. {price.toLocaleString("en-IN")}.00
            </span>
            {originalPrice > price && (
              <del className="text-xs text-zinc-400">
                Rs. {originalPrice.toLocaleString("en-IN")}.00
              </del>
            )}
            {discount > 0 && (
              <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                {discount}% OFF
              </span>
            )}
          </div>

          {/* Seasonmade Style Circular Color Swatches */}
          {colours.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5" aria-label="Available Colours">
              {colours.slice(0, 5).map((color, idx) => {
                const hex = colourHexes[idx] ?? "#1A1A1A";
                const isSelected = selectedColorIdx === idx;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColorIdx(idx)}
                    title={color}
                    className={`relative flex h-5 w-5 items-center justify-center rounded-full transition-transform ${
                      isSelected ? "scale-110 ring-2 ring-black ring-offset-1" : "hover:scale-105"
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: hex }}
                    />
                  </button>
                );
              })}
              {colours.length > 5 && (
                <span className="text-[10px] text-zinc-400 font-medium">+{colours.length - 5}</span>
              )}
            </div>
          )}

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={handleQuickAdd}
            style={{ backgroundColor: quickAdded ? "#059669" : "#000000", color: "#ffffff" }}
            className={`mt-4 w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              quickAdded
                ? "!bg-emerald-600 !text-white shadow-xs"
                : "!bg-black !text-white hover:!bg-zinc-800 active:scale-98"
            }`}
          >
            {quickAdded ? "Added to Bag ✓" : "Quick Add"}
          </button>
        </div>
      </div>
    </article>
  );
}
