"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  BarChart3,
  Package,
  Wallet,
  Ticket,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Bell,
  Megaphone,
} from "lucide-react";

interface DashboardStats {
  summary: {
    totalDocs: number;
    pendingDocs: number;
    approvedDocs: number;
    totalReports: number;
    complianceRate: number;
    lowStockCount: number;
    pettyCashBalance: number;
    totalTickets: number;
    activeTickets: number;
    pendingSalesVerifications: number;
  };
  recentAuditLogs: Array<{
    id: string;
    action: string;
    details: string | null;
    createdAt: string;
    user: { name: string; role: string } | null;
  }>;
  recentBulletins: Array<{
    id: string;
    title: string;
    category: string;
    priority: string;
    createdAt: string;
    author: { name: string };
  }>;
  userScope: {
    role: string;
    isHqOrSysadmin: boolean;
    branchName: string;
  };
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  trend?: string;
}) {
  return (
    <div className="theme-card p-4 sm:p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + "20", color }}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        {trend && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight mb-0.5">{value}</p>
      <p className="text-xs font-medium text-secondary">{title}</p>
      <p className="text-[10px] text-muted mt-0.5">{subtitle}</p>
    </div>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

const ACTION_ICONS: Record<string, string> = {
  LOGIN: "🟢",
  LOGOUT: "🔴",
  CREATE_DOCUMENT: "📄",
  APPROVE_SUPPLY: "✅",
  CREATE_SUPPLY_REQUEST: "📦",
  CREATE_PETTY_CASH: "💰",
  SUBMIT_OPERATIONAL_REPORT: "📊",
};

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat statistik");
        return res.json();
      })
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm text-muted">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="theme-card p-8 text-center">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
        <h3 className="text-lg font-bold mb-1">Gagal Memuat Data</h3>
        <p className="text-sm text-secondary">{error || "Terjadi kesalahan tak terduga."}</p>
      </div>
    );
  }

  const { summary, recentAuditLogs, recentBulletins, userScope } = stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">
          Dashboard Operasional
        </h1>
        <p className="text-sm text-secondary">
          Selamat datang! Berikut ringkasan aktivitas {userScope.branchName}.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Dokumen"
          value={summary.totalDocs}
          subtitle={`${summary.pendingDocs} menunggu review`}
          icon={FileText}
          color="#6366f1"
        />
        <StatCard
          title="Kepatuhan Laporan"
          value={`${summary.complianceRate}%`}
          subtitle={`${summary.totalReports} laporan total`}
          icon={BarChart3}
          color="#10b981"
          trend={summary.complianceRate >= 90 ? "+5%" : undefined}
        />
        <StatCard
          title="Stok Menipis"
          value={summary.lowStockCount}
          subtitle="Item di bawah minimum"
          icon={Package}
          color="#f59e0b"
        />
        <StatCard
          title="Saldo Kas Kecil"
          value={formatCurrency(summary.pettyCashBalance)}
          subtitle="Sisa saldo operasional"
          icon={Wallet}
          color="#8b5cf6"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="theme-card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              Aktivitas Terbaru
            </h2>
            <span className="text-[10px] text-muted">Audit Trail</span>
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto">
            {recentAuditLogs.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">Belum ada aktivitas.</p>
            ) : (
              recentAuditLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 py-2 border-b last:border-0" style={{ borderColor: "var(--border-color)" }}>
                  <span className="text-base shrink-0 mt-0.5">{ACTION_ICONS[log.action] || "📌"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{log.details || log.action}</p>
                    <p className="text-[10px] text-muted mt-0.5">
                      {log.user?.name || "Sistem"} · {formatRelativeTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="theme-card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-500" />
              Pengumuman & Memo
            </h2>
            <span className="text-[10px] text-muted">Internal Bulletin</span>
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto">
            {recentBulletins.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">Belum ada pengumuman.</p>
            ) : (
              recentBulletins.map((b) => (
                <div key={b.id} className="p-3 rounded-lg border" style={{ borderColor: "var(--border-color)" }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold leading-snug">{b.title}</p>
                    {b.priority === "CRITICAL" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 font-bold shrink-0">
                        PENTING
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted">
                    {b.author.name} · {formatRelativeTime(b.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="theme-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#f59e0b20", color: "#f59e0b" }}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">{summary.approvedDocs}</p>
            <p className="text-[10px] text-muted">Dokumen Disetujui</p>
          </div>
        </div>
        <div className="theme-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#ef44441a", color: "#ef4444" }}>
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">{summary.activeTickets}</p>
            <p className="text-[10px] text-muted">Tiket Aktif</p>
          </div>
        </div>
        <div className="theme-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#8b5cf620", color: "#8b5cf6" }}>
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">{summary.pendingSalesVerifications}</p>
            <p className="text-[10px] text-muted">Verifikasi Sales</p>
          </div>
        </div>
      </div>
    </div>
  );
}