export type DocumentCategory = "SOP" | "SURAT_MASUK" | "SURAT_KELUAR" | "KONTRAK" | "PERIZINAN" | "MEMO" | "EDARAN";
export type DocumentStatus = "DRAFT" | "MENUNGGU_REVIEW" | "DISETUJUI" | "DIARSIPKAN";

export type ReportPeriodType = "DAILY" | "WEEKLY" | "MONTHLY";
export type ReportStatus = "SUBMITTED" | "REVIEWED" | "APPROVED" | "REJECTED";

export type OfficeItemCategory = "ATK" | "PANTRY" | "FORMULIR" | "LAINNYA";
export type SupplyRequestStatus = "PENDING" | "APPROVED_BRANCH" | "APPROVED_HQ" | "REJECTED" | "COMPLETED";

export type PettyCashType = "INCOME" | "EXPENSE";
export type PettyCashCategory = "OPERATIONAL" | "CONSUMPTION" | "TRANSPORT" | "SUPPLIES" | "UTILITY" | "REIMBURSEMENT";
export type PettyCashStatus = "PENDING" | "VERIFIED" | "REIMBURSED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TargetDepartment = "GUDANG" | "FINANCE" | "HR" | "IT" | "UMUM" | "SALES";

export type BulletinCategory = "POLICY" | "HOLIDAY" | "MEMO_DIREKSI" | "ANNOUNCEMENT";
export type BulletinPriority = "NORMAL" | "IMPORTANT" | "CRITICAL";
export type BulletinAudience = "ALL" | "CABANG_ONLY" | "HQ_ONLY";

export type SalesChecklistStatus = "DRAFT" | "IN_REVIEW" | "COMPLIANT" | "INCOMPLETE";
export type AfterSalesType = "COMPLAINT" | "WARRANTY_CLAIM" | "SERVICE_REQUEST" | "RETURN";
export type AfterSalesPriority = "NORMAL" | "HIGH" | "URGENT";
export type AfterSalesStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED";

export interface BranchOption {
  id: string;
  name: string;
  code: string;
}

export interface UserOption {
  id: string;
  name: string;
  role: string;
}

export interface SalesChecklistItem {
  id: string;
  orderNumber: string;
  customerName: string;
  branch: { id: string; name: string; code: string };
  salesPerson: { id: string; name: string; role: string };
  verifiedBy: { id: string; name: string; role: string } | null;
  formOrderVerified: boolean;
  customerIdentityVerified: boolean;
  financingDocVerified: boolean;
  invoiceVerified: boolean;
  deliveryHandoverVerified: boolean;
  status: string;
  notes: string | null;
  createdAt: string;
}

export interface CatalogItem {
  id: string;
  title: string;
  type: string;
  version: string;
  fileUrl: string | null;
  description: string | null;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AfterSalesCaseItem {
  id: string;
  caseNumber: string;
  customerName: string;
  type: string;
  priority: string;
  status: string;
  slaDueDate: string | null;
  resolvedAt: string | null;
  description: string;
  resolution: string | null;
  branch: { id: string; name: string; code: string };
  creator: { id: string; name: string; role: string };
  assignee: { id: string; name: string; role: string } | null;
  createdAt: string;
}