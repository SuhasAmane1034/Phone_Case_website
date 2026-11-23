"use client";

import { useState } from "react";
import type { CatalogProduct } from "@/data/catalog";
import { ProductImageMagnifier } from "@/components/storefront/product-image-magnifier";

const views = ["Front view", "Detail view", "Side view"];

function ProductArtwork({
  tone,
  view,
}: {
  tone: CatalogProduct["tone"];
  view: number;
}) {
  return (
    <div className={`phone-case phone-case-${tone} gallery-art-view-${view}`}>
      <div className="camera-cut">
        <i />
        <i />
        <i />
      </div>
      <span className="case-mark">GY</span>
      <span className="racing-stripe" />
    </div>
  );
}

export function ProductGallery({ product }: { product: CatalogProduct }) {
  const images =
    product.images && product.images.length > 0
      ? product.images
      : product.imageUrl
        ? [product.imageUrl]
        : [];

  const [activeView, setActiveView] = useState(0);

  if (images.length > 0) {
    const currentImg = images[activeView] || images[0];
    return (
      <div className="pdp-gallery">
        <div className="pdp-main" data-view={activeView}>
          {product.badge && <span className="product-badge">{product.badge}</span>}
          <ProductImageMagnifier
            key={activeView}
            label={`${product.name}, image ${activeView + 1}`}
          >
            <div className="flex h-full w-full items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentImg}
                alt={`${product.name} view ${activeView + 1}`}
                className="max-h-[460px] w-auto max-w-full rounded-xl object-contain"
              />
            </div>
          </ProductImageMagnifier>
        </div>
        {images.length > 1 && (
          <div className="pdp-thumbs" aria-label="Product views">
            {images.map((img, index) => (
              <button
                key={img + index}
                type="button"
                aria-label={`View image ${index + 1}`}
                aria-pressed={activeView === index}
                className={`overflow-hidden rounded-lg border p-1 ${
                  activeView === index ? "selected border-black" : "border-zinc-200"
                }`}
                onClick={() => setActiveView(index)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  className="h-16 w-16 rounded object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pdp-gallery">
      <div className="pdp-main" data-view={activeView}>
        <span className="product-badge">{product.badge}</span>
        <ProductImageMagnifier
          key={activeView}
          label={`${product.name}, ${views[activeView].toLowerCase()}`}
        >
          <ProductArtwork tone={product.tone} view={activeView} />
        </ProductImageMagnifier>
      </div>
      <div className="pdp-thumbs" aria-label="Product views">
        {views.map((view, index) => (
          <button
            key={view}
            type="button"
            aria-label={`View ${view.toLowerCase()}`}
            aria-pressed={activeView === index}
            className={activeView === index ? "selected" : ""}
            onClick={() => setActiveView(index)}
          >
            <ProductArtwork tone={product.tone} view={index} />
          </button>
        ))}
      </div>
    </div>
  );
}
