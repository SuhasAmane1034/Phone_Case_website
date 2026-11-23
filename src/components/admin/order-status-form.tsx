"use client";

import type { FormEvent } from "react";
import { updateOrderStatus } from "@/app/admin/orders/actions";

export function OrderStatusForm({
  orderId,
  statuses,
}: {
  orderId: string;
  statuses: string[];
}) {
  function confirmCancellation(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    if (
      formData.get("status") === "cancelled" &&
      !window.confirm("Cancel this order? This action will be recorded.")
    ) {
      event.preventDefault();
    }
  }

  if (!statuses.length) {
    return (
      <p className="text-sm text-zinc-500">
        This order has no valid next status.
      </p>
    );
  }

  return (
    <form
      action={updateOrderStatus}
      onSubmit={confirmCancellation}
      className="grid gap-3"
    >
      <input type="hidden" name="orderId" value={orderId} />
      <label className="grid gap-1 text-xs font-semibold text-zinc-600">
        New status
        <select
          name="status"
          required
          className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold text-zinc-600">
        Courier Tracking / AWB Number (optional)
        <input
          name="trackingNumber"
          placeholder="e.g. BD123456789IN or AWB98765432"
          className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900"
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-zinc-600">
        Carrier Tracking URL (optional)
        <input
          name="trackingUrl"
          type="url"
          placeholder="https://track.bluedart.com/..."
          className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900"
        />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-zinc-600">
        Internal note (optional)
        <textarea
          name="note"
          maxLength={1000}
          rows={3}
          className="rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900"
        />
      </label>
      <button className="h-11 rounded-lg bg-zinc-950 px-4 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-zinc-700">
        Update order
      </button>
    </form>
  );
}
