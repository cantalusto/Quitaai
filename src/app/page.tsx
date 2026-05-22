"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  saldoVenda,
  saldoEmprestimo,
  pagoVenda,
  pagoEmprestimo,
  useStore,
} from "@/lib/store";
import { formatBRL, toISODate } from "@/lib/utils";
import {
  ArrowRight,
  Banknote,
  Bell,
  CheckCircle2,
  MessageCircle,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LiveClock } from "@/components/live-clock";

type CobrancaItem = {
  id: string;
  tipo: "venda" | "emprestimo";
  clienteId: string;
  clienteNome: string;
  telefone: string;
  total: number;
  pago: number;
  saldo: number;
  vencimento: string;
  status: "atrasado" | "hoje" | "proximo";
  diasAtraso: number;
};

const SHOP_OWNER = "Dona Iracema"; // TODO: configurável depois

export default function HomePage() {
  const { db, ready } = useStore();

  const itens = useMemo<CobrancaItem[]>(() => {
    if (!ready) return [];
    const hoje = toISODate(new Date());
    const today = new Date(hoje);
    const list: CobrancaItem[] = [];

    db.vendas
      .filter((v) => v.modalidade !== "avista" && v.vencimento)
      .forEach((v) => {
        const saldo = saldoVenda(v, db.pagamentos);
        if (saldo <= 0) return;
        const cliente = db.clientes.find((c) => c.id === v.clienteId);
        if (!cliente) return;
        const venc = v.vencimento!;
        const status: CobrancaItem["status"] =
          venc < hoje ? "atrasado" : venc === hoje ? "hoje" : "proximo";
        const diasAtraso =
          venc < hoje
            ? Math.round((today.getTime() - new Date(venc).getTime()) / 86400000)
            : 0;
        list.push({
          id: v.id,
          tipo: "venda",
          clienteId: cliente.id,
          clienteNome: cliente.nome,
          telefone: cliente.telefone,
          total: v.totalComJuros,
          pago: pagoVenda(v, db.pagamentos),
          saldo,
          vencimento: venc,
          status,
          diasAtraso,
        });
      });

    db.emprestimos.forEach((e) => {
      const saldo = saldoEmprestimo(e, db.pagamentos);
      if (saldo <= 0) return;
      const cliente = db.clientes.find((c) => c.id === e.clienteId);
      if (!cliente) return;
      const status: CobrancaItem["status"] =
        e.vencimento < hoje ? "atrasado" : e.vencimento === hoje ? "hoje" : "proximo";
      const diasAtraso =
        e.vencimento < hoje
          ? Math.round(
              (today.getTime() - new Date(e.vencimento).getTime()) / 86400000
            )
          : 0;
      list.push({
        id: e.id,
        tipo: "emprestimo",
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        telefone: cliente.telefone,
        total: e.totalComJuros,
        pago: pagoEmprestimo(e, db.pagamentos),
        saldo,
        vencimento: e.vencimento,
        status,
        diasAtraso,
      });
    });

    return list.sort((a, b) => {
      if (a.status !== b.status) {
        const order = { atrasado: 0, hoje: 1, proximo: 2 };
        return order[a.status] - order[b.status];
      }
      return b.saldo - a.saldo;
    });
  }, [db, ready]);

  const urgentes = itens.filter(
    (i) => i.status === "hoje" || i.status === "atrasado"
  );
  const totalUrgente = urgentes.reduce((acc, i) => acc + i.saldo, 0);
  const atrasados = urgentes.filter((i) => i.status === "atrasado").length;
  const clientesUnicos = new Set(urgentes.map((i) => i.clienteId)).size;

  const [reais, centavos] = formatBRL(totalUrgente)
    .replace("R$ ", "")
    .split(",");

  return (
    <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-6 lg:px-8 lg:py-6">
      {/* Coluna esquerda */}
      <div className="px-5 sm:px-8 lg:px-0 py-6 lg:py-0">
        {/* Data ao vivo */}
        <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-6">
          <LiveClock />
        </p>

        {/* Greeting */}
        <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[0.95] tracking-tight">
          Bora cobrar,
          <br />
          <span className="text-muted-foreground">{SHOP_OWNER}.</span>
        </h1>

        {/* Divisor com label */}
        <div className="flex items-center justify-between mt-8 mb-3">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            Tá na conta <span className="opacity-50">·</span> hoje
          </span>
          {totalUrgente > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Cobrar
            </span>
          )}
        </div>
        <div className="h-px bg-border" />

        {/* Hero R$ */}
        <div className="mt-6 mb-6">
          <p className="font-display font-bold leading-none tracking-tight flex items-baseline">
            <span className="text-2xl sm:text-3xl text-muted-foreground mr-2">R$</span>
            <span className="text-6xl sm:text-7xl lg:text-8xl">
              {reais || "0"}
            </span>
            <span className="text-3xl sm:text-4xl lg:text-5xl text-primary">
              ,{centavos || "00"}
            </span>
          </p>
        </div>

        {/* Stats inline */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-8">
          <span>
            {clientesUnicos} cliente{clientesUnicos !== 1 ? "s" : ""}
          </span>
          {atrasados > 0 && (
            <>
              <span className="opacity-30">·</span>
              <span className="text-destructive">
                {atrasados} atrasado{atrasados !== 1 ? "s" : ""}
              </span>
            </>
          )}
          <span className="opacity-30">·</span>
          <span>{itens.length} total</span>
        </div>

        {/* Ações */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          <ActionCard
            href="/vendas/nova"
            icon={ShoppingCart}
            title="Nova venda"
            sub="Fiado · À vista · Prazo"
            primary
          />
          <ActionCard
            href="/emprestimos/novo"
            icon={Banknote}
            title="Empréstimo"
            sub="Dinheiro emprestado"
          />
          <ActionCard
            href="/clientes"
            icon={Bell}
            title="Lembrete"
            sub="Zap em massa"
            className="hidden lg:flex"
          />
        </div>
      </div>

      {/* Coluna direita (mobile: abaixo; PC: aside) */}
      <aside className="px-5 sm:px-8 lg:px-0 lg:pt-0">
        <div className="lg:rounded-2xl lg:bg-card lg:border lg:border-border lg:p-5 lg:sticky lg:top-20">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display font-bold text-2xl tracking-tight">
              Pra hoje
            </h2>
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              {String(urgentes.length).padStart(2, "0")} /{" "}
              {String(itens.length).padStart(2, "0")}
            </span>
          </div>

          {itens.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <p className="font-display font-bold">Tudo em dia.</p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                Sem cobranças pendentes
              </p>
            </div>
          ) : (
            <ul className="space-y-1 -mx-2">
              {urgentes.slice(0, 6).map((i) => (
                <CobrancaRow key={`${i.tipo}-${i.id}`} item={i} />
              ))}
              {urgentes.length === 0 &&
                itens.slice(0, 6).map((i) => (
                  <CobrancaRow key={`${i.tipo}-${i.id}`} item={i} />
                ))}
            </ul>
          )}

          {itens.length > 6 && (
            <Link
              href="/clientes"
              className="block mt-4 text-center text-xs uppercase tracking-widest font-mono py-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
            >
              Ver caderneta toda <ArrowRight className="inline h-3 w-3" />
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  sub,
  primary,
  className,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
  primary?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[130px] sm:min-h-[150px] transition-all active:scale-[0.98]",
        primary
          ? "bg-primary text-primary-foreground hover:opacity-95"
          : "bg-card border border-border hover:border-primary/40",
        className
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          primary ? "bg-black/15" : "bg-muted"
        )}
      >
        <Icon className={cn("h-5 w-5", !primary && "text-primary")} />
      </div>
      <div>
        <p className="font-display font-bold text-lg sm:text-xl leading-tight">
          {title}
        </p>
        <p
          className={cn(
            "text-[10px] uppercase tracking-widest mt-1",
            primary ? "opacity-75" : "text-muted-foreground"
          )}
        >
          {sub} <ArrowRight className="inline h-3 w-3" />
        </p>
      </div>
    </Link>
  );
}

function CobrancaRow({ item }: { item: CobrancaItem }) {
  const initials = item.clienteNome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const statusTxt =
    item.status === "atrasado"
      ? `Atrasado ${item.diasAtraso}d`
      : item.status === "hoje"
      ? "Hoje"
      : "Próximo";

  const statusColor =
    item.status === "atrasado"
      ? "text-destructive"
      : item.status === "hoje"
      ? "text-primary"
      : "text-muted-foreground";

  const msg = encodeURIComponent(
    `Olá ${item.clienteNome}! Passando pra lembrar do seu pagamento de ${formatBRL(
      item.saldo
    )}. 🙏`
  );

  return (
    <li>
      <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-muted/50 transition-colors">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0 border-2",
            item.status === "atrasado"
              ? "border-destructive/50 text-destructive bg-destructive/10"
              : "border-primary/40 text-foreground bg-card"
          )}
        >
          {initials}
        </div>
        <Link href={`/clientes/${item.clienteId}`} className="flex-1 min-w-0">
          <p className="font-medium truncate">{item.clienteNome}</p>
          <p
            className={cn(
              "text-[10px] uppercase tracking-widest font-mono mt-0.5",
              statusColor
            )}
          >
            {statusTxt}
          </p>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <p className="font-mono font-bold text-sm">{formatBRL(item.saldo)}</p>
          {item.telefone && (
            <a
              href={`https://wa.me/${item.telefone.replace(/\D/g, "")}?text=${msg}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Cobrar via WhatsApp"
              className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
