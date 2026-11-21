import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ThemeProvider, type ThemeName, type ThemeMode } from "@/components/theme-context";
import { DashboardShell } from "@/components/dashboard-shell";

const VALID_THEMES: ThemeName[] = ["glassmorphism", "neumorphism", "claymorphism", "neo-brutalism", "minimalist", "frost"];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const themePreference: ThemeName = VALID_THEMES.includes(user.themePreference as ThemeName)
    ? (user.themePreference as ThemeName)
    : "glassmorphism";
  const themeMode: ThemeMode = user.themeMode === "dark" ? "dark" : "light";

  return (
    <ThemeProvider initialTheme={themePreference} initialMode={themeMode}>
      <DashboardShell user={user}>{children}</DashboardShell>
    </ThemeProvider>
  );
}