import { checkPageRole } from "@/lib/role-guard";
import { DocumentsPageClient } from "./documents-client";

export default async function DocumentsPage() {
  await checkPageRole("documents");
  return <DocumentsPageClient />;
}
