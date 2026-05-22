"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Banknote,
  Sun,
  Moon,
} from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, ArrowRight } from "lucide-react";
import { NotificationBell } from "./notifications-drawer";

// Bottom nav mobile (5 itens com FAB central)
const navItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/painel", label: "Painel", icon: BarChart3 },
  { href: "/vendas/nova", label: "Vender", icon: ShoppingCart, primary: true },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/produtos", label: "Produtos", icon: Package },
];

// Sidebar PC = navItems + Empréstimo
const sidebarItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/painel", label: "Painel", icon: BarChart3 },
  { href: "/vendas/nova", label: "Vender", icon: ShoppingCart },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/emprestimos/novo", label: "Empréstimo", icon: Banknote },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar - Desktop (fixa de verdade) */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-border bg-card fixed inset-y-0 left-0 z-30">
        <div className="p-6">
          <Logo />
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground/70 hover:text-foreground"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3">
          <ThemeToggle />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        {/* Topbar */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="lg:hidden">
              <Logo size={28} />
            </div>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-1">
              <NotificationBell />
              <div className="lg:hidden">
                <ThemeToggleCompact />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-24 lg:pb-8">{children}</main>

        {/* Bottom nav - Mobile */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-5 max-w-md mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              if (item.primary) {
                return (
                  <button
                    key={item.href}
                    onClick={() => setSheetOpen(true)}
                    aria-label="Nova transação"
                    className="flex flex-col items-center justify-center -mt-5"
                  >
                    <div
                      className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all",
                        sheetOpen
                          ? "bg-accent text-accent-foreground scale-105"
                          : "bg-primary text-primary-foreground"
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                  </button>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="leading-none">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <ActionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}

function ActionSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  function go(href: string) {
    onClose();
    router.push(href);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center lg:hidden"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-sm bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 pb-[env(safe-area-inset-bottom)]">
        {/* Pull handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted" />
        </div>

        <div className="flex items-center justify-between px-5 pt-2 pb-1">
          <h2 className="text-lg font-bold">Nova transação</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="px-5 text-sm text-muted-foreground -mt-1 mb-3">
          O que você quer registrar?
        </p>

        <div className="p-3 space-y-2">
          <button
            onClick={() => go("/vendas/nova")}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-primary text-primary-foreground hover:opacity-95 active:scale-[0.99] transition-all text-left"
          >
            <div className="w-11 h-11 rounded-full bg-black/15 flex items-center justify-center shrink-0">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Nova venda</p>
              <p className="text-xs opacity-80">Registrar compra de cliente</p>
            </div>
            <ArrowRight className="h-5 w-5 opacity-70" />
          </button>

          <button
            onClick={() => go("/emprestimos/novo")}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-muted hover:bg-secondary active:scale-[0.99] transition-all text-left"
          >
            <div className="w-11 h-11 rounded-full bg-card flex items-center justify-center shrink-0">
              <Banknote className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Empréstimo</p>
              <p className="text-xs text-muted-foreground">
                Emprestar dinheiro com juros
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-5 pb-5 pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-10" />;
  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
      {isDark ? "Tema claro" : "Tema escuro"}
    </button>
  );
}

function ThemeToggleCompact() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-10 h-10" />;
  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2.5 rounded-full hover:bg-muted"
      aria-label="Alternar tema"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
