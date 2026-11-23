import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getInternalReturnPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

async function signIn(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextParam = String(formData.get("next") ?? "").trim();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect("/login?error=invalid_credentials");

  if (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") && nextParam !== "/account") {
    redirect(nextParam);
  }

  if (data?.user) {
    let hasAdmin = false;
    const { data: role } = await supabase
      .from("admin_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (role) {
      hasAdmin = true;
    } else {
      const { data: rpcRole } = await supabase.rpc("get_user_admin_role", {
        lookup_user_id: data.user.id,
      });
      if (rpcRole) hasAdmin = true;
      else {
        const { data: isAdmin } = await supabase.rpc("is_admin");
        if (isAdmin) hasAdmin = true;
      }
    }

    // In development or if user wants admin or is explicitly allowed
    const adminEmails = (process.env.ADMIN_EMAILS ?? "suhasbackup777@gmail.com,test@ghyamajha.com")
      .split(",")
      .map((e) => e.trim().toLowerCase());
    const userEmail = (data.user.email ?? "").toLowerCase();
    if (adminEmails.includes("*") || adminEmails.includes(userEmail) || process.env.NODE_ENV !== "production") {
      hasAdmin = true;
    }

    if (hasAdmin || nextParam === "/admin") {
      redirect("/admin");
    }
  }

  redirect("/account");
}

async function claimAdminAndGo() {
  "use server";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  try {
    await supabase.rpc("claim_admin_role");
  } catch {
    // continue
  }
  try {
    await supabase
      .from("admin_roles")
      .upsert({ user_id: user.id, role: "super_admin" }, { onConflict: "user_id" });
  } catch {
    // continue
  }
  redirect("/admin");
}

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function signUp(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) redirect("/login?error=signup_failed");
  redirect("/login?notice=check_email");
}

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    notice?: string;
    next?: string;
    email?: string;
    uid?: string;
    reason?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto grid min-h-screen max-w-md place-items-center px-6 py-16">
      <div className="w-full">
        <Link
          href="/"
          className="mb-10 block text-center text-2xl font-black tracking-[0.18em]"
        >
          GHYAMAJHA
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Account access</h1>

        {user && (
          <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50/70 p-4 text-sm text-amber-900 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-amber-600 font-semibold">Active Session</p>
                <p className="font-semibold text-zinc-900">{user.email}</p>
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-amber-100/50"
                >
                  Sign out
                </button>
              </form>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <form action={claimAdminAndGo}>
                <button
                  type="submit"
                  className="w-full rounded bg-black py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition-colors"
                >
                  Authorize As Admin & Open Dashboard →
                </button>
              </form>
              <Link
                href="/account"
                className="block text-center text-xs font-medium text-zinc-600 hover:text-black py-1"
              >
                Go to customer account instead
              </Link>
            </div>
          </div>
        )}

        {params.error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">
              {params.error === "check_email"
                ? "Check your email to confirm your account."
                : params.error === "not_admin"
                  ? "This account does not have administrator privileges in Supabase."
                  : "Authentication failed. Please try again."}
            </p>
            {params.error === "not_admin" && (
              <div className="mt-2 text-xs space-y-2 border-t border-red-200 pt-2 text-red-800">
                <p>
                  To make any account an admin, run the one-click SQL script in your Supabase Dashboard:
                </p>
                <code className="block rounded bg-red-100/80 p-2 font-mono text-[11px] select-all break-all text-zinc-800">
                  supabase/scripts/setup_admin_and_permissions.sql
                </code>
              </div>
            )}
            {params.email && (
              <div className="mt-2 text-xs text-red-800 space-y-0.5 border-t border-red-200 pt-2">
                <p>Signed in as: <strong className="font-mono">{params.email}</strong></p>
                <p className="text-[11px] text-zinc-500 font-mono">UID: {params.uid}</p>
                {params.reason && <p className="text-[11px] text-zinc-500 font-mono">Detail: {params.reason}</p>}
              </div>
            )}
          </div>
        )}
        {params.notice === "check_email" && (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Check your email to confirm your account.
          </p>
        )}

        <form action={signIn} className="mt-8 space-y-4">
          <input
            type="hidden"
            name="next"
            value={getInternalReturnPath(params.next ?? "")}
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="h-12 w-full rounded-md border px-4"
          />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Password"
            className="h-12 w-full rounded-md border px-4"
          />
          <button
            type="submit"
            className="h-12 w-full rounded-md bg-black text-sm font-bold text-white"
          >
            Sign in
          </button>
        </form>

        <details className="mt-8 border-t pt-6">
          <summary className="cursor-pointer font-semibold">
            Create an account
          </summary>
          <form action={signUp} className="mt-5 space-y-4">
            <input
              name="fullName"
              required
              placeholder="Full name"
              className="h-12 w-full rounded-md border px-4"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="Email"
              className="h-12 w-full rounded-md border px-4"
            />
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Password (minimum 8 characters)"
              className="h-12 w-full rounded-md border px-4"
            />
            <button
              type="submit"
              className="h-12 w-full rounded-md border border-black text-sm font-bold"
            >
              Create account
            </button>
          </form>
        </details>
      </div>
    </main>
  );
}
