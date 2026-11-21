import { checkPageRole } from "@/lib/role-guard";
import { ReportsPageClient } from "./reports-client";

export default async function ReportsPage() {
  await checkPageRole("reports");
  return <ReportsPageClient />;
}