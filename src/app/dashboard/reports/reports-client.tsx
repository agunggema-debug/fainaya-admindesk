"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Plus, Trash2, X, Loader2, Download } from "lucide-react";
import type { BranchOption } from "@/lib/types";

const PERIOD_TYPES = ["DAILY", "WEEKLY", "MONTHLY"];
const REPORT_STATUSES = ["SUBMITTED", "REVIEWED", "APPROVED", "REJECTED"];

interface ReportRow {
  id: string;
  title: string;
  periodType: string;
  periodDate: string;
  activitySummary: string;
  notes: string | null;
  status: string;
  complianceStatus: string;
  branch: { id: string; name: string; code: string };
  creator: { id: string; name: string; role: string };
  reviewedBy: { id: string; name: string; role: string } | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
  REVIEWED: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
  APPROVED: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400",
  REJECTED: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400",
};

const COMPLIANCE_COLORS: Record<string, string> = {
  ON_TIME: "text-green-600 dark:text-green-400",
  LATE: "text-amber-600 dark:text-amber-400",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function ReportsPageClient() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ title: "", periodType: "DAILY", periodDate: "", activitySummary: "", notes: "", targetBranchId: "" });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterPeriod !== "ALL") params.set("periodType", filterPeriod);
    if (filterStatus !== "ALL") params.set("status", filterStatus);
    fetch(`/api/reports?${params}`)
      .then((res) => { if (!res.ok) throw new Error("Gagal memuat laporan"); return res.json(); })
      .then((data) => { setReports(data.reports); setError(""); })
      .catch((err) => setError(err instanceof Error ? err.message : "Terjadi kesalahan"))
      .finally(() => setLoading(false));
  }, [filterPeriod, filterStatus]);

  useEffect(() => {
    fetch("/api/documents").then((r) => r.json()).then((d) => setBranches(d.branches || [])).catch(() => {});
  }, []);

  function openCreate() {
    setForm({ title: "", periodType: "DAILY", periodDate: new Date().toISOString().split("T")[0], activitySummary: "", notes: "", targetBranchId: branches[0]?.id || "" });
    setShowForm(true);
  }

  async function handleExport() {
    try {
      const params = new URLSearchParams();
      if (filterPeriod !== "ALL") params.set("periodType", filterPeriod);
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      const response = await fetch(`/api/reports/export?${params.toString()}`);
      if (!response.ok) throw new Error("Gagal mengekspor laporan");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-operasional-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat ekspor");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal membuat laporan");
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(report: ReportRow, status: string) {
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
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

  async function handleDelete(report: ReportRow) {
    if (!confirm(`Hapus laporan "${report.title}"?`)) return;
    try {
      const res = await fetch(`/api/reports/${report.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal menghapus laporan");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">Laporan Operasional</h1>
          <p className="text-sm text-secondary">Penyusunan laporan harian, mingguan, dan bulanan operasional cabang.</p>
        </div>
        <button onClick={openCreate} className="theme-btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Laporan Baru
        </button>
        <button onClick={handleExport} className="theme-btn-outline px-4 py-2 text-sm flex items-center gap-1.5" style={{ marginLeft: "12px" }}>
          <Download className="w-4 h-4" />
          Ekspor CSV
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      <div className="theme-card p-4">
        <div className="flex flex-wrap gap-2">
          <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className="theme-input py-2 px-3 text-sm">
            <option value="ALL">Semua Periode</option>
            {PERIOD_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="theme-input py-2 px-3 text-sm">
            <option value="ALL">Semua Status</option>
            {REPORT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="theme-card overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-10 h-10 mx-auto mb-2 text-muted" />
            <p className="text-sm text-muted">Belum ada laporan.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
                <th className="text-left px-4 py-3 font-semibold">Judul</th>
                <th className="text-left px-4 py-3 font-semibold">Periode</th>
                <th className="text-left px-4 py-3 font-semibold">Cabang</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Kepatuhan</th>
                <th className="text-left px-4 py-3 font-semibold">Tanggal</th>
                <th className="text-right px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b last:border-0" style={{ borderColor: "var(--border-color)" }}>
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate" title={report.title}>{report.title}</td>
                  <td className="px-4 py-3 text-xs">{report.periodType}</td>
                  <td className="px-4 py-3 text-xs">{report.branch.code}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${STATUS_COLORS[report.status] || ""}`}>{report.status}</span>
                  </td>
                  <td className={`px-4 py-3 text-xs ${COMPLIANCE_COLORS[report.complianceStatus] || ""}`}>{report.complianceStatus}</td>
                  <td className="px-4 py-3 text-xs text-muted">{formatDate(report.periodDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <select
                        value={report.status}
                        onChange={(e) => updateStatus(report, e.target.value)}
                        className="text-[10px] theme-input py-1 px-2 mr-1"
                      >
                        {REPORT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => handleDelete(report)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500" title="Hapus">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="theme-card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Laporan Baru</h2>
              <button onClick={() => setShowForm(false)} className="theme-btn-secondary p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Judul Laporan</label>
                <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Jenis Periode</label>
                  <select value={form.periodType} onChange={(e) => setForm({ ...form, periodType: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                    {PERIOD_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tanggal Periode</label>
                  <input type="date" required value={form.periodDate} onChange={(e) => setForm({ ...form, periodDate: e.target.value })} className="theme-input w-full py-2 px-3 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Ringkasan Aktivitas</label>
                <textarea required value={form.activitySummary} onChange={(e) => setForm({ ...form, activitySummary: e.target.value })} rows={3} className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Catatan (opsional)</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Cabang</label>
                <select value={form.targetBranchId} onChange={(e) => setForm({ ...form, targetBranchId: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                  <option value="">Pilih Cabang</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="theme-btn-secondary px-4 py-2 text-sm">Batal</button>
                <button type="submit" disabled={saving} className="theme-btn-primary px-4 py-2 text-sm disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buat Laporan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}