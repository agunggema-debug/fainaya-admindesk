import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const ROLE_ACCESS: Record<string, string[]> = {
  reports: ["HQ_COORDINATOR", "BRANCH_ADMIN", "BRANCH_MANAGER", "SYSTEM_ADMIN"],
  office: ["HQ_COORDINATOR", "BRANCH_ADMIN", "BRANCH_MANAGER", "SYSTEM_ADMIN"],
  admin: ["HQ_COORDINATOR", "SYSTEM_ADMIN"],
  sales: ["HQ_COORDINATOR", "BRANCH_ADMIN", "SALES_SUPPORT", "CUSTOMER_SERVICE", "BRANCH_MANAGER", "SYSTEM_ADMIN"],
  documents: ["HQ_COORDINATOR", "BRANCH_ADMIN", "SALES_SUPPORT", "CUSTOMER_SERVICE", "BRANCH_MANAGER", "SYSTEM_ADMIN"],
  coordination: ["HQ_COORDINATOR", "BRANCH_ADMIN", "SALES_SUPPORT", "CUSTOMER_SERVICE", "BRANCH_MANAGER", "SYSTEM_ADMIN"],
};

export async function checkPageRole(pageKey: string) {
  const allowed = ROLE_ACCESS[pageKey];
  if (!allowed) return;

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
    return;
  }

  if (!allowed.includes(user.role)) {
    redirect("/dashboard");
  }
}