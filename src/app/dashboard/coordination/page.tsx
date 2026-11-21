"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Ticket, Calendar, Megaphone, Plus, Trash2, X, Loader2 } from "lucide-react";
import type { BranchOption, UserOption } from "@/lib/types";

const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const TARGET_DEPARTMENTS = ["GUDANG", "FINANCE", "HR", "IT", "UMUM", "SALES"];
const BULLETIN_CATEGORIES = ["POLICY", "HOLIDAY", "MEMO_DIREKSI", "ANNOUNCEMENT"];
const BULLETIN_PRIORITIES = ["NORMAL", "IMPORTANT", "CRITICAL"];
const BULLETIN_AUDIENCES = ["ALL", "CABANG_ONLY", "HQ_ONLY"];

interface TicketRow {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  targetDepartment: string;
  branch: { id: string; name: string; code: string };
  creator: { id: string; name: string; role: string };
  assignee: { id: string; name: string; role: string } | null;
  dueDate: string | null;
  createdAt: string;
}

interface MinuteRow {
  id: string;
  title: string;
  meetingDate: string;
  location: string;
  attendees: string;
  agenda: string;
  notes: string;
  actionItems: string;
  branch: { id: string; name: string; code: string } | null;
  creator: { id: string; name: string; role: string };
  createdAt: string;
}

interface BulletinRow {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  targetAudience: string;
  author: { id: string; name: string; role: string };
  createdAt: string;
}

type Tab = "tickets" | "minutes" | "bulletins";

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
  MEDIUM: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
  HIGH: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
  URGENT: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400",
  NORMAL: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
  IMPORTANT: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
  CRITICAL: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
  IN_PROGRESS: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
  RESOLVED: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400",
  CLOSED: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function CoordinationPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("tickets");
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [error, setError] = useState("");

  // Tickets
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [tLoading, setTLoading] = useState(true);
  const [tForm, setTForm] = useState({ title: "", description: "", priority: "MEDIUM", targetDepartment: "UMUM", dueDate: "", assigneeId: "", targetBranchId: "" });
  const [tShowForm, setTShowForm] = useState(false);
  const [tSaving, setTSaving] = useState(false);

  // Minutes
  const [minutes, setMinutes] = useState<MinuteRow[]>([]);
  const [mLoading, setMLoading] = useState(true);
  const [mForm, setMForm] = useState({ title: "", meetingDate: "", location: "Ruang Rapat", attendees: "", agenda: "", notes: "", actionItems: "", targetBranchId: "" });
  const [mShowForm, setMShowForm] = useState(false);
  const [mSaving, setMSaving] = useState(false);

  // Bulletins
  const [bulletins, setBulletins] = useState<BulletinRow[]>([]);
  const [bLoading, setBLoading] = useState(true);
  const [bForm, setBForm] = useState({ title: "", content: "", category: "ANNOUNCEMENT", priority: "NORMAL", targetAudience: "ALL" });
  const [bShowForm, setBShowForm] = useState(false);
  const [bSaving, setBSaving] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/coordination/tickets");
      if (!res.ok) throw new Error("Gagal memuat tiket");
      const data = await res.json();
      setTickets(data.tickets);
      setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
    finally { setTLoading(false); }
  }, []);

  const fetchMinutes = useCallback(async () => {
    try {
      const res = await fetch("/api/coordination/minutes");
      if (!res.ok) throw new Error("Gagal memuat notulensi");
      const data = await res.json();
      setMinutes(data.minutes);
      setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
    finally { setMLoading(false); }
  }, []);

  const fetchBulletins = useCallback(async () => {
    try {
      const res = await fetch("/api/coordination/bulletins");
      if (!res.ok) throw new Error("Gagal memuat pengumuman");
      const data = await res.json();
      setBulletins(data.bulletins);
      setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
    finally { setBLoading(false); }
  }, []);

  useEffect(() => {
    fetch("/api/documents").then((r) => r.json()).then((d) => setBranches(d.branches || [])).catch(() => {});
    fetch("/api/admin/audit?limit=1").then((r) => r.json()).then((d) => setUsers(d.users || [])).catch(() => {});
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTickets();
    fetchMinutes();
    fetchBulletins();
  }, [fetchTickets, fetchMinutes, fetchBulletins]);

  // === Tickets ===
  function openTicketCreate() {
    setTForm({ title: "", description: "", priority: "MEDIUM", targetDepartment: "UMUM", dueDate: "", assigneeId: "", targetBranchId: branches[0]?.id || "" });
    setTShowForm(true);
  }
  async function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    setTSaving(true);
    try {
      const res = await fetch("/api/coordination/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tForm),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal membuat tiket");
      setTShowForm(false);
      fetchTickets();
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
    finally { setTSaving(false); }
  }
  async function updateTicketStatus(t: TicketRow, status: string) {
    try {
      const res = await fetch(`/api/coordination/tickets/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal mengubah status");
      fetchTickets();
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
  }
  async function assignTicket(t: TicketRow, assigneeId: string) {
    try {
      const res = await fetch(`/api/coordination/tickets/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: assigneeId || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal assign tiket");
      fetchTickets();
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
  }
  async function deleteTicket(t: TicketRow) {
    if (!confirm(`Hapus tiket ${t.ticketNumber}?`)) return;
    try {
      const res = await fetch(`/api/coordination/tickets/${t.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal menghapus");
      fetchTickets();
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
  }

  // === Minutes ===
  function openMinuteCreate() {
    setMForm({ title: "", meetingDate: new Date().toISOString().split("T")[0], location: "Ruang Rapat", attendees: "", agenda: "", notes: "", actionItems: "", targetBranchId: branches[0]?.id || "" });
    setMShowForm(true);
  }
  async function submitMinute(e: React.FormEvent) {
    e.preventDefault();
    setMSaving(true);
    try {
      const res = await fetch("/api/coordination/minutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mForm),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal membuat notulensi");
      setMShowForm(false);
      fetchMinutes();
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
    finally { setMSaving(false); }
  }
  async function deleteMinute(m: MinuteRow) {
    if (!confirm(`Hapus notulensi "${m.title}"?`)) return;
    try {
      const res = await fetch(`/api/coordination/minutes/${m.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal menghapus");
      fetchMinutes();
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
  }

  // === Bulletins ===
  function openBulletinCreate() {
    setBForm({ title: "", content: "", category: "ANNOUNCEMENT", priority: "NORMAL", targetAudience: "ALL" });
    setBShowForm(true);
  }
  async function submitBulletin(e: React.FormEvent) {
    e.preventDefault();
    setBSaving(true);
    try {
      const res = await fetch("/api/coordination/bulletins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bForm),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal membuat pengumuman");
      setBShowForm(false);
      fetchBulletins();
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
    finally { setBSaving(false); }
  }
  async function updateBulletin(b: BulletinRow, data: Record<string, string>) {
    try {
      const res = await fetch(`/api/coordination/bulletins/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal mengubah pengumuman");
      fetchBulletins();
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
  }
  async function deleteBulletin(b: BulletinRow) {
    if (!confirm(`Hapus pengumuman "${b.title}"?`)) return;
    try {
      const res = await fetch(`/api/coordination/bulletins/${b.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal menghapus");
      fetchBulletins();
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan"); }
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType; onClick: () => void }[] = [
    { id: "tickets", label: "Tiket Koordinasi", icon: Ticket, onClick: openTicketCreate },
    { id: "minutes", label: "Notulensi", icon: Calendar, onClick: openMinuteCreate },
    { id: "bulletins", label: "Pengumuman", icon: Megaphone, onClick: openBulletinCreate },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">Koordinasi Antar Departemen</h1>
          <p className="text-sm text-secondary">Tiket koordinasi, rapat & notulensi, papan pengumuman internal.</p>
        </div>
        <button onClick={TABS.find((t) => t.id === tab)?.onClick} className="theme-btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Buat Baru
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      <div className="flex gap-2 border-b" style={{ borderColor: "var(--border-color)" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${tab === t.id ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-muted hover:text-primary"}`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tickets Tab */}
      {tab === "tickets" && (
        <div className="theme-card overflow-x-auto">
          {tLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12"><Ticket className="w-10 h-10 mx-auto mb-2 text-muted" /><p className="text-sm text-muted">Belum ada tiket.</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
                  <th className="text-left px-4 py-3 font-semibold">Nomor</th>
                  <th className="text-left px-4 py-3 font-semibold">Judul</th>
                  <th className="text-left px-4 py-3 font-semibold">Prioritas</th>
                  <th className="text-left px-4 py-3 font-semibold">Tujuan</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Assignee</th>
                  <th className="text-right px-4 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b last:border-0" style={{ borderColor: "var(--border-color)" }}>
                    <td className="px-4 py-3 font-mono text-xs">{t.ticketNumber}</td>
                    <td className="px-4 py-3 font-medium max-w-[180px] truncate" title={t.title}>{t.title}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] font-mono px-2 py-0.5 rounded ${PRIORITY_COLORS[t.priority] || ""}`}>{t.priority}</span></td>
                    <td className="px-4 py-3 text-xs">{t.targetDepartment}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] font-mono px-2 py-0.5 rounded ${STATUS_COLORS[t.status] || ""}`}>{t.status}</span></td>
                    <td className="px-4 py-3">
                      <select value={t.assignee?.id || ""} onChange={(e) => assignTicket(t, e.target.value)} className="text-[10px] theme-input py-1 px-2">
                        <option value="">—</option>
                        {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <select value={t.status} onChange={(e) => updateTicketStatus(t, e.target.value)} className="text-[10px] theme-input py-1 px-2 mr-1">
                          {TICKET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={() => deleteTicket(t)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Minutes Tab */}
      {tab === "minutes" && (
        <div className="theme-card overflow-x-auto">
          {mLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : minutes.length === 0 ? (
            <div className="text-center py-12"><Calendar className="w-10 h-10 mx-auto mb-2 text-muted" /><p className="text-sm text-muted">Belum ada notulensi.</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
                  <th className="text-left px-4 py-3 font-semibold">Judul</th>
                  <th className="text-left px-4 py-3 font-semibold">Tanggal</th>
                  <th className="text-left px-4 py-3 font-semibold">Lokasi</th>
                  <th className="text-left px-4 py-3 font-semibold">Pembuat</th>
                  <th className="text-right px-4 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {minutes.map((m) => (
                  <tr key={m.id} className="border-b last:border-0" style={{ borderColor: "var(--border-color)" }}>
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate" title={m.title}>{m.title}</td>
                    <td className="px-4 py-3 text-xs">{formatDate(m.meetingDate)}</td>
                    <td className="px-4 py-3 text-xs">{m.location}</td>
                    <td className="px-4 py-3 text-xs">{m.creator.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => deleteMinute(m)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Bulletins Tab */}
      {tab === "bulletins" && (
        <div className="theme-card overflow-x-auto">
          {bLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : bulletins.length === 0 ? (
            <div className="text-center py-12"><Megaphone className="w-10 h-10 mx-auto mb-2 text-muted" /><p className="text-sm text-muted">Belum ada pengumuman.</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
                  <th className="text-left px-4 py-3 font-semibold">Judul</th>
                  <th className="text-left px-4 py-3 font-semibold">Kategori</th>
                  <th className="text-left px-4 py-3 font-semibold">Prioritas</th>
                  <th className="text-left px-4 py-3 font-semibold">Penulis</th>
                  <th className="text-left px-4 py-3 font-semibold">Tanggal</th>
                  <th className="text-right px-4 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {bulletins.map((b) => (
                  <tr key={b.id} className="border-b last:border-0" style={{ borderColor: "var(--border-color)" }}>
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate" title={b.title}>{b.title}</td>
                    <td className="px-4 py-3 text-xs">{b.category}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${PRIORITY_COLORS[b.priority] || ""}`}>{b.priority}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">{b.author.name}</td>
                    <td className="px-4 py-3 text-xs text-muted">{formatDate(b.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <select value={b.priority} onChange={(e) => updateBulletin(b, { priority: e.target.value })} className="text-[10px] theme-input py-1 px-2 mr-1">
                          {BULLETIN_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <button onClick={() => deleteBulletin(b)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Ticket Modal */}
      {tShowForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="theme-card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Tiket Koordinasi Baru</h2>
              <button onClick={() => setTShowForm(false)} className="theme-btn-secondary p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={submitTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Judul</label>
                <input type="text" required value={tForm.title} onChange={(e) => setTForm({ ...tForm, title: e.target.value })} className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Deskripsi</label>
                <textarea required value={tForm.description} onChange={(e) => setTForm({ ...tForm, description: e.target.value })} rows={3} className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Prioritas</label>
                  <select value={tForm.priority} onChange={(e) => setTForm({ ...tForm, priority: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                    {TICKET_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Departemen Tujuan</label>
                  <select value={tForm.targetDepartment} onChange={(e) => setTForm({ ...tForm, targetDepartment: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                    {TARGET_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tenggat (opsional)</label>
                  <input type="date" value={tForm.dueDate} onChange={(e) => setTForm({ ...tForm, dueDate: e.target.value })} className="theme-input w-full py-2 px-3 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Assignee (opsional)</label>
                  <select value={tForm.assigneeId} onChange={(e) => setTForm({ ...tForm, assigneeId: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                    <option value="">—</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Cabang</label>
                <select value={tForm.targetBranchId} onChange={(e) => setTForm({ ...tForm, targetBranchId: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                  <option value="">Pilih Cabang</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setTShowForm(false)} className="theme-btn-secondary px-4 py-2 text-sm">Batal</button>
                <button type="submit" disabled={tSaving} className="theme-btn-primary px-4 py-2 text-sm disabled:opacity-50">{tSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buat Tiket"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Minute Modal */}
      {mShowForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="theme-card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Notulensi Rapat Baru</h2>
              <button onClick={() => setMShowForm(false)} className="theme-btn-secondary p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={submitMinute} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Judul Rapat</label>
                <input type="text" required value={mForm.title} onChange={(e) => setMForm({ ...mForm, title: e.target.value })} className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tanggal</label>
                  <input type="date" required value={mForm.meetingDate} onChange={(e) => setMForm({ ...mForm, meetingDate: e.target.value })} className="theme-input w-full py-2 px-3 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Lokasi</label>
                  <input type="text" required value={mForm.location} onChange={(e) => setMForm({ ...mForm, location: e.target.value })} className="theme-input w-full py-2 px-3 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Peserta</label>
                <textarea required value={mForm.attendees} onChange={(e) => setMForm({ ...mForm, attendees: e.target.value })} rows={2} placeholder="1. Budi (Admin)&#10;2. Sari (Finance)" className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Agenda</label>
                <textarea required value={mForm.agenda} onChange={(e) => setMForm({ ...mForm, agenda: e.target.value })} rows={2} className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Catatan / Notulen</label>
                <textarea required value={mForm.notes} onChange={(e) => setMForm({ ...mForm, notes: e.target.value })} rows={3} className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Action Items (JSON atau teks)</label>
                <textarea value={mForm.actionItems} onChange={(e) => setMForm({ ...mForm, actionItems: e.target.value })} rows={2} placeholder="['Task A - PIC Budi', 'Task B - PIC Sari']" className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Cabang</label>
                <select value={mForm.targetBranchId} onChange={(e) => setMForm({ ...mForm, targetBranchId: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                  <option value="">Pilih Cabang</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                  <option value="HQ">Kantor Pusat (HQ)</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setMShowForm(false)} className="theme-btn-secondary px-4 py-2 text-sm">Batal</button>
                <button type="submit" disabled={mSaving} className="theme-btn-primary px-4 py-2 text-sm disabled:opacity-50">{mSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Notulensi"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulletin Modal */}
      {bShowForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="theme-card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Pengumuman Baru</h2>
              <button onClick={() => setBShowForm(false)} className="theme-btn-secondary p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={submitBulletin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Judul</label>
                <input type="text" required value={bForm.title} onChange={(e) => setBForm({ ...bForm, title: e.target.value })} className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Isi Pengumuman</label>
                <textarea required value={bForm.content} onChange={(e) => setBForm({ ...bForm, content: e.target.value })} rows={4} className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Kategori</label>
                  <select value={bForm.category} onChange={(e) => setBForm({ ...bForm, category: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                    {BULLETIN_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Prioritas</label>
                  <select value={bForm.priority} onChange={(e) => setBForm({ ...bForm, priority: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                    {BULLETIN_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Target Audiens</label>
                <select value={bForm.targetAudience} onChange={(e) => setBForm({ ...bForm, targetAudience: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                  {BULLETIN_AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setBShowForm(false)} className="theme-btn-secondary px-4 py-2 text-sm">Batal</button>
                <button type="submit" disabled={bSaving} className="theme-btn-primary px-4 py-2 text-sm disabled:opacity-50">{bSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publikasikan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}