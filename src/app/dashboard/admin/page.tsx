import { checkPageRole } from "@/lib/role-guard";
import { AdminPageClient } from "./admin-client";

export default async function AdminPage() {
  await checkPageRole("admin");
  return <AdminPageClient />;
}