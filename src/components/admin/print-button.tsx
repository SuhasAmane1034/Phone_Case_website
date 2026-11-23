"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition hover:bg-zinc-100"
    >
      Print
    </button>
  );
}
