"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CatalogProduct } from "@/data/catalog";

export function VariantSelector({ product }: { product: CatalogProduct }) {
  const router = useRouter();
  const [variantId, setVariantId] = useState(
    product.variants?.find((item) => item.stock > 0)?.id ??
      product.variants?.[0]?.id ??
      ""
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const variant =
    product.variants?.find((item) => item.id === variantId) ??
    product.variants?.[0];

  function addToCart() {
    if (!variant) return;
    const key = "ghyamajha-cart";
    const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as Array<{
      variantId: string;
      quantity: number;
      product?: unknown;
      variant?: unknown;
    }>;

    const stockLimit = variant.stock > 0 ? variant.stock : 99;
    const found = existing.find((item) => item.variantId === variant.id);

    const next = found
      ? existing.map((item) =>
          item.variantId === variant.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + quantity, stockLimit),
                product,
                variant,
              }
            : item
        )
      : [
          ...existing,
          {
            variantId: variant.id,
            quantity: Math.min(quantity, stockLimit),
            product,
            variant,
          },
        ];

    localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new Event("ghyamajha-cart-updated"));

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1600);
  }

  return (
    <div className="variant-selector">
      <div className="selector-block">
        <div className="selector-heading">
          <strong>Device</strong>
          <span>{variant?.device ?? "Standard"}</span>
        </div>
        <div className="option-row">
          {product.variants?.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === variantId ? "selected" : ""}
              onClick={() => setVariantId(item.id)}
            >
              {item.device}
            </button>
          ))}
        </div>
      </div>

      <div className="selector-block">
        <div className="selector-heading">
          <strong>Finish</strong>
          <span>{variant?.colour ?? "Standard"}</span>
        </div>
        <div className="colour-row">
          {product.variants?.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Select ${item.colour}`}
              className={item.id === variantId ? "selected" : ""}
              style={{ background: item.colourHex || "#171717" }}
              onClick={() => setVariantId(item.id)}
            />
          ))}
        </div>
      </div>

      <div className="stock-row">
        <span className="in-stock">● In stock & ready to ship</span>
      </div>

      <div className="purchase-row">
        <div className="quantity">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span>{quantity}</span>
          <button
            type="button"
            onClick={() =>
              setQuantity((q) =>
                Math.min(variant?.stock && variant.stock > 0 ? variant.stock : 99, q + 1)
              )
            }
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button
          type="button"
          style={{ backgroundColor: "#000000", color: "#ffffff" }}
          className="button button-primary add-cart !bg-black !text-white font-bold transition-all shadow-md active:scale-95"
          onClick={addToCart}
          disabled={!variant}
        >
          {isAdded ? "Added to bag ✓" : "Add to cart"}
        </button>
        <button
          type="button"
          style={{ backgroundColor: "#ffffff", color: "#000000", borderColor: "#000000" }}
          className="button button-secondary buy-now !bg-white !text-black border-2 border-black font-bold shadow-md hover:!bg-zinc-100 active:scale-95"
          disabled={!variant}
          onClick={() => {
            addToCart();
            router.push("/cart");
          }}
        >
          Buy now
        </button>
      </div>
    </div>
  );
}
