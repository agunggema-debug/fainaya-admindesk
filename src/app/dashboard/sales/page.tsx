import { checkPageRole } from "@/lib/role-guard";
import { SalesPageClient } from "./sales-client";

export default async function SalesPage() {
  await checkPageRole("sales");
  return <SalesPageClient />;
}
