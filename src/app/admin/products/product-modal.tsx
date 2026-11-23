"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { saveProduct } from "@/app/admin/products/actions";

function ModalSubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-black px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving All Product Data & Images..." : isEditing ? "Save Changes" : "Create Product"}
    </button>
  );
}

export type ProductImageItem = {
  id: string;
  type: "url" | "file";
  url: string;
  file?: File;
  is_primary: boolean;
};

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  category_id: string | null;
  regular_price_inr: number;
  sale_price_inr: number | null;
  short_description: string;
  description: string;
  primary_image?: string | null;
  images?: { url: string; is_primary: boolean; position: number }[];
  is_active: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
};

export function ProductModal({
  categories,
  initialData,
  triggerLabel = "+ Add Product",
  triggerClass = "rounded-lg bg-black px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-zinc-800",
}: {
  categories: { id: string; name: string }[];
  initialData?: ProductFormValues;
  triggerLabel?: string;
  triggerClass?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<ProductImageItem[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const isEditing = Boolean(initialData?.id);

  function initializeImages(): ProductImageItem[] {
    if (initialData?.images && initialData.images.length > 0) {
      return initialData.images.map((img, idx) => ({
        id: `existing-${idx}-${Date.now()}`,
        type: "url",
        url: img.url,
        is_primary: img.is_primary,
      }));
    }
    if (initialData?.primary_image) {
      return [
        {
          id: `primary-${Date.now()}`,
          type: "url",
          url: initialData.primary_image,
          is_primary: true,
        },
      ];
    }
    return [];
  }

  function handleOpen() {
    setImages(initializeImages());
    setUrlInput("");
    setIsOpen(true);
  }

  function handleAddUrl() {
    const raw = urlInput.trim();
    if (!raw) return;

    const urls = raw
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urls.length === 0) return;

    setImages((prev) => {
      const updated = [...prev];
      const hasPrimary = updated.some((img) => img.is_primary);

      urls.forEach((url, i) => {
        updated.push({
          id: `url-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          type: "url",
          url,
          is_primary: !hasPrimary && i === 0,
        });
      });
      return updated;
    });

    setUrlInput("");
  }

  function handleFilesSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newItems: ProductImageItem[] = [];
    const hasPrimary = images.some((img) => img.is_primary);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const objectUrl = URL.createObjectURL(file);
      newItems.push({
        id: `file-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        type: "file",
        url: objectUrl,
        file,
        is_primary: !hasPrimary && i === 0,
      });
    }

    setImages((prev) => [...prev, ...newItems]);
    // Reset native input so selecting more files later triggers onChange
    event.target.value = "";
  }

  function handleSetPrimary(index: number) {
    setImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        is_primary: idx === index,
      }))
    );
  }

  function handleRemoveImage(index: number) {
    setImages((prev) => {
      const target = prev[index];
      if (target?.type === "file" && target.url.startsWith("blob:")) {
        URL.revokeObjectURL(target.url);
      }
      const updated = prev.filter((_, idx) => idx !== index);
      if (updated.length > 0 && !updated.some((img) => img.is_primary)) {
        updated[0].is_primary = true;
      }
      return updated;
    });
  }

  async function handleSubmit(formData: FormData) {
    const filesToUpload: File[] = [];
    const manifest: {
      type: "url" | "file";
      url?: string;
      fileIndex?: number;
      is_primary: boolean;
    }[] = [];

    images.forEach((img) => {
      if (img.type === "file" && img.file) {
        const fileIndex = filesToUpload.length;
        filesToUpload.push(img.file);
        manifest.push({
          type: "file",
          fileIndex,
          is_primary: img.is_primary,
        });
      } else if (img.type === "url" && img.url) {
        manifest.push({
          type: "url",
          url: img.url,
          is_primary: img.is_primary,
        });
      }
    });

    // Delete any raw form inputs
    formData.delete("image_files");
    formData.delete("image_file");

    // Append every accumulated File so ALL of them are sent together
    filesToUpload.forEach((file) => {
      formData.append("image_files", file);
    });

    // Send the manifest so server preserves order & primary status
    formData.set("images_manifest", JSON.stringify(manifest));

    await saveProduct(formData);
  }

  return (
    <>
      <button type="button" onClick={handleOpen} className={triggerClass}>
        {triggerLabel}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {isEditing ? "Catalog Management" : "New Entry"}
                </p>
                <h2 className="text-xl font-black tracking-tight">
                  {isEditing ? "Edit Product" : "Create New Product"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-black"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form action={handleSubmit} className="mt-6 space-y-5">
              {initialData?.id && (
                <input type="hidden" name="id" value={initialData.id} />
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Product Name *
                  <input
                    name="name"
                    required
                    defaultValue={initialData?.name ?? ""}
                    placeholder="e.g. Monza Leather Case"
                    className="h-11 rounded-lg border border-zinc-300 px-3 text-sm font-normal text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Slug / URL key
                  <input
                    name="slug"
                    defaultValue={initialData?.slug ?? ""}
                    placeholder="e.g. monza-leather-case (optional)"
                    className="h-11 rounded-lg border border-zinc-300 px-3 text-sm font-normal text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-700">
                  SKU
                  <input
                    name="sku"
                    defaultValue={initialData?.sku ?? ""}
                    placeholder="e.g. MONZA-01"
                    className="h-11 rounded-lg border border-zinc-300 px-3 text-sm font-normal text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Category
                  <select
                    name="category_id"
                    defaultValue={initialData?.category_id ?? ""}
                    className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-normal text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">No Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Regular Price (₹ INR) *
                  <input
                    name="regular_price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={initialData?.regular_price_inr ?? ""}
                    placeholder="1499.00"
                    className="h-11 rounded-lg border border-zinc-300 px-3 text-sm font-normal text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Sale Price (₹ INR, optional)
                  <input
                    name="sale_price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={initialData?.sale_price_inr ?? ""}
                    placeholder="799.00"
                    className="h-11 rounded-lg border border-zinc-300 px-3 text-sm font-normal text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </label>
              </div>

              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-700">
                Short Description
                <input
                  name="short_description"
                  defaultValue={initialData?.short_description ?? ""}
                  placeholder="Single-sentence summary of device protection & styling"
                  className="h-11 rounded-lg border border-zinc-300 px-3 text-sm font-normal text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </label>

              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-700">
                Full Description
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={initialData?.description ?? ""}
                  placeholder="Detailed product specifications, materials, and benefits"
                  className="rounded-lg border border-zinc-300 p-3 text-sm font-normal text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </label>

              {/* Product Images Management */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center justify-between pb-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                      Product Images ({images.length})
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      Add as many photos as you want. All of them will be saved together.
                    </p>
                  </div>
                  {images.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setImages([])}
                      className="text-[11px] font-semibold text-red-600 hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Images Grid */}
                {images.length > 0 ? (
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {images.map((img, idx) => (
                      <div
                        key={img.id}
                        className={`group relative flex flex-col items-center overflow-hidden rounded-xl border bg-white p-2 shadow-xs transition ${
                          img.is_primary
                            ? "border-black ring-2 ring-black/10"
                            : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-zinc-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt={`Product preview ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                          {img.is_primary && (
                            <span className="absolute left-1.5 top-1.5 rounded bg-black px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-xs">
                              Cover
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-xs text-white opacity-80 transition hover:bg-black hover:opacity-100"
                            title="Remove image"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="mt-2 flex w-full items-center justify-between">
                          <span className="text-[10px] font-mono text-zinc-400">
                            #{idx + 1}
                          </span>
                          {!img.is_primary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(idx)}
                              className="text-[10px] font-bold text-zinc-700 hover:text-black hover:underline"
                            >
                              Make Cover
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-4 rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center">
                    <p className="text-xs font-semibold text-zinc-500">
                      No images added yet. Click &quot;Select Image Files&quot; below to add all your photos.
                    </p>
                  </div>
                )}

                {/* File Picker & URL Adder */}
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-400 bg-white px-4 py-3 text-xs font-bold text-zinc-800 transition hover:bg-zinc-100">
                      <span>📁 Select Image Files (Add one or multiple)</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFilesSelect}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddUrl();
                        }
                      }}
                      placeholder="Or paste image URL (e.g. https://...)"
                      className="h-10 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-xs text-zinc-900 focus:border-black focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddUrl}
                      className="h-10 shrink-0 rounded-lg bg-zinc-900 px-4 text-xs font-bold text-white hover:bg-black"
                    >
                      + Add URL
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Flags & Display Options
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-800">
                    <input
                      type="checkbox"
                      name="is_active"
                      value="true"
                      defaultChecked={initialData?.is_active ?? true}
                      className="h-4 w-4 rounded border-zinc-300 accent-black"
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-800">
                    <input
                      type="checkbox"
                      name="is_featured"
                      value="true"
                      defaultChecked={initialData?.is_featured ?? false}
                      className="h-4 w-4 rounded border-zinc-300 accent-black"
                    />
                    Featured
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-800">
                    <input
                      type="checkbox"
                      name="is_bestseller"
                      value="true"
                      defaultChecked={initialData?.is_bestseller ?? false}
                      className="h-4 w-4 rounded border-zinc-300 accent-black"
                    />
                    Bestseller
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-800">
                    <input
                      type="checkbox"
                      name="is_new_arrival"
                      value="true"
                      defaultChecked={initialData?.is_new_arrival ?? false}
                      className="h-4 w-4 rounded border-zinc-300 accent-black"
                    />
                    New Arrival
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-zinc-300 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <ModalSubmitButton isEditing={isEditing} />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
