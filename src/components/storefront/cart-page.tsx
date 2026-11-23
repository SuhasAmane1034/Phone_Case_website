"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { catalogue, type CatalogProduct, type ProductVariant } from "@/data/catalog";

type StoredItem = {
  variantId: string;
  quantity: number;
  product?: CatalogProduct;
  variant?: ProductVariant;
};

export function CartPage({ allProducts }: { allProducts?: CatalogProduct[] }) {
  const [items, setItems] = useState<StoredItem[]>([]);
  const [catalog, setCatalog] = useState<CatalogProduct[]>(
    allProducts && allProducts.length > 0 ? allProducts : catalogue
  );

  useEffect(() => {
    // 1. Read cart items from localStorage
    try {
      const stored = JSON.parse(
        localStorage.getItem("ghyamajha-cart") ?? "[]"
      ) as StoredItem[];
      setItems(stored);
    } catch {
      setItems([]);
    }

    // 2. Fetch live products from /api/products to guarantee all custom & admin products are present
    fetch("/api/products")
      .then((res) => res.json())
      .then((data: CatalogProduct[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setCatalog(data);
        }
      })
      .catch(() => {});
  }, []);

  function save(next: StoredItem[]) {
    setItems(next);
    localStorage.setItem("ghyamajha-cart", JSON.stringify(next));
    window.dispatchEvent(new Event("ghyamajha-cart-updated"));
  }

  const lines = useMemo(() => {
    return items.flatMap((item) => {
      // 1. If product and variant snapshot were stored directly on the item, use them
      if (item.product && item.variant) {
        return [{ ...item, product: item.product, variant: item.variant }];
      }

      // 2. Search live catalog + static catalogue
      const fullList = [...catalog, ...catalogue];
      for (const product of fullList) {
        const variant = product.variants?.find(
          (entry) => entry.id === item.variantId
        );
        if (variant) {
          return [{ ...item, product, variant }];
        }
      }

      // 3. Fallback: if variantId contains product ID or slug prefix
      for (const product of fullList) {
        if (
          item.variantId.startsWith(product.slug) ||
          (product.id && item.variantId.startsWith(product.id))
        ) {
          const fallbackVariant = product.variants?.[0] || {
            id: item.variantId,
            name: `${product.name} — Standard`,
            sku: `SKU-${product.slug}`,
            colour: "Default",
            colourHex: "#171717",
            device: product.compatibility || "Universal",
            price: product.price,
            originalPrice: product.originalPrice,
            stock: 50,
          };
          return [{ ...item, product, variant: fallbackVariant }];
        }
      }

      return [];
    });
  }, [items, catalog]);

  const subtotal = lines.reduce(
    (total, line) => total + line.variant.price * line.quantity,
    0
  );
  const shipping = subtotal === 0 || subtotal >= 1499 ? 0 : 99;
  const total = subtotal + shipping;

  return (
    <main className="cart-page">
      <div className="cart-heading flex items-baseline justify-between">
        <div>
          <p className="eyebrow">Your bag</p>
          <h1>Shopping bag</h1>
        </div>
        {lines.length > 0 && (
          <button
            type="button"
            onClick={() => save([])}
            className="text-xs font-semibold text-zinc-500 hover:text-red-600 hover:underline"
          >
            Clear bag
          </button>
        )}
      </div>

      {lines.length === 0 ? (
        <div className="cart-empty">
          <p>Your bag is empty.</p>
          <Link className="button button-primary" href="/collections/all">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-lines">
            {lines.map((line) => (
              <article className="cart-line" key={line.variantId}>
                <div className="cart-thumb relative flex items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white p-1">
                  {line.product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={line.product.imageUrl}
                      alt={line.product.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className={`phone-case phone-case-${line.product.tone}`}>
                      <div className="cart-camera" />
                    </div>
                  )}
                </div>

                <div className="cart-line-info">
                  <p>{line.product.compatibility}</p>
                  <Link href={`/product/${line.product.slug}`}>
                    <strong>{line.product.name}</strong>
                  </Link>
                  <span>{line.variant.name}</span>
                  <b>₹{line.variant.price.toLocaleString("en-IN")}</b>
                </div>

                <div className="cart-line-actions">
                  <div className="quantity">
                    <button
                      type="button"
                      onClick={() =>
                        save(
                          items.map((item) =>
                            item.variantId === line.variantId
                              ? {
                                  ...item,
                                  quantity: Math.max(1, item.quantity - 1),
                                }
                              : item
                          )
                        )
                      }
                    >
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        save(
                          items.map((item) =>
                            item.variantId === line.variantId
                              ? {
                                  ...item,
                                  quantity: Math.min(
                                    line.variant.stock || 99,
                                    item.quantity + 1
                                  ),
                                }
                              : item
                          )
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="remove"
                    onClick={() =>
                      save(items.filter((item) => item.variantId !== line.variantId))
                    }
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>Order summary</h2>
            <div>
              <span>Subtotal</span>
              <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
            </div>
            <div>
              <span>Shipping</span>
              <strong>{shipping === 0 ? "Free" : `₹${shipping}`}</strong>
            </div>
            <div className="cart-total">
              <span>Total</span>
              <strong>₹{total.toLocaleString("en-IN")}</strong>
            </div>
            <p>
              Final tax, coupon and delivery amounts are validated at checkout.
            </p>
            <Link className="button button-primary" href="/checkout">
              Proceed to checkout
            </Link>
            <Link className="continue" href="/collections/all">
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
