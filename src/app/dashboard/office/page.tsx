import { checkPageRole } from "@/lib/role-guard";
import { OfficePageClient } from "./office-client";

export default async function OfficePage() {
  await checkPageRole("office");
  return <OfficePageClient />;
}