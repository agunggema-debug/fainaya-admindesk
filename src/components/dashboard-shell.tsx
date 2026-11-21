"use client";

import React, { useState } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";

interface ShellUser {
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

export function DashboardShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen">
      <DashboardSidebar
        user={user}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <div
        className="transition-all duration-300"
        style={{ marginLeft: collapsed ? "4rem" : "16rem" }}
      >
        <DashboardHeader user={user} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}