"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell, X, MessageCircle, CalendarClock, AlertCircle } from "lucide-react";
import {
  saldoEmprestimo,
  saldoVenda,
  useStore,
} from "@/lib/store";
import { formatBRL, formatDate, toISODate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Notif {
  id: string;
  clienteId: string;
  clienteNome: string;
  telefone: string;
  saldo: number;
  vencimento: string;
  status: "hoje" | "atrasado";
  diasAtraso: number;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { db } = useStore();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const notifs = useMemo<Notif[]>(() => {
    const hoje = toISODate(new Date());
    const today = new Date(hoje);
    const list: Notif[] = [];

    db.vendas
      .filter((v) => v.modalidade !== "avista" && v.vencimento)
      .forEach((v) => {
        const saldo = saldoVenda(v, db.pagamentos);
        if (saldo <= 0) return;
        const venc = v.vencimento!;
        if (venc > hoje) return;
        const cliente = db.clientes.find((c) => c.id === v.clienteId);
        if (!cliente) return;
        const dias = Math.round(
          (today.getTime() - new Date(venc).getTime()) / 86400000
        );
        list.push({
          id: `v-${v.id}`,
          clienteId: cliente.id,
          clienteNome: cliente.nome,
          telefone: cliente.telefone,
          saldo,
          vencimento: venc,
          status: venc === hoje ? "hoje" : "atrasado",
          diasAtraso: dias,
        });
      });

    db.emprestimos.forEach((e) => {
      const saldo = saldoEmprestimo(e, db.pagamentos);
      if (saldo <= 0) return;
      if (e.vencimento > hoje) return;
      const cliente = db.clientes.find((c) => c.id === e.clienteId);
      if (!cliente) return;
      const dias = Math.round(
        (today.getTime() - new Date(e.vencimento).getTime()) / 86400000
      );
      list.push({
        id: `e-${e.id}`,
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        telefone: cliente.telefone,
        saldo,
        vencimento: e.vencimento,
        status: e.vencimento === hoje ? "hoje" : "atrasado",
        diasAtraso: dias,
      });
    });

    return list.sort((a, b) => {
      if (a.status !== b.status) return a.status === "atrasado" ? -1 : 1;
      return b.diasAtraso - a.diasAtraso;
    });
  }, [db]);

  const count = notifs.length;
  const total = notifs.reduce((acc, n) => acc + n.saldo, 0);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-2.5 rounded-full hover:bg-muted transition-colors"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-background">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {mounted && open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex"
            role="dialog"
            aria-modal="true"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setOpen(false)}
            />

            {/* Painel */}
            <div className="relative ml-auto h-full w-full sm:max-w-md bg-card shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <header className="flex items-center justify-between p-5 border-b border-border shrink-0">
                <div>
                  <h2 className="text-lg font-bold">Notificações</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {count === 0
                      ? "Tudo em dia ✓"
                      : `${count} cobrança${count > 1 ? "s" : ""} · ${formatBRL(total)}`}
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-full hover:bg-muted"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-3">
                {count === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
                    <div className="w-16 h-16 rounded-full bg-[color:var(--success)]/15 flex items-center justify-center mb-4">
                      <Bell className="h-7 w-7 text-[color:var(--success)]" />
                    </div>
                    <h3 className="font-semibold">Tudo certo!</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Nenhuma cobrança pendente no momento.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {notifs.map((n) => (
                      <NotifItem
                        key={n.id}
                        notif={n}
                        onAction={() => setOpen(false)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function NotifItem({ notif, onAction }: { notif: Notif; onAction: () => void }) {
  const atrasado = notif.status === "atrasado";
  const msg = encodeURIComponent(
    `Olá ${notif.clienteNome}! Passando pra lembrar: você tem ${formatBRL(
      notif.saldo
    )} ${
      atrasado
        ? `em atraso desde ${formatDate(notif.vencimento)}`
        : `vencendo hoje`
    }. Vamos acertar? 🙏`
  );

  return (
    <li>
      <div className="rounded-2xl p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              atrasado
                ? "bg-destructive/15 text-destructive"
                : "bg-[color:var(--warning)]/15 text-[color:var(--warning)]"
            )}
          >
            {atrasado ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <CalendarClock className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{notif.clienteNome}</p>
            <p
              className={cn(
                "text-xs mt-0.5",
                atrasado
                  ? "text-destructive"
                  : "text-[color:var(--warning)]"
              )}
            >
              {atrasado
                ? `${notif.diasAtraso} dia${notif.diasAtraso > 1 ? "s" : ""} em atraso`
                : "Vence hoje"}
            </p>
            <p className="font-mono font-bold text-base mt-1.5">
              {formatBRL(notif.saldo)}
            </p>

            <div className="flex gap-2 mt-3">
              <Link
                href={`/clientes/${notif.clienteId}`}
                onClick={onAction}
                className="flex-1 text-xs font-medium text-center py-2 rounded-lg bg-muted hover:bg-secondary transition-colors"
              >
                Ver cliente
              </Link>
              {notif.telefone && (
                <a
                  href={`https://wa.me/${notif.telefone.replace(
                    /\D/g,
                    ""
                  )}?text=${msg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onAction}
                  className="flex-1 text-xs font-semibold text-center py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Cobrar
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
