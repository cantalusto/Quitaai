"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Banknote,
  Sun,
  Moon,
  X,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NotificationBell } from "./notifications-drawer";

const navItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/painel", label: "Painel", icon: BarChart3 },
  { href: "/vendas/nova", label: "Vender", icon: ShoppingCart, primary: true },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/produtos", label: "Produtos", icon: Package },
];

const sidebarItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/painel", label: "Painel", icon: BarChart3 },
  { href: "/vendas/nova", label: "Nova venda", icon: ShoppingCart },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/emprestimos/novo", label: "Empréstimo", icon: Banknote },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Sidebar - Desktop (estreita, só ícones) */}
      <aside className="hidden lg:flex w-16 flex-col items-center border-r border-border bg-background fixed inset-y-0 left-0 z-30 py-4">
        <Link href="/" className="mb-6" aria-label="Quita aí">
          <Logo showText={false} size={36} />
        </Link>
        <nav className="flex-1 flex flex-col gap-1.5 items-center">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {/* Tooltip */}
                <span className="absolute left-full ml-3 px-2 py-1 rounded-md bg-popover text-popover-foreground text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-lg border border-border">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col items-center gap-2 mt-2">
          <ThemeToggleIcon />
          <div className="text-[10px] font-mono text-muted-foreground/60 [writing-mode:vertical-rl] rotate-180 mt-2">
            v0.1 · quita.aí
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col min-h-screen lg:ml-16">
        {/* Topbar */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 lg:px-8 h-14 lg:h-16">
            <div className="lg:hidden flex items-center gap-3">
              <Logo size={26} showText />
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <span>Mercadinho do Tio</span>
            </div>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <ThemeToggleCompact />
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
                        "w-14 h-14 rounded-full flex items-center justify-center shadow-xl shadow-primary/30 transition-all",
                        sheetOpen ? "scale-95" : "scale-100",
                        "bg-primary text-primary-foreground"
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
                    "flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium uppercase tracking-wider transition-colors",
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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-sm bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="flex items-center justify-between px-5 pt-2 pb-1">
          <h2 className="font-display text-xl font-bold">Nova transação</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="px-5 text-xs uppercase tracking-wider text-muted-foreground -mt-1 mb-3">
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
              <p className="font-display font-bold text-lg">Nova venda</p>
              <p className="text-[11px] uppercase tracking-wider opacity-80">
                Fiado · À vista · Prazo
              </p>
            </div>
            <ArrowRight className="h-5 w-5 opacity-70" />
          </button>

          <button
            onClick={() => go("/emprestimos/novo")}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:bg-muted active:scale-[0.99] transition-all text-left"
          >
            <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Banknote className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-display font-bold text-lg">Empréstimo</p>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Dinheiro emprestado
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-5 pb-5 pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm uppercase tracking-wider text-muted-foreground hover:bg-muted transition-colors"
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

function ThemeToggleIcon() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-10 h-10" />;
  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
      aria-label="Alternar tema"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
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
