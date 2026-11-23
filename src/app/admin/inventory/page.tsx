import AdminSectionPage from "@/app/admin/[section]/page";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  return (
    <AdminSectionPage
      params={Promise.resolve({ section: "inventory" })}
      searchParams={searchParams}
    />
  );
}
