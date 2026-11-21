"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeName =
  | "glassmorphism"
  | "neumorphism"
  | "claymorphism"
  | "neo-brutalism"
  | "minimalist"
  | "frost";

export type ThemeMode = "light" | "dark";

export interface ThemeMeta {
  id: ThemeName;
  name: string;
  tagline: string;
  description: string;
  badgeColor: string;
}

export const THEME_CATALOG: ThemeMeta[] = [
  {
    id: "glassmorphism",
    name: "Glassmorphism",
    tagline: "Translucent & Futuristic",
    description: "Panel semi-transparan bergradien lembut dengan efek blur 16px dan glowing border tipis.",
    badgeColor: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300",
  },
  {
    id: "neumorphism",
    name: "Neumorphism",
    tagline: "Soft UI & Eye Comfort",
    description: "Permukaan monokromatik lembut dengan bayangan ganda (extruded cards & inset form inputs).",
    badgeColor: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  },
  {
    id: "claymorphism",
    name: "Claymorphism",
    tagline: "3D Friendly & Tactile",
    description: "Gaya tanah liat 3D empuk dengan border-radius 26px, inner highlight atas, dan bayangan mengambang.",
    badgeColor: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
  },
  {
    id: "neo-brutalism",
    name: "Neo-Brutalism",
    tagline: "High Contrast & Bold",
    description: "Garis hitam tegas 2.5px, bayangan balok tanpa blur, tipografi tegas, dan aksen cerah berenergi.",
    badgeColor: "bg-amber-400 text-black border border-black",
  },
  {
    id: "minimalist",
    name: "Minimalist UI",
    tagline: "Clean, Flat & Razor Sharp",
    description: "Permukaan datar, ruang bernapas lapang, garis pemisah halus 1px, optimal untuk fokus tinggi.",
    badgeColor: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  },
  {
    id: "frost",
    name: "Frost UI",
    tagline: "Deep Ice Frosted Glass",
    description: "Efek kaca es pekat 24px blur, aksen biru es sejuk, kontras tinggi untuk tabel dan data padat.",
    badgeColor: "bg-sky-500/20 text-sky-700 dark:text-sky-300",
  },
];

interface ThemeContextType {
  theme: ThemeName;
  mode: ThemeMode;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  initialTheme = "glassmorphism",
  initialMode = "light",
}: {
  children: React.ReactNode;
  initialTheme?: ThemeName;
  initialMode?: ThemeMode;
}) {
  // Initialize from props so server and client first render match (avoids
  // hydration mismatch). localStorage is only available on the client, so it
  // is applied in a mount effect below.
  const [theme, setThemeState] = useState<ThemeName>(initialTheme);
  const [mode, setModeState] = useState<ThemeMode>(initialMode);

  useEffect(() => {
    const savedTheme = localStorage.getItem("fainaya_theme") as ThemeName | null;
    const savedMode = localStorage.getItem("fainaya_mode") as ThemeMode | null;

    const resolvedTheme =
      savedTheme && THEME_CATALOG.some((t) => t.id === savedTheme)
        ? savedTheme
        : initialTheme;
    const resolvedMode =
      savedMode === "light" || savedMode === "dark" ? savedMode : initialMode;

    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.documentElement.setAttribute("data-mode", resolvedMode);
    document.documentElement.classList.toggle("dark", resolvedMode === "dark");

    // Sync state from localStorage after mount. This is the standard pattern
    // for reading a client-only external store without breaking SSR hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(resolvedTheme);
    setModeState(resolvedMode);
    // Only run on mount; initialTheme/initialMode are stable per session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem("fainaya_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);

    fetch("/api/auth/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themePreference: newTheme }),
    }).catch(() => {});
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem("fainaya_mode", newMode);
    document.documentElement.setAttribute("data-mode", newMode);
    document.documentElement.classList.toggle("dark", newMode === "dark");

    fetch("/api/auth/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeMode: newMode }),
    }).catch(() => {});
  };

  const toggleMode = () => {
    setMode(mode === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}