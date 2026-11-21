"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Shield, Users, FileCheck, Loader2, RefreshCw } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  HQ_COORDINATOR: "Koordinator Admin Pusat",
  BRANCH_ADMIN: "Staff Admin Cabang",
  SALES_SUPPORT: "Sales Support",
  CUSTOMER_SERVICE: "Customer Service",
  BRANCH_MANAGER: "Kepala Cabang",
  SYSTEM_ADMIN: "System Administrator",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  HQ_COORDINATOR: "Akses seluruh cabang, review & approval lintas departemen",
  BRANCH_ADMIN: "Lingkup per cabang — kelola dokumen, laporan, ATK, kas kecil",
  SALES_SUPPORT: "Verifikasi berkas & pricelist sales checklist",
  CUSTOMER_SERVICE: "Eskalasi tiket & garansi customer",
  BRANCH_MANAGER: "Review & approval operasional cabang",
  SYSTEM_ADMIN: "Global & keamanan sistem",
};

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; name: string; role: string } | null;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  branchId: string | null;
}

interface BranchRow {
  id: string;
  name: string;
  code: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AdminPageClient() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filterAction) params.set("action", filterAction);
      if (filterEntity) params.set("entity", filterEntity);
      const res = await fetch(`/api/admin/audit?${params}`);
      if (!res.ok) throw new Error("Gagal memuat data audit");
      const data = await res.json();
      setLogs(data.logs);
      setUsers(data.users);
      setBranches(data.branches);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [filterAction, filterEntity]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const branchMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    branches.forEach((b) => { map[b.id] = b.name; });
    return map;
  }, [branches]);

  const uniqueActions = React.useMemo(() => [...new Set(logs.map((l) => l.action))].sort(), [logs]);
  const uniqueEntities = React.useMemo(() => [...new Set(logs.map((l) => l.entity))].sort(), [logs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">Administrasi Sistem</h1>
        <p className="text-sm text-secondary">Manajemen pengguna, hak akses RBAC, dan jejak audit aktivitas.</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="theme-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold">Pengguna</h2>
          </div>
          <p className="text-2xl font-bold">{users.length}</p>
          <p className="text-[10px] text-muted">Total akun terdaftar</p>
        </div>
        <div className="theme-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-green-500" />
            <h2 className="text-sm font-bold">Peran (RBAC)</h2>
          </div>
          <p className="text-2xl font-bold">{Object.keys(ROLE_LABELS).length}</p>
          <p className="text-[10px] text-muted">Role tersedia</p>
        </div>
        <div className="theme-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold">Audit Log</h2>
          </div>
          <p className="text-2xl font-bold">{logs.length}</p>
          <p className="text-[10px] text-muted">Entri terakhir</p>
        </div>
      </div>

      {/* RBAC Roles */}
      <div className="theme-card p-4">
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-500" />
          Peran Pengguna (Role-Based Access Control)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <div key={role} className="p-2.5 rounded-lg border" style={{ borderColor: "var(--border-color)" }}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">{role}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {users.filter((u) => u.role === role).length} user
                </span>
              </div>
              <p className="text-[11px] font-medium">{label}</p>
              <p className="text-[10px] text-muted mt-0.5">{ROLE_DESCRIPTIONS[role]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* User List */}
      <div className="theme-card p-4">
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" />
          Daftar Pengguna
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
                <th className="text-left px-3 py-2 font-semibold">Nama</th>
                <th className="text-left px-3 py-2 font-semibold">Email</th>
                <th className="text-left px-3 py-2 font-semibold">Peran</th>
                <th className="text-left px-3 py-2 font-semibold">Departemen</th>
                <th className="text-left px-3 py-2 font-semibold">Cabang</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0" style={{ borderColor: "var(--border-color)" }}>
                  <td className="px-3 py-2 font-medium">{u.name}</td>
                  <td className="px-3 py-2 text-xs text-muted">{u.email}</td>
                  <td className="px-3 py-2"><span className="text-[10px] font-mono px-2 py-0.5 rounded theme-btn-secondary">{u.role}</span></td>
                  <td className="px-3 py-2 text-xs">{u.department || "—"}</td>
                  <td className="px-3 py-2 text-xs">{u.branchId ? (branchMap[u.branchId] || u.branchId) : "HQ"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log */}
      <div className="theme-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-amber-500" />
            Jejak Audit (Audit Trail)
          </h2>
          <button onClick={fetchData} className="theme-btn-secondary p-1.5" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="theme-input py-1.5 px-2 text-xs">
            <option value="">Semua Aksi</option>
            {uniqueActions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} className="theme-input py-1.5 px-2 text-xs">
            <option value="">Semua Entitas</option>
            {uniqueEntities.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8"><FileCheck className="w-8 h-8 mx-auto mb-2 text-muted" /><p className="text-sm text-muted">Belum ada log audit.</p></div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="p-2.5 rounded-lg border" style={{ borderColor: "var(--border-color)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">{log.action}</span>
                      <span className="text-[10px] text-muted">{log.entity}</span>
                    </div>
                    <p className="text-xs">{log.details || "—"}</p>
                    <p className="text-[10px] text-muted mt-0.5">
                      {log.user?.name || "Sistem"} ({log.user?.role || "N/A"}) · {formatDate(log.createdAt)}{log.ipAddress && ` · ${log.ipAddress}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}