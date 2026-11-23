import { adjustInventory } from "@/app/admin/inventory/actions";

export function AdjustInventoryForm({ variantId }: { variantId: string }) {
  return (
    <form action={adjustInventory} className="grid min-w-56 gap-2">
      <input type="hidden" name="variantId" value={variantId} />
      <div className="flex gap-2">
        <label className="sr-only" htmlFor={`delta-${variantId}`}>
          Stock adjustment quantity
        </label>
        <input
          id={`delta-${variantId}`}
          name="delta"
          type="number"
          required
          min={-100000}
          max={100000}
          placeholder="+ / − quantity"
          className="h-9 min-w-0 flex-1 rounded-md border border-zinc-300 px-2 text-sm"
        />
        <button className="rounded-md bg-zinc-950 px-3 text-xs font-bold text-white">
          Adjust
        </button>
      </div>
      <label className="sr-only" htmlFor={`reason-${variantId}`}>
        Adjustment reason
      </label>
      <input
        id={`reason-${variantId}`}
        name="reason"
        required
        minLength={3}
        maxLength={500}
        placeholder="Reason"
        className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
      />
    </form>
  );
}
