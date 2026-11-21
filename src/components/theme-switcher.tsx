"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme, THEME_CATALOG } from "./theme-context";
import { Palette, Sun, Moon, Check, Sparkles } from "lucide-react";

export function ThemeSwitcher({ compact = false }: { readonly compact?: boolean }) {
  const { theme, mode, setTheme, toggleMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentMeta = THEME_CATALOG.find((t) => t.id === theme) || THEME_CATALOG[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="theme-btn-secondary inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium cursor-pointer"
          title="Ubah Gaya Desain Tampilan (Adaptive 6-Theme Engine)"
        >
          <Palette className="w-3.5 h-3.5 text-indigo-500" />
          <span className="hidden sm:inline font-semibold">{currentMeta.name}</span>
          {!compact && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono">
              6 Themes
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={toggleMode}
          className="theme-btn-secondary p-1.5 cursor-pointer"
          title={mode === "light" ? "Ganti ke Mode Gelap" : "Ganti ke Mode Terang"}
        >
          {mode === "light" ? (
            <Moon className="w-4 h-4 text-slate-700 dark:text-slate-200" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl theme-card-elevated p-4 shadow-2xl z-50 border border-white/20">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/10 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h4 className="text-sm font-bold tracking-tight">Adaptive 6-Theme Engine</h4>
            </div>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-mono bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              Zero-Reload
            </span>
          </div>

          <p className="text-xs text-secondary mb-3">
            Pilih karakteristik visual antarmuka kerja Anda sesuai preferensi kenyamanan mata:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
            {THEME_CATALOG.map((item) => {
              const isSelected = theme === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTheme(item.id);
                    setIsOpen(false);
                  }}
                  className={`flex flex-col text-left p-2.5 rounded-xl transition-all cursor-pointer border ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20"
                      : "border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      {item.name}
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${item.badgeColor}`}>
                      {item.id.split("-")[0]}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 mb-0.5">
                    {item.tagline}
                  </span>
                  <p className="text-[10px] leading-tight text-secondary line-clamp-2">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-muted">Mode Pencahayaan:</span>
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg">
              <button
                onClick={() => mode !== "light" && toggleMode()}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  mode === "light"
                    ? "bg-white shadow text-slate-900"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Sun className="w-3 h-3 text-amber-500" />
                Siang
              </button>
              <button
                onClick={() => mode !== "dark" && toggleMode()}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  mode === "dark"
                    ? "bg-slate-800 shadow text-white"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Moon className="w-3 h-3 text-indigo-400" />
                Malam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
