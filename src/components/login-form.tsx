"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Mail, Lock, Shield, Sparkles } from "lucide-react";
import { ThemeSwitcher } from "./theme-switcher";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login gagal. Periksa kembali kredensial Anda.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan koneksi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(role: string) {
    const demoAccounts: Record<string, { email: string; password: string }> = {
      hq: { email: "hq.admin@fainaya.com", password: "fainaya123" },
      cabang: { email: "admin.bdg@fainaya.com", password: "fainaya123" },
      sales: { email: "sales.bdg@fainaya.com", password: "fainaya123" },
      cs: { email: "cs.jkt@fainaya.com", password: "fainaya123" },
      manager: { email: "manager.bdg@fainaya.com", password: "fainaya123" },
      sysadmin: { email: "sysadmin@fainaya.com", password: "fainaya123" },
    };
    const acc = demoAccounts[role];
    if (acc) {
      setEmail(acc.email);
      setPassword(acc.password);
      setError("");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeSwitcher compact />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg" style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
              F
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold tracking-tight">Fainaya AdminDesk</h1>
              <p className="text-xs text-muted">Open-Source Admin Coordinator</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">Selamat Datang Kembali</h2>
          <p className="text-sm text-secondary">Masuk ke akun Anda untuk melanjutkan koordinasi operasional.</p>
        </div>

        <div className="theme-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@fainaya.com"
                  required
                  autoComplete="email"
                  className="theme-input w-full pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  required
                  autoComplete="current-password"
                  className="theme-input w-full pl-10 pr-10 py-2.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm font-medium" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#dc2626", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="theme-btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Masuk ke Dashboard
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 theme-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Akun Demo — Klik untuk Isi Otomatis</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button onClick={() => fillDemo("hq")} className="theme-btn-secondary px-2 py-1.5 text-[11px] font-medium cursor-pointer truncate">
              Koordinator HQ
            </button>
            <button onClick={() => fillDemo("cabang")} className="theme-btn-secondary px-2 py-1.5 text-[11px] font-medium cursor-pointer truncate">
              Admin Cabang
            </button>
            <button onClick={() => fillDemo("sales")} className="theme-btn-secondary px-2 py-1.5 text-[11px] font-medium cursor-pointer truncate">
              Sales Support
            </button>
            <button onClick={() => fillDemo("cs")} className="theme-btn-secondary px-2 py-1.5 text-[11px] font-medium cursor-pointer truncate">
              Customer Service
            </button>
            <button onClick={() => fillDemo("manager")} className="theme-btn-secondary px-2 py-1.5 text-[11px] font-medium cursor-pointer truncate">
              Kepala Cabang
            </button>
            <button onClick={() => fillDemo("sysadmin")} className="theme-btn-secondary px-2 py-1.5 text-[11px] font-medium cursor-pointer truncate">
              System Admin
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            Powered by Adaptive 6-Theme Design Engine
          </p>
        </div>
      </div>
    </div>
  );
}