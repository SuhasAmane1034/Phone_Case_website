"use client";

import type { FormEvent } from "react";
import {
  ProductModal,
  type ProductFormValues,
} from "@/app/admin/products/product-modal";
import {
  deleteProduct,
  toggleProductStatus,
} from "@/app/admin/products/actions";

export function ProductRowActions({
  product,
  categories,
}: {
  product: ProductFormValues;
  categories: { id: string; name: string }[];
}) {
  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(`Delete product "${product.name}"? This cannot be undone.`)) {
      event.preventDefault();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <ProductModal
        categories={categories}
        initialData={product}
        triggerLabel="Edit"
        triggerClass="rounded border border-zinc-300 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
      />

      <form action={toggleProductStatus}>
        <input type="hidden" name="id" value={product.id} />
        <input
          type="hidden"
          name="currentStatus"
          value={String(product.is_active)}
        />
        <button
          type="submit"
          title={product.is_active ? "Archive this product" : "Activate this product"}
          className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
            product.is_active
              ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
              : "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          }`}
        >
          {product.is_active ? "Archive" : "Activate"}
        </button>
      </form>

      <form action={deleteProduct} onSubmit={confirmDelete}>
        <input type="hidden" name="id" value={product.id} />
        <button
          type="submit"
          title="Delete product"
          className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
        >
          Delete
        </button>
      </form>
    </div>
  );
}
