"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown, User, Building2, Shield } from "lucide-react";
import { ThemeSwitcher } from "./theme-switcher";

interface HeaderUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string | null;
  branch?: { id: string; name: string; code: string } | null;
  avatar?: string | null;
  themePreference?: string;
  themeMode?: string;
}

const ROLE_LABELS: Record<string, string> = {
  HQ_COORDINATOR: "Koordinator Admin Pusat",
  BRANCH_ADMIN: "Staff Admin Cabang",
  SALES_SUPPORT: "Sales Support",
  CUSTOMER_SERVICE: "Customer Service",
  BRANCH_MANAGER: "Kepala Cabang",
  SYSTEM_ADMIN: "System Administrator",
};

export function DashboardHeader({ user }: { user: HeaderUser }) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <header className="theme-header h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted" />
          <span className="text-xs text-muted truncate max-w-[200px]">
            {user.branch?.name || "Kantor Pusat"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeSwitcher compact />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 theme-btn-secondary px-2 py-1.5 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              {user.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-semibold block leading-tight max-w-[120px] truncate">{user.name}</span>
              <span className="text-[10px] text-muted block leading-tight">{ROLE_LABELS[user.role] || user.role}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 theme-card-elevated p-2 shadow-2xl z-50">
              <div className="px-3 py-2.5 border-b mb-1" style={{ borderColor: "var(--border-color)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-[11px] text-muted truncate">{user.email}</p>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-secondary">
                    <Shield className="w-3 h-3" />
                    <span>{ROLE_LABELS[user.role] || user.role}</span>
                  </div>
                  {user.department && (
                    <div className="flex items-center gap-1.5 text-[11px] text-secondary">
                      <User className="w-3 h-3" />
                      <span className="truncate">{user.department}</span>
                    </div>
                  )}
                  {user.branch && (
                    <div className="flex items-center gap-1.5 text-[11px] text-secondary">
                      <Building2 className="w-3 h-3" />
                      <span className="truncate">{user.branch.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loggingOut ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-500 rounded-full animate-spin" />
                    Keluar...
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    Keluar (Logout)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}