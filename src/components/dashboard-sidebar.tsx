"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Package,
  Ticket,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: null },
  { href: "/dashboard/documents", label: "Dokumen & Arsip", icon: FileText, roles: null },
  { href: "/dashboard/reports", label: "Laporan Operasional", icon: BarChart3, roles: ["HQ_COORDINATOR", "BRANCH_ADMIN", "BRANCH_MANAGER", "SYSTEM_ADMIN"] },
  { href: "/dashboard/office", label: "Operasional Kantor", icon: Package, roles: ["HQ_COORDINATOR", "BRANCH_ADMIN", "BRANCH_MANAGER", "SYSTEM_ADMIN"] },
  { href: "/dashboard/sales", label: "Sales & CS Support", icon: Ticket, roles: null },
  { href: "/dashboard/coordination", label: "Koordinasi", icon: Ticket, roles: null },
  { href: "/dashboard/admin", label: "Administrasi", icon: Settings, roles: ["HQ_COORDINATOR", "SYSTEM_ADMIN"] },
];

export function DashboardSidebar({
  user,
  collapsed,
  onToggle,
}: {
  user: { name: string; role: string; email: string; branch?: { name: string; code: string } | null };
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.roles === null || item.roles.includes(user.role)
  );

  return (
    <aside
      className={`theme-sidebar fixed left-0 top-0 bottom-0 z-30 flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b" style={{ borderColor: "var(--border-color)" }}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md" style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
              F
            </div>
            <div className="text-left">
              <span className="text-sm font-bold block leading-tight">Fainaya</span>
              <span className="text-[10px] text-muted block leading-tight">AdminDesk</span>
            </div>
          </Link>
        )}
        <button
          onClick={onToggle}
          className="theme-btn-secondary p-1.5 cursor-pointer"
          title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        <div className={`px-2 mb-2 ${collapsed ? "hidden" : "block"}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Menu Utama</span>
        </div>
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? "text-white shadow-md"
                  : "hover:bg-black/5 dark:hover:bg-white/5"
              }`}
              style={
                isActive
                  ? { background: "var(--primary-accent)" }
                  : {}
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-muted"}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {!collapsed && (
        <div className="p-3 border-t" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{user.name}</p>
              <p className="text-[10px] text-muted truncate">{user.branch?.code || "HQ"}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}