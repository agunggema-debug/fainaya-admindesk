"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="theme-card p-8 text-center max-w-md">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
        <h3 className="text-lg font-bold mb-1">Terjadi Kesalahan</h3>
        <p className="text-sm text-secondary mb-4">
          {error.message || "Halaman gagal dimuat. Silakan coba lagi."}
        </p>
        <button
          onClick={reset}
          className="theme-btn-primary px-4 py-2 text-sm inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    </div>
  );
}