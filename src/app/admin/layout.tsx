import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminContext } from "@/lib/admin/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, role, permissions } = await getAdminContext();

  return (
    <AdminShell
      email={user.email ?? "Admin"}
      permissions={permissions}
      role={role}
    >
      {children}
    </AdminShell>
  );
}
