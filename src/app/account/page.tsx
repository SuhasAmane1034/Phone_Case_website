import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: adminRole }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("admin_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16">
      <h1 className="text-4xl font-black tracking-tight">My account</h1>
      <p className="mt-3 text-zinc-600">{profile?.full_name || user.email}</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adminRole && (
          <Link
            href="/admin"
            className="rounded-lg border-2 border-black bg-black p-6 font-bold text-white shadow-sm transition hover:bg-zinc-800"
          >
            Admin Control Panel →
            <span className="mt-1 block text-xs font-normal capitalize text-zinc-300">
              Role: {adminRole.role.replaceAll("_", " ")}
            </span>
          </Link>
        )}
        <Link href="/account/orders" className="rounded-lg border p-6 font-bold">
          Order history
        </Link>
        <Link
          href="/account/addresses"
          className="rounded-lg border p-6 font-bold"
        >
          Saved addresses
        </Link>
        <Link href="/account/wishlist" className="rounded-lg border p-6 font-bold">
          Wishlist
        </Link>
      </div>

      <form action={signOut} className="mt-10">
        <button
          type="submit"
          className="h-11 rounded-md border px-5 text-sm font-bold"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
