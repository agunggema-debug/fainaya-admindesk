"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, Trash2, Pencil, X, Loader2, Search, Download, Eye } from "lucide-react";
import type { BranchOption } from "@/lib/types";

const DOC_CATEGORIES = ["SOP", "SURAT_MASUK", "SURAT_KELUAR", "KONTRAK", "PERIZINAN", "MEMO", "EDARAN"];
const DOC_STATUSES = ["DRAFT", "MENUNGGU_REVIEW", "DISETUJUI", "DIARSIPKAN"];

interface DocumentRow {
  id: string;
  docNumber: string;
  title: string;
  category: string;
  status: string;
  summary: string | null;
  fileUrl: string | null;
  fileSize: number | null;
  fileType: string | null;
  branch: { id: string; name: string; code: string };
  creator: { id: string; name: string; role: string };
  approver: { id: string; name: string; role: string } | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
  MENUNGGU_REVIEW: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
  DISETUJUI: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400",
  DIARSIPKAN: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function DocumentsPageClient() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DocumentRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewDoc, setViewDoc] = useState<DocumentRow | null>(null);

  const [form, setForm] = useState({ title: "", category: "SOP", summary: "", targetBranchId: "" });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory !== "ALL") params.set("category", filterCategory);
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      if (search) params.set("search", search);
      const res = await fetch(`/api/documents?${params}`);
      if (!res.ok) throw new Error("Gagal memuat dokumen");
      const data = await res.json();
      setDocuments(data.documents);
      setBranches(data.branches);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterStatus, search]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterCategory !== "ALL") params.set("category", filterCategory);
        if (filterStatus !== "ALL") params.set("status", filterStatus);
        if (search) params.set("search", search);
        const res = await fetch(`/api/documents?${params}`);
        if (!res.ok) throw new Error("Gagal memuat dokumen");
        const data = await res.json();
        if (!cancelled) {
          setDocuments(data.documents);
          setBranches(data.branches);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [filterCategory, filterStatus, search]);

  function openCreate() {
    setEditing(null);
    setForm({ title: "", category: "SOP", summary: "", targetBranchId: branches[0]?.id || "" });
    setUploadFile(null);
    setShowForm(true);
  }

  function openEdit(doc: DocumentRow) {
    setEditing(doc);
    setForm({ title: doc.title, category: doc.category, summary: doc.summary || "", targetBranchId: doc.branch.id });
    setUploadFile(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let fileUrl = "";
      let fileSize = 0;
      let fileType = "";

      if (uploadFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", uploadFile);
        const upRes = await fetch("/api/upload", { method: "POST", body: formData });
        const upData = await upRes.json();
        if (!upRes.ok || !upData.success) throw new Error(upData.error || "Gagal mengunggah berkas");
        fileUrl = upData.url;
        fileSize = upData.fileSize || 0;
        fileType = upData.fileType || "";
        setUploadFile(null);
      }

      if (editing) {
        const res = await fetch(`/api/documents/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: form.title, summary: form.summary, ...(fileUrl ? { fileUrl, fileSize, fileType } : {}) }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Gagal memperbarui dokumen");
      } else {
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, ...(fileUrl ? { fileUrl, fileSize, fileType } : {}) }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Gagal membuat dokumen");
      }
      setShowForm(false);
      fetchData();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  async function updateStatus(doc: DocumentRow, status: string) {
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal mengubah status");
      fetchData();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  }

  async function deleteDoc(doc: DocumentRow) {
    if (!confirm(`Hapus dokumen "${doc.docNumber}"?`)) return;
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal menghapus dokumen");
      fetchData();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">Manajemen Dokumen & Arsip</h1>
          <p className="text-sm text-secondary">Kelola dokumen resmi, SOP, kontrak, dan arsip digital cabang.</p>
        </div>
        <button onClick={openCreate} className="theme-btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Tambah Dokumen
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm font-medium" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#dc2626", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          {error}
        </div>
      )}

      <div className="theme-card p-4 flex flex-wrap gap-2 items-center">
        <label className="text-xs font-medium text-muted">Kategori:</label>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="theme-input text-xs py-1.5 px-2">
          <option value="ALL">Semua</option>
          {DOC_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <label className="text-xs font-medium text-muted ml-2">Status:</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="theme-input text-xs py-1.5 px-2">
          <option value="ALL">Semua</option>
          {DOC_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="relative flex-1 min-w-[200px] ml-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor surat, judul, ringkasan..."
            className="theme-input w-full pl-9 pr-3 py-1.5 text-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : documents.length === 0 ? (
        <div className="theme-card p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-muted" />
          <p className="text-sm text-muted">Belum ada dokumen ditemukan.</p>
        </div>
      ) : (
        <div className="theme-card p-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
                <th className="px-3 py-2 font-semibold">No. Surat</th>
                <th className="px-3 py-2 font-semibold">Judul</th>
                <th className="px-3 py-2 font-semibold">Kategori</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Cabang</th>
                <th className="px-3 py-2 font-semibold">Dibuat Oleh</th>
                <th className="px-3 py-2 font-semibold text-right">Tanggal</th>
                <th className="px-3 py-2 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b last:border-0" style={{ borderColor: "var(--border-color)" }}>
                  <td className="px-3 py-2 font-mono text-xs font-medium">{doc.docNumber}</td>
                  <td className="px-3 py-2 font-medium truncate max-w-xs">{doc.title}</td>
                  <td className="px-3 py-2 text-xs text-muted">{doc.category}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${STATUS_COLORS[doc.status]}`}>{doc.status}</span>
                  </td>
                  <td className="px-3 py-2 text-xs">{doc.branch.name}</td>
                  <td className="px-3 py-2 text-xs">{doc.creator.name}</td>
                  <td className="px-3 py-2 text-xs text-right text-muted">{formatDate(doc.createdAt)}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewDoc(doc)} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-muted" title="Lihat"><Eye className="w-3.5 h-3.5" /></button>
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-muted" title="Unduh"><Download className="w-3.5 h-3.5" /></a>
                      )}
                      <button onClick={() => openEdit(doc)} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-muted" title="Ubah"><Pencil className="w-3.5 h-3.5" /></button>
                      <select
                        value={doc.status}
                        onChange={(e) => updateStatus(doc, e.target.value)}
                        className="text-[10px] theme-input py-1 px-1"
                        title="Ubah Status"
                      >
                        {DOC_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button onClick={() => deleteDoc(doc)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="theme-card p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editing ? "Ubah Dokumen" : "Dokumen Baru"}</h2>
              <button onClick={() => setShowForm(false)} className="theme-btn-secondary p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Judul Dokumen</label>
                <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Kategori</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="theme-input w-full py-2 px-3 text-sm" disabled={!!editing}>
                  {DOC_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Ringkasan</label>
                <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={3} className="theme-input w-full py-2 px-3 text-sm" />
              </div>
              {!editing && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Cabang</label>
                  <select value={form.targetBranchId} onChange={(e) => setForm({ ...form, targetBranchId: e.target.value })} className="theme-input w-full py-2 px-3 text-sm">
                    <option value="">Pilih Cabang</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5">Berkas Dokumen (PDF/gambar)</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="theme-input w-full py-2 px-3 text-sm"
                />
                {uploadFile && (
                  <p className="text-[10px] text-muted mt-1">
                    {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="theme-btn-secondary px-4 py-2 text-sm">Batal</button>
                <button type="submit" disabled={saving || uploading} className="theme-btn-primary px-4 py-2 text-sm disabled:opacity-50 flex items-center gap-1.5">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? "Menyimpan..." : uploading ? "Mengunggah..." : editing ? "Simpan" : "Buat Dokumen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setViewDoc(null)}>
          <div className="theme-card p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Detail Dokumen</h2>
              <button onClick={() => setViewDoc(null)} className="theme-btn-secondary p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted text-xs">Nomor Surat</span>
                <p className="font-mono font-medium">{viewDoc.docNumber}</p>
              </div>
              <div>
                <span className="text-muted text-xs">Judul</span>
                <p className="font-medium">{viewDoc.title}</p>
              </div>
              <div>
                <span className="text-muted text-xs">Ringkasan</span>
                <p className="text-secondary">{viewDoc.summary || "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted text-xs">Kategori</span>
                  <p className="font-medium">{viewDoc.category}</p>
                </div>
                <div>
                  <span className="text-muted text-xs">Status</span>
                  <p className="font-medium">{viewDoc.status}</p>
                </div>
                <div>
                  <span className="text-muted text-xs">Cabang</span>
                  <p className="font-medium">{viewDoc.branch.name}</p>
                </div>
                <div>
                  <span className="text-muted text-xs">Dibuat Oleh</span>
                  <p className="font-medium">{viewDoc.creator.name}</p>
                </div>
              </div>
              {viewDoc.fileUrl && (
                <a href={viewDoc.fileUrl} target="_blank" rel="noopener noreferrer" className="theme-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" /> Unduh Berkas
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}