"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Wallet, FileText, Plus, Trash2, X, Loader2, Pencil } from "lucide-react";
import type { BranchOption } from "@/lib/types";

const ATK_CATEGORIES = ["ATK", "PANTRY", "FORMULIR", "LAINNYA"];
const SUPPLY_STATUSES = ["PENDING", "APPROVED_BRANCH", "APPROVED_HQ", "REJECTED", "COMPLETED"];
const PETTY_TYPES = ["INCOME", "EXPENSE"];
const PETTY_CATEGORIES = ["OPERATIONAL", "CONSUMPTION", "TRANSPORT", "SUPPLIES", "UTILITY", "REIMBURSEMENT"];
const PETTY_STATUSES = ["PENDING", "VERIFIED", "REIMBURSED"];

interface OfficeItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  unitPrice: number;
  branch: { id: string; name: string; code: string };
}

interface SupplyRequest {
  id: string;
  requestNumber: string;
  items: string;
  totalEstimatedCost: number;
  status: string;
  reason: string;
  branch: { id: string; name: string; code: string };
  requester: { id: string; name: string; role: string };
  approvedBy: { id: string; name: string; role: string } | null;
  createdAt: string;
}

interface PettyCash {
  id: string;
  code: string;
  type: string;
  amount: number;
  category: string;
  description: string;
  status: string;
  branch: { id: string; name: string; code: string };
  recordedBy: { id: string; name: string; role: string };
  date: string;
}

type Tab = "atk" | "supplies" | "petty-cash";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
  APPROVED_BRANCH: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
  APPROVED_HQ: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400",
  REJECTED: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400",
  COMPLETED: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
  VERIFIED: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400",
  REIMBURSED: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export function OfficePageClient() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("atk");
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [error, setError] = useState("");

  // ATK
  const [items, setItems] = useState<OfficeItem[]>([]);
  const [atkLoading, setAtkLoading] = useState(true);
  const [atkForm, setAtkForm] = useState({ name: "", category: "ATK", unit: "Pcs", stock: 0, minStock: 5, unitPrice: 0, targetBranchId: "" });
  const [atkEditing, setAtkEditing] = useState<OfficeItem | null>(null);
  const [atkShowForm, setAtkShowForm] = useState(false);
  const [atkSaving, setAtkSaving] = useState(false);

  // Supplies
  const [supplies, setSupplies] = useState<SupplyRequest[]>([]);
  const [supLoading, setSupLoading] = useState(true);
  const [supForm, setSupForm] = useState({ items: "", reason: "", totalEstimatedCost: 0, targetBranchId: "" });
  const [supShowForm, setSupShowForm] = useState(false);
  const [supSaving, setSupSaving] = useState(false);

  // Petty Cash
  const [pettyCash, setPettyCash] = useState<PettyCash[]>([]);
  const [pettySummary, setPettySummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [pettyLoading, setPettyLoading] = useState(true);
  const [pettyForm, setPettyForm] = useState({ type: "EXPENSE", amount: 0, category: "OPERATIONAL", description: "", targetBranchId: "" });
  const [pettyShowForm, setPettyShowForm] = useState(false);
  const [pettySaving, setPettySaving] = useState(false);

  useEffect(() => {
    fetch("/api/documents").then((r) => r.json()).then((d) => setBranches(d.branches || [])).catch(() => {});
    fetch("/api/office/items").then((r) => r.json()).then((d) => setItems(d.items || [])).catch(() => {}).finally(() => setAtkLoading(false));
    fetch("/api/office/supplies").then((r) => r.json()).then((d) => setSupplies(d.requests || [])).catch(() => {}).finally(() => setSupLoading(false));
    fetch("/api/office/petty-cash").then((r) => r.json()).then((d) => { setPettyCash(d.records || []); setPettySummary(d.summary || { totalIncome: 0, totalExpense: 0, balance: 0 }); }).catch(() => {}).finally(() => setPettyLoading(false));
  }, []);

  // === ATK ===
  function openATKCreate() {
    setAtkEditing(null);
    setAtkForm({ name: "", category: "ATK", unit: "Pcs", stock: 0, minStock: 5, unitPrice: 0, targetBranchId: branches[0]?.id || "" });
    setAtkShowForm(true);
  }
  function openATKEdit(item: OfficeItem) {
    setAtkEditing(item);
    setAtkForm({ name: item.name, category: item.category, unit: item.unit, stock: item.stock, minStock: item.minStock, unitPrice: item.unitPrice, targetBranchId: item.branch.id });
    setAtkShowForm(true);
  }
  async function submitATK(e: React.FormEvent) {
    e.preventDefault();
    setAtkSaving(true);
    try {
      if (atkEditing) {
        const res = await fetch(`/api/office/items/${atkEditing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stock: atkForm.stock, minStock: atkForm.minStock, unitPrice: atkForm.unitPrice }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Gagal memperbarui item");
      } else {
        const res = await fetch("/api/office/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(atkForm),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Gagal membuat item");
      }
      setAtkShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setAtkSaving(false);
    }
  }
  async function deleteATK(item: OfficeItem) {
    if (!confirm(`Hapus item "${item.name}"?`)) return;
    try {
      const res = await fetch(`/api/office/items/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal menghapus item");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  }

  // === Supplies ===
  function openSupCreate() {
    setSupForm({ items: "", reason: "", totalEstimatedCost: 0, targetBranchId: branches[0]?.id || "" });
    setSupShowForm(true);
  }
  async function submitSup(e: React.FormEvent) {
    e.preventDefault();
    setSupSaving(true);
    try {
      const res = await fetch("/api/office/supplies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supForm),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal membuat pengadaan");
      setSupShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSupSaving(false);
    }
  }
  async function updateSupStatus(req: SupplyRequest, status: string) {
    try {
      const res = await fetch(`/api/office/supplies/${req.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal mengubah status");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  }
  async function deleteSup(req: SupplyRequest) {
    if (!confirm(`Hapus pengadaan ${req.requestNumber}?`)) return;
    try {
      const res = await fetch(`/api/office/supplies/${req.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal menghapus");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  }

  // === Petty Cash ===
  function openPettyCreate() {
    setPettyForm({ type: "EXPENSE", amount: 0, category: "OPERATIONAL", description: "", targetBranchId: branches[0]?.id || "" });
    setPettyShowForm(true);
  }
  async function submitPetty(e: React.FormEvent) {
    e.preventDefault();
    setPettySaving(true);
    try {
      const res = await fetch("/api/office/petty-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pettyForm),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal mencatat kas kecil");
      setPettyShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setPettySaving(false);
    }
  }
  async function updatePettyStatus(rec: PettyCash, status: string) {
    try {
      const res = await fetch(`/api/office/petty-cash/${rec.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal mengubah status");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  }
  async function deletePetty(rec: PettyCash) {
    if (!confirm(`Hapus catatan ${rec.code}?`)) return;
    try {
      const res = await fetch(`/api/office/petty-cash/${rec.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal menghapus");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "atk", label: "Inventaris ATK", icon: Package },
    { id: "supplies", label: "Pengadaan", icon: FileText },
    { id: "petty-cash", label: "Kas Kecil", icon: Wallet },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">Operasional Kantor</h1>
          <p className="text-sm text-secondary">Inventaris ATK, pengadaan, aset, dan pengelolaan kas kecil.</p>
        </div>
        {tab === "atk" && <button onClick={openATKCreate} className="theme-btn-primary px-4 py-2 text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" />Item ATK Baru</button>}
        {tab === "supplies" && <button onClick={openSupCreate} className="theme-btn-primary px-4 py-2 text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" />Pengajuan Baru</button>}
        {tab === "petty-cash" && <button onClick={openPettyCreate} className="theme-btn-primary px-4 py-2 text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" />Catatan Baru</button>}
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      <div className="flex gap-2 border-b" style={{ borderColor: "var(--border-color)" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              tab === t.id ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-muted hover:text-primary"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ATK Tab */}
      {tab === "atk" && (
        <div className="theme-card overflow-x-auto">
          {atkLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-12"><Package className="w-10 h-10 mx-auto mb-2 text-muted" /><p className="text-sm text-muted">Belum ada item ATK.</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
                  <th className="text-left px-4 py-3 font-semibold">Nama</th>
                  <th className="text-left px-4 py-3 font-semibold">Kategori</th>
                  <th className="text-left px-4 py-3 font-semibold">Stok</th>
                  <th className="text-left px-4 py-3 font-semibold">Min</th>
                  <th className="text-left px-4 py-3 font-semibold">Harga</th>
                  <th className="text-left px-4 py-3 font-semibold">Cabang</th>
                  <th className="text-right px-4 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0" style={{ borderColor: "var(--border-color)" }}>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-xs">{item.category}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono font-bold ${item.stock <= item.minStock ? "text-amber-600 dark:text-amber-400" : ""}`}>{item.stock}</span>
                      <span className="text-[10px] text-muted ml-1">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">{item.minStock}</td>
                    <td className="px-4 py-3 text-xs">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-xs">{item.branch.code}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openATKEdit(item)} className="theme-btn-secondary p-1.5" title="Sesuaikan Stok"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteATK(item)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Supplies Tab */}
      {tab === "supplies" && (
        <div className="theme-card overflow-x-auto">
          {supLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : supplies.length === 0 ? (
            <div className="text-center py-12"><FileText className="w-10 h-10 mx-auto mb-2 text-muted" /><p className="text-sm text-muted">Belum ada pengajuan pengadaan.</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
                  <th className="text-left px-4 py-3 font-semibold">Nomor</th>
                  <th className="text-left px-4 py-3 font-semibold">Barang</th>
                  <th className="text-left px-4 py-3 font-semibold">Estimasi</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Pemohon</th>
                  <th className="text-left px-4 py-3 font-semibold">Cabang</th>
                  <th className="text-right px-4 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {supplies.map((req) => (
                  <tr key={req.id} className="border-b last:border-0" style={{ borderColor: "var(--border-color)" }}>
                    <td className="px-4 py-3 font-mono text-xs">{req.requestNumber}</td>
                    <td className="px-4 py-3 text-xs max-w-[150px] truncate" title={req.items}>{req.items}</td>
                    <td className="px-4 py-3 text-xs">{formatCurrency(req.totalEstimatedCost)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${STATUS_COLORS[req.status] || ""}`}>{req.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">{req.requester.name}</td>
                    <td className="px-4 py-3 text-xs">{req.branch.code}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <select value={req.status} onChange={(e) => updateSupStatus(req, e.target.value)} className="text-[10px] theme-input py-1 px-2 mr-1">
                          {SUPPLY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={() => deleteSup(req)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Petty Cash Tab */}
      {tab === "petty-cash" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="theme-card p-3 text-center">
              <p className="text-[10px] text-muted">Pemasukan</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(pettySummary.totalIncome)}</p>
            </div>
            <div className="theme-card p-3 text-center">
              <p className="text-[10px] text-muted">Pengeluaran</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(pettySummary.totalExpense)}</p>
            </div>
            <div className="theme-card p-3 text-center">
              <p className="text-[10px] text-muted">Saldo</p>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(pettySummary.balance)}</p>
            </div>
          </div>
          <div className="theme-card overflow-x-auto">
            {pettyLoading ? (
              <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
            ) : pettyCash.length === 0 ? (
              <div className="text-center py-12"><Wallet className="w-10 h-10 mx-auto mb-2 text-muted" /><p className="text-sm text-muted">Belum ada catatan kas kecil.</p></div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
                    <th className="text-left px-4 py-3 font-semibold">Kode</th>
                    <th className="text-left px-4 py-3 font-semibold">Tipe</th>
                    <th className="text-left px-4 py-3 font-semibold">Jumlah</th>
                    <th className="text-left px-4 py-3 font-semibold">Keterangan</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Cabang</th>
                    <th className="text-right px-4 py-3 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pettyCash.map((rec) => (
                    <tr key={rec.id} className="border-b last:border-0" style={{ borderColor: "var(--border-color)" }}>
                      <td className="px-4 py-3 font-mono text-xs">{rec.code}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${rec.type === "INCOME" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"}`}>{rec.type}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold">{formatCurrency(rec.amount)}</td>
                      <td className="px-4 py-3 text-xs max-w-[150px] truncate" title={rec.description}>{rec.description}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${STATUS_COLORS[rec.status] || ""}`}>{rec.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">{rec.branch.code}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <select value={rec.status} onChange={(e) => updatePettyStatus(rec, e.target.value)} className="text-[10px] theme-input py-1 px-2 mr-1">
                            {PETTY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button onClick={() => deletePetty(rec)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ATK Modal */}
      {atkShowForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="theme-card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{atkEditing ? "Sesuaikan Stok" : "Item ATK Baru"}</h2>
              <button onClick={() => setAtkShowForm(false)} className="theme-btn-secondary p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={submitATK} className="space-y-4">
              {atkEditing ? (
                <>
                  <p className="text-sm text-secondary">{atkEditing.name} ({atkEditing.unit})</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Stok</label>
                      <input type="number" value={atkForm.stock} onChange={(e) => setAtkForm({ ...atkForm, stock: Number(e.target.value) })} className="theme-input w-full py-2 px-3 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Min Stok</label>
                      <input type="number" value={atkForm.minStock} onChange={(e) => setAtkForm({ ...atkForm, minStock: Number(e.target.value) })} className="theme-input w-full py-2 px-3 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Harga Satuan</label>
                    <input type="number" value={atkForm.unitPrice} onChange={(e) => setAtkForm({ ...atkForm, unitPrice: Number(e.target.value) })} className="theme-input w-full py-2 px-3 text-sm" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Nama Barang</label>
                    <input type="text" required value={atkForm.name} onChange={(e) => setAtkForm({ ...atkForm, name: e.target.value })} className="theme-input w-full py-2 px-3 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Kategori</label>
                      <select value={atkForm.category} onChange={(e) => setAtkForm({ ...atkForm, category: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                        {ATK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Satuan</label>
                      <input type="text" required value={atkForm.unit} onChange={(e) => setAtkForm({ ...atkForm, unit: e.target.value })} placeholder="Pcs, Rim, Box..." className="theme-input w-full py-2 px-3 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Stok</label>
                      <input type="number" value={atkForm.stock} onChange={(e) => setAtkForm({ ...atkForm, stock: Number(e.target.value) })} className="theme-input w-full py-2 px-3 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Min Stok</label>
                      <input type="number" value={atkForm.minStock} onChange={(e) => setAtkForm({ ...atkForm, minStock: Number(e.target.value) })} className="theme-input w-full py-2 px-3 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Harga</label>
                      <input type="number" value={atkForm.unitPrice} onChange={(e) => setAtkForm({ ...atkForm, unitPrice: Number(e.target.value) })} className="theme-input w-full py-2 px-3 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Cabang</label>
                    <select value={atkForm.targetBranchId} onChange={(e) => setAtkForm({ ...atkForm, targetBranchId: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                      <option value="">Pilih Cabang</option>
                      {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                    </select>
                  </div>
                </>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setAtkShowForm(false)} className="theme-btn-secondary px-4 py-2 text-sm">Batal</button>
                <button type="submit" disabled={atkSaving} className="theme-btn-primary px-4 py-2 text-sm disabled:opacity-50">{atkSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : atkEditing ? "Simpan" : "Buat Item"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplies Modal */}
      {supShowForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="theme-card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Pengajuan Pengadaan Baru</h2>
              <button onClick={() => setSupShowForm(false)} className="theme-btn-secondary p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={submitSup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Daftar Barang</label>
                <textarea required value={supForm.items} onChange={(e) => setSupForm({ ...supForm, items: e.target.value })} rows={3} placeholder="1. Kertas A4 - 5 Rim&#10;2. Toner HP 12A - 2 pcs" className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Alasan Pengadaan</label>
                <textarea required value={supForm.reason} onChange={(e) => setSupForm({ ...supForm, reason: e.target.value })} rows={2} className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Estimasi Biaya (Rp)</label>
                  <input type="number" value={supForm.totalEstimatedCost} onChange={(e) => setSupForm({ ...supForm, totalEstimatedCost: Number(e.target.value) })} className="theme-input w-full py-2 px-3 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Cabang</label>
                  <select value={supForm.targetBranchId} onChange={(e) => setSupForm({ ...supForm, targetBranchId: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                    <option value="">Pilih Cabang</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setSupShowForm(false)} className="theme-btn-secondary px-4 py-2 text-sm">Batal</button>
                <button type="submit" disabled={supSaving} className="theme-btn-primary px-4 py-2 text-sm disabled:opacity-50">{supSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ajukan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Petty Cash Modal */}
      {pettyShowForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="theme-card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Catatan Kas Kecil Baru</h2>
              <button onClick={() => setPettyShowForm(false)} className="theme-btn-secondary p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={submitPetty} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tipe</label>
                  <select value={pettyForm.type} onChange={(e) => setPettyForm({ ...pettyForm, type: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                    {PETTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Jumlah (Rp)</label>
                  <input type="number" required value={pettyForm.amount} onChange={(e) => setPettyForm({ ...pettyForm, amount: Number(e.target.value) })} className="theme-input w-full py-2 px-3 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Kategori</label>
                <select value={pettyForm.category} onChange={(e) => setPettyForm({ ...pettyForm, category: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                  {PETTY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Keterangan</label>
                <textarea required value={pettyForm.description} onChange={(e) => setPettyForm({ ...pettyForm, description: e.target.value })} rows={2} className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Cabang</label>
                <select value={pettyForm.targetBranchId} onChange={(e) => setPettyForm({ ...pettyForm, targetBranchId: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                  <option value="">Pilih Cabang</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setPettyShowForm(false)} className="theme-btn-secondary px-4 py-2 text-sm">Batal</button>
                <button type="submit" disabled={pettySaving} className="theme-btn-primary px-4 py-2 text-sm disabled:opacity-50">{pettySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Catat"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}