import Link from "next/link";

export default function UnauthorizedAdminPage() {
  return (
    <main className="mx-auto max-w-xl rounded-2xl border border-zinc-200 bg-white p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
        Access restricted
      </p>
      <h1 className="mt-3 text-2xl font-black">You don&apos;t have access</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Your administrator role does not include this section.
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-xs font-bold uppercase tracking-wider text-white"
      >
        Back to overview
      </Link>
    </main>
  );
}
