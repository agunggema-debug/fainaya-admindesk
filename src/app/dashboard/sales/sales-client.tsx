"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Megaphone, AlertTriangle, Trash2, X, Loader2, CheckSquare } from "lucide-react";
import type { BranchOption, UserOption, SalesChecklistItem, CatalogItem, AfterSalesCaseItem } from "@/lib/types";

const CHECKLIST_STATUSES = ["DRAFT", "IN_REVIEW", "COMPLIANT", "INCOMPLETE"];
const CHECKLIST_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In Review",
  COMPLIANT: "Compliant",
  INCOMPLETE: "Incomplete",
};

const CATALOG_TYPES = ["PRICELIST", "PROMO_SCHEME", "TERMS_CONDITIONS"];

const AFTER_TYPES = ["COMPLAINT", "WARRANTY_CLAIM", "SERVICE_REQUEST", "RETURN"];
const AFTER_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "ESCALATED"];
const AFTER_PRIORITIES = ["NORMAL", "HIGH", "URGENT"];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function formatDueDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const overdue = new Date().getTime() > d.getTime();
  return `${formatDate(dateStr)}${overdue ? " (JTH)" : ""}`;
}

export function SalesPageClient() {
  const router = useRouter();
  const [tab, setTab] = useState<"checklists" | "catalogs" | "after-sales">("checklists");
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Checklists
  const [checklists, setChecklists] = useState<SalesChecklistItem[]>([]);
  const [cLoading, setCLoading] = useState(true);
  const [cShowForm, setCShowForm] = useState(false);
  const [cSaving, setCSaving] = useState(false);
  const [cForm, setCForm] = useState({ orderNumber: "", customerName: "", branchId: "", salesPersonId: "", notes: "", verifiedById: "" });

  // Catalogs
  const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catShowForm, setCatShowForm] = useState(false);
  const [catSaving, setCatSaving] = useState(false);
  const [catForm, setCatForm] = useState({ title: "", type: "PRICELIST", version: "v1.0", description: "", validUntil: "", branchId: "" });

  // After Sales
  const [cases, setCases] = useState<AfterSalesCaseItem[]>([]);
  const [asLoading, setAsLoading] = useState(true);
  const [asShowForm, setAsShowForm] = useState(false);
  const [asSaving, setAsSaving] = useState(false);
  const [asForm, setAsForm] = useState({ caseNumber: "", customerName: "", type: "COMPLAINT", priority: "NORMAL", slaDueDate: "", description: "", branchId: "", assigneeId: "" });

  const fetchChecklists = async () => {
    try {
      const res = await fetch("/api/sales/checklists");
      if (!res.ok) throw new Error("Gagal memuat checklist");
      const data = await res.json();
      setChecklists(data.checklists || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setCLoading(false);
    }
  };

  const fetchCatalogs = async () => {
    try {
      const res = await fetch("/api/sales/catalogs");
      if (!res.ok) throw new Error("Gagal memuat katalog");
      const data = await res.json();
      setCatalogs(data.catalogs || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setCatLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      const res = await fetch("/api/sales/after-sales");
      if (!res.ok) throw new Error("Gagal memuat kasus after-sales");
      const data = await res.json();
      setCases(data.cases || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setAsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        await Promise.all([fetchChecklists(), fetchCatalogs(), fetchCases()]);
        const docRes = await fetch("/api/documents");
        const docData = await docRes.json();
        if (!cancelled) setBranches(docData.branches || []);
        const auditRes = await fetch("/api/admin/audit?limit=1");
        const auditData = await auditRes.json();
        if (!cancelled) setUsers(auditData.users || []);
      } catch {}
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // === Checklists ===
  function openChecklistCreate() {
    setCForm({ orderNumber: "", customerName: "", branchId: branches[0]?.id || "", salesPersonId: users[0]?.id || "", notes: "", verifiedById: "" });
    setCShowForm(true);
  }

  async function submitChecklist(e: React.FormEvent) {
    e.preventDefault();
    setCSaving(true);
    try {
      const res = await fetch("/api/sales/checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat checklist");
      setCShowForm(false);
      setSuccess("Checklist penjualan berhasil dibuat.");
      setCForm({ orderNumber: "", customerName: "", branchId: branches[0]?.id || "", salesPersonId: users[0]?.id || "", notes: "", verifiedById: "" });
      fetchChecklists();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setCSaving(false);
    }
  }

  async function updateChecklistStatus(id: string, status: string) {
    const res = await fetch(`/api/sales/checklists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal mengubah status");
    fetchChecklists();
    router.refresh();
  }

  async function deleteChecklist(id: string) {
    if (!confirm("Hapus checklist ini?")) return;
    const res = await fetch(`/api/sales/checklists/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal menghapus");
    fetchChecklists();
    router.refresh();
  }

  async function toggleChecklistField(
    checklist: SalesChecklistItem,
    field: "formOrderVerified" | "customerIdentityVerified" | "financingDocVerified" | "invoiceVerified" | "deliveryHandoverVerified",
    value: boolean
  ) {
    const next = { ...checklist, [field]: value };
    if (value) {
      const allTrue = ["formOrderVerified", "customerIdentityVerified", "financingDocVerified", "invoiceVerified", "deliveryHandoverVerified"].every((f) => f === field ? true : (next as Record<string, unknown>)[f] === true);
      if (!allTrue) {
        const res = await fetch(`/api/sales/checklists/${checklist.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value, status: value ? "IN_REVIEW" : "DRAFT" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memperbarui");
      }
    }
    const res = await fetch(`/api/sales/checklists/${checklist.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal memperbarui");
    await fetchChecklists();
    router.refresh();
  }

  async function verifyChecklist(id: string, status: string) {
    const res = await fetch(`/api/sales/checklists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, verifiedById: users.find((u) => u.role === "BRANCH_ADMIN" || u.role === "BRANCH_MANAGER")?.id || users[0]?.id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal verifikasi");
    await fetchChecklists();
    router.refresh();
  }

  // === Catalogs ===
  async function submitCatalog(e: React.FormEvent) {
    e.preventDefault();
    setCatSaving(true);
    try {
      const res = await fetch("/api/sales/catalogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...catForm, branchId: catForm.branchId || undefined, validUntil: catForm.validUntil || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat katalog");
      setCatShowForm(false);
      setSuccess("Katalog berhasil dibuat.");
      setCatForm({ title: "", type: "PRICELIST", version: "v1.0", description: "", validUntil: "", branchId: "" });
      fetchCatalogs();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setCatSaving(false);
    }
  }

  async function updateCatalog(id: string, data: Record<string, unknown>) {
    const res = await fetch(`/api/sales/catalogs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Gagal memperbarui");
    fetchCatalogs();
    router.refresh();
  }

  async function deleteCatalog(id: string) {
    if (!confirm("Hapus katalog ini?")) return;
    const res = await fetch(`/api/sales/catalogs/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal menghapus");
    fetchCatalogs();
    router.refresh();
  }

  // === After Sales ===
  async function submitCase(e: React.FormEvent) {
    e.preventDefault();
    setAsSaving(true);
    try {
      const res = await fetch("/api/sales/after-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(asForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat kasus");
      setAsShowForm(false);
      setSuccess("Kasus after-sales berhasil dibuat.");
      setAsForm({ caseNumber: "", customerName: "", type: "COMPLAINT", priority: "NORMAL", slaDueDate: "", description: "", branchId: branches[0]?.id || "", assigneeId: "" });
      fetchCases();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setAsSaving(false);
    }
  }

  async function updateCase(id: string, data: Record<string, unknown>) {
    const res = await fetch(`/api/sales/after-sales/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Gagal memperbarui");
    fetchCases();
    router.refresh();
  }

  async function deleteCase(id: string) {
    if (!confirm("Hapus kasus ini?")) return;
    const res = await fetch(`/api/sales/after-sales/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal menghapus");
    fetchCases();
    router.refresh();
  }

  const TABS = [
    { id: "checklists" as const, label: "Checklist Penjualan", icon: ShieldCheck, onClick: openChecklistCreate },
    { id: "catalogs" as const, label: "Katalog & Promo", icon: Megaphone, onClick: () => setCatShowForm(true) },
    { id: "after-sales" as const, label: "After-Sales / Escalasi CS", icon: AlertTriangle, onClick: () => setAsShowForm(true) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">Dukungan Sales & Customer Service</h1>
          <p className="text-sm text-secondary">Daftar periksa berkas penjualan, distribusi katalog & promo, dan administrasi purna jual/eskalasi CS.</p>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg text-sm font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}
      {success && <div className="p-3 rounded-lg text-sm font-medium" style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.2)" }}>{success}</div>}

      <div className="flex gap-2 border-b" style={{ borderColor: "var(--border-color)" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${tab === t.id ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-muted hover:text-primary"}`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Checklists Tab */}
      {tab === "checklists" && (
        <div className="theme-card overflow-x-auto">
          {cLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
                  <th className="text-left px-4 py-3 font-semibold">No. Pesanan</th>
                  <th className="text-left px-4 py-3 font-semibold">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold">Cabang</th>
                  <th className="text-left px-4 py-3 font-semibold">Sales</th>
                  <th className="text-left px-4 py-3 font-semibold">Verifikasi</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {checklists.map((c) => (
                  <tr key={c.id} className="border-b last:border-0" style={{ borderColor: "var(--border-color)" }}>
                    <td className="px-4 py-3 font-mono text-xs">{c.orderNumber}</td>
                    <td className="px-4 py-3 font-medium max-w-[180px] truncate" title={c.customerName}>{c.customerName}</td>
                    <td className="px-4 py-3 text-xs">{c.branch.code}</td>
                    <td className="px-4 py-3 text-xs">{c.salesPerson.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {([
                          ["formOrderVerified", "Form Order"],
                          ["customerIdentityVerified", "Identitas KTP/NPWP"],
                          ["financingDocVerified", "Financing"],
                          ["invoiceVerified", "Faktur"],
                          ["deliveryHandoverVerified", "Serah Terima"],
                        ] as const).map(([f, label]) => (
                          <label key={f} className="flex items-center gap-1 text-[10px] text-secondary cursor-pointer">
                            <input type="checkbox" checked={(c as unknown as Record<string, boolean>)[f]} onChange={(e) => toggleChecklistField(c, f, e.target.checked)} className="accent-indigo-600" />
                            {label}
                          </label>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select value={c.status} onChange={(e) => updateChecklistStatus(c.id, e.target.value)} className="text-[10px] theme-input py-1 px-2">
                        {CHECKLIST_STATUSES.map((s) => <option key={s} value={s}>{CHECKLIST_STATUS_LABELS[s]}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {c.status !== "COMPLIANT" && c.status !== "INCOMPLETE" && (
                          <button onClick={() => verifyChecklist(c.id, "COMPLIANT")} className="theme-btn-secondary p-1.5" title="Verifikasi Compliant"><CheckSquare className="w-3.5 h-3.5" /></button>
                        )}
                        <button onClick={() => verifyChecklist(c.id, "INCOMPLETE")} className="theme-btn-secondary p-1.5" title="Tandai Incomplete"><X className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteChecklist(c.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Catalogs Tab */}
      {tab === "catalogs" && (
        <div className="theme-card overflow-x-auto">
          {catLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
                  <th className="text-left px-4 py-3 font-semibold">Judul</th>
                  <th className="text-left px-4 py-3 font-semibold">Tipe</th>
                  <th className="text-left px-4 py-3 font-semibold">Versi</th>
                  <th className="text-left px-4 py-3 font-semibold">Valid Hingga</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {catalogs.map((cat) => (
                  <tr key={cat.id} className="border-b last:border-0" style={{ borderColor: "var(--border-color)" }}>
                    <td className="px-4 py-3 font-medium max-w-[220px] truncate" title={cat.title}>{cat.title}</td>
                    <td className="px-4 py-3 text-xs">{cat.type}</td>
                    <td className="px-4 py-3 text-xs font-mono">{cat.version}</td>
                    <td className="px-4 py-3 text-xs">{cat.validUntil ? formatDate(cat.validUntil) : "—"}</td>
                    <td className="px-4 py-3 text-xs">{cat.isActive ? "Aktif" : "Non-Aktif"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => updateCatalog(cat.id, { isActive: !cat.isActive })} className="theme-btn-secondary p-1.5" title={cat.isActive ? "Nonaktifkan" : "Aktifkan"}><CheckSquare className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteCatalog(cat.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* After Sales Tab */}
      {tab === "after-sales" && (
        <div className="theme-card overflow-x-auto">
          {asLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
                  <th className="text-left px-4 py-3 font-semibold">No. Kasus</th>
                  <th className="text-left px-4 py-3 font-semibold">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold">Tipe</th>
                  <th className="text-left px-4 py-3 font-semibold">Prioritas</th>
                  <th className="text-left px-4 py-3 font-semibold">SLA Due</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} className="border-b last:border-0" style={{ borderColor: "var(--border-color)" }}>
                    <td className="px-4 py-3 font-mono text-xs">{c.caseNumber}</td>
                    <td className="px-4 py-3 font-medium max-w-[160px] truncate" title={c.customerName}>{c.customerName}</td>
                    <td className="px-4 py-3 text-xs">{c.type}</td>
                    <td className="px-4 py-3 text-xs">{c.priority}</td>
                    <td className="px-4 py-3 text-xs">{formatDueDate(c.slaDueDate)}</td>
                    <td className="px-4 py-3">
                      <select value={c.status} onChange={(e) => updateCase(c.id, { status: e.target.value })} className="text-[10px] theme-input py-1 px-2">
                        {AFTER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => deleteCase(c.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Checklist Modal */}
      {cShowForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="theme-card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Checklist Penjualan Baru</h2>
              <button onClick={() => setCShowForm(false)} className="theme-btn-secondary p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={submitChecklist} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">No. Pesanan</label>
                  <input type="text" required value={cForm.orderNumber} onChange={(e) => setCForm({ ...cForm, orderNumber: e.target.value })} className="theme-input w-full py-2 px-3 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nama Customer</label>
                  <input type="text" required value={cForm.customerName} onChange={(e) => setCForm({ ...cForm, customerName: e.target.value })} className="theme-input w-full py-2 px-3 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Cabang</label>
                  <select value={cForm.branchId} onChange={(e) => setCForm({ ...cForm, branchId: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Sales Person</label>
                  <select value={cForm.salesPersonId} onChange={(e) => setCForm({ ...cForm, salesPersonId: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Catatan</label>
                <textarea value={cForm.notes} onChange={(e) => setCForm({ ...cForm, notes: e.target.value })} rows={2} className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setCShowForm(false)} className="theme-btn-secondary px-4 py-2 text-sm">Batal</button>
                <button type="submit" disabled={cSaving} className="theme-btn-primary px-4 py-2 text-sm disabled:opacity-50">{cSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buat Checklist"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Catalog Modal */}
      {catShowForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="theme-card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Katalog & Promo Baru</h2>
              <button onClick={() => setCatShowForm(false)} className="theme-btn-secondary p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={submitCatalog} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Judul</label>
                <input type="text" required value={catForm.title} onChange={(e) => setCatForm({ ...catForm, title: e.target.value })} className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tipe</label>
                  <select value={catForm.type} onChange={(e) => setCatForm({ ...catForm, type: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                    {CATALOG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Versi</label>
                  <input type="text" required value={catForm.version} onChange={(e) => setCatForm({ ...catForm, version: e.target.value })} className="theme-input w-full py-2 px-3 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Deskripsi</label>
                <textarea value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} rows={2} className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Valid Hingga</label>
                  <input type="date" value={catForm.validUntil} onChange={(e) => setCatForm({ ...catForm, validUntil: e.target.value })} className="theme-input w-full py-2 px-3 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Cabang</label>
                  <select value={catForm.branchId} onChange={(e) => setCatForm({ ...catForm, branchId: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                    <option value="">Pilih Cabang</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setCatShowForm(false)} className="theme-btn-secondary px-4 py-2 text-sm">Batal</button>
                <button type="submit" disabled={catSaving} className="theme-btn-primary px-4 py-2 text-sm disabled:opacity-50">{catSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buat Katalog"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* After Sales Modal */}
      {asShowForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="theme-card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Kasus After-Sales Baru</h2>
              <button onClick={() => setAsShowForm(false)} className="theme-btn-secondary p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={submitCase} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">No. Kasus</label>
                  <input type="text" required value={asForm.caseNumber} onChange={(e) => setAsForm({ ...asForm, caseNumber: e.target.value })} className="theme-input w-full py-2 px-3 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nama Customer</label>
                  <input type="text" required value={asForm.customerName} onChange={(e) => setAsForm({ ...asForm, customerName: e.target.value })} className="theme-input w-full py-2 px-3 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tipe</label>
                  <select value={asForm.type} onChange={(e) => setAsForm({ ...asForm, type: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                    {AFTER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Prioritas</label>
                  <select value={asForm.priority} onChange={(e) => setAsForm({ ...asForm, priority: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                    {AFTER_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">SLA Due (deadline)</label>
                <input type="date" required value={asForm.slaDueDate} onChange={(e) => setAsForm({ ...asForm, slaDueDate: e.target.value })} className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Deskripsi</label>
                <textarea required value={asForm.description} onChange={(e) => setAsForm({ ...asForm, description: e.target.value })} rows={3} className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Cabang</label>
                <select value={asForm.branchId} onChange={(e) => setAsForm({ ...asForm, branchId: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                  <option value="">Pilih Cabang</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setAsShowForm(false)} className="theme-btn-secondary px-4 py-2 text-sm">Batal</button>
                <button type="submit" disabled={asSaving} className="theme-btn-primary px-4 py-2 text-sm disabled:opacity-50">{asSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buat Kasus"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
