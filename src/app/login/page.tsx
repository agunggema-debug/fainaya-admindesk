import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-context";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Masuk — Fainaya AdminDesk",
  description: "Halaman login Fainaya AdminDesk — Aplikasi Open Source Administrasi & Koordinasi Operasional",
};

export default function LoginPage() {
  return (
    <ThemeProvider>
      <LoginForm />
    </ThemeProvider>
  );
}