import Link from "next/link";
import type { ReactNode } from "react";

const navigation = [
  { label: "Overview", href: "/admin", permission: "dashboard.read" },
  { label: "Orders", href: "/admin/orders", permission: "orders.read" },
  { label: "Products", href: "/admin/products", permission: "catalog.read" },
  { label: "Categories", href: "/admin/categories", permission: "catalog.read" },
  {
    label: "Collections",
    href: "/admin/collections",
    permission: "catalog.read",
  },
  {
    label: "Inventory",
    href: "/admin/inventory",
    permission: "inventory.read",
  },
  {
    label: "Customers",
    href: "/admin/customers",
    permission: "customers.read",
  },
  {
    label: "Payments",
    href: "/admin/payments",
    permission: "payments.read",
  },
  { label: "Coupons", href: "/admin/coupons", permission: "coupons.write" },
  { label: "Reviews", href: "/admin/reviews", permission: "reviews.write" },
  {
    label: "Content",
    href: "/admin/content",
    permission: "content.write",
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    permission: "dashboard.read",
  },
  {
    label: "Shipping",
    href: "/admin/shipping",
    permission: "shipping.write",
  },
  {
    label: "Settings",
    href: "/admin/settings",
    permission: "settings.read",
  },
  {
    label: "Activity log",
    href: "/admin/activity",
    permission: "activity.read",
  },
  {
    label: "Admin users",
    href: "/admin/users",
    permission: "admin.roles.manage",
  },
];

export function AdminShell({
  children,
  email,
  permissions,
  role,
}: {
  children: ReactNode;
  email: string;
  permissions: string[];
  role: string;
}) {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950 lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="bg-zinc-950 px-5 py-6 text-white lg:min-h-screen">
        <Link
          href="/admin"
          className="block text-lg font-black tracking-[-0.06em]"
        >
          GHYAMAJHA <span className="text-lime-300">/ CONTROL</span>
        </Link>
        <div className="mt-8 border-y border-white/10 py-4">
          <p className="truncate text-sm font-semibold">{email}</p>
          <p className="mt-1 text-xs capitalize text-zinc-400">
            {role.replaceAll("_", " ")}
          </p>
        </div>
        <nav
          aria-label="Admin navigation"
          className="mt-5 flex gap-2 overflow-x-auto lg:flex-col"
        >
          {navigation
            .filter((item) => permissions.includes(item.permission))
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
        </nav>
        <Link
          href="/"
          className="mt-8 inline-flex text-xs font-semibold text-zinc-400 transition hover:text-white"
        >
          ← View storefront
        </Link>
      </aside>
      <div className="min-w-0 px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
        {children}
      </div>
    </div>
  );
}
