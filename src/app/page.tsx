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
import { Button } from "@/components/ui/button";
import { formatBRL, formatDate, toISODate } from "@/lib/utils";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  MessageCircle,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
};

export default function DashboardPage() {
  const { db, ready } = useStore();

  const itens = useMemo<CobrancaItem[]>(() => {
    if (!ready) return [];
    const hoje = toISODate(new Date());
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
        });
      });

    db.emprestimos.forEach((e) => {
      const saldo = saldoEmprestimo(e, db.pagamentos);
      if (saldo <= 0) return;
      const cliente = db.clientes.find((c) => c.id === e.clienteId);
      if (!cliente) return;
      const status: CobrancaItem["status"] =
        e.vencimento < hoje ? "atrasado" : e.vencimento === hoje ? "hoje" : "proximo";
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
      });
    });

    return list.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  }, [db, ready]);

  const atrasados = itens.filter((i) => i.status === "atrasado");
  const hoje = itens.filter((i) => i.status === "hoje");
  const proximos = itens.filter((i) => i.status === "proximo");

  const totalReceber = itens.reduce((acc, i) => acc + i.saldo, 0);
  const urgentes = [...atrasados, ...hoje];
  const totalUrgente = urgentes.reduce((acc, i) => acc + i.saldo, 0);

  const ola = saudacao();

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-8 py-6 lg:py-10">
      {/* Saudação */}
      <div className="mb-7">
        <p className="text-sm text-muted-foreground">{ola}</p>
        <h1 className="text-2xl font-bold tracking-tight mt-0.5">
          Bom te ver aqui 👋
        </h1>
      </div>

      {/* Hero card — total a receber */}
      <div className="rounded-3xl bg-card p-6 mb-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Você tem a receber
        </p>
        <p className="text-4xl sm:text-5xl font-bold font-mono mt-2 tracking-tight">
          {formatBRL(totalReceber)}
        </p>
        {totalUrgente > 0 && (
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Cobrar agora</p>
              <p className="font-mono font-semibold text-primary">
                {formatBRL(totalUrgente)}
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary font-medium">
              {urgentes.length} pessoa{urgentes.length > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link
          href="/vendas/nova"
          className="rounded-3xl bg-primary text-primary-foreground p-5 flex flex-col gap-3 hover:opacity-95 transition-opacity min-h-[120px]"
        >
          <div className="w-11 h-11 rounded-full bg-black/15 flex items-center justify-center">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div className="flex items-end justify-between mt-auto">
            <div>
              <p className="font-semibold">Nova venda</p>
              <p className="text-xs opacity-80">Registrar compra</p>
            </div>
            <ArrowRight className="h-4 w-4 opacity-80" />
          </div>
        </Link>
        <Link
          href="/emprestimos/novo"
          className="rounded-3xl bg-card p-5 flex flex-col gap-3 hover:bg-muted/60 transition-colors min-h-[120px] border border-border"
        >
          <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center">
            <Banknote className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-end justify-between mt-auto">
            <div>
              <p className="font-semibold">Empréstimo</p>
              <p className="text-xs text-muted-foreground">Dinheiro emprestado</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>
      </div>

      {/* Listas */}
      {urgentes.length > 0 && (
        <Section title="Para cobrar agora" tone="urgent">
          {urgentes.map((i) => (
            <CobrancaRow key={`${i.tipo}-${i.id}`} item={i} />
          ))}
        </Section>
      )}

      {proximos.length > 0 && (
        <Section title="Próximas cobranças" tone="normal">
          {proximos.slice(0, 5).map((i) => (
            <CobrancaRow key={`${i.tipo}-${i.id}`} item={i} />
          ))}
        </Section>
      )}

      {itens.length === 0 && (
        <div className="rounded-3xl bg-card p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-7 w-7 text-[color:var(--success)]" />
          </div>
          <h3 className="font-semibold text-lg">Tudo em dia!</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-xs mx-auto">
            Não há cobranças pendentes. Comece registrando uma nova venda.
          </p>
          <Button asChild>
            <Link href="/vendas/nova">
              <ShoppingCart className="h-4 w-4" />
              Nova venda
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function saudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "urgent" | "normal";
  children: React.ReactNode;
}) {
  return (
    <section className="mb-7">
      <div className="flex items-center gap-2 mb-3 px-2">
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            tone === "urgent" ? "bg-destructive" : "bg-muted-foreground/50"
          )}
        />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
      </div>
      <div className="rounded-3xl bg-card divide-y divide-border overflow-hidden">
        {children}
      </div>
    </section>
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
      ? "Atrasado"
      : item.status === "hoje"
      ? "Vence hoje"
      : formatDate(item.vencimento);

  const statusColor =
    item.status === "atrasado"
      ? "text-destructive"
      : item.status === "hoje"
      ? "text-[color:var(--warning)]"
      : "text-muted-foreground";

  const msg = encodeURIComponent(
    `Olá ${item.clienteNome}! Passando pra lembrar do seu pagamento de ${formatBRL(
      item.saldo
    )}. 🙏`
  );

  return (
    <div className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors">
      <div className="w-11 h-11 rounded-full bg-secondary text-foreground/80 flex items-center justify-center font-semibold text-sm shrink-0">
        {initials}
      </div>
      <Link href={`/clientes/${item.clienteId}`} className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.clienteNome}</p>
        <p className={cn("text-xs mt-0.5", statusColor)}>{statusTxt}</p>
      </Link>
      <div className="flex flex-col items-end gap-1.5">
        <p className="font-mono font-semibold">{formatBRL(item.saldo)}</p>
        {item.telefone && (
          <a
            href={`https://wa.me/${item.telefone.replace(/\D/g, "")}?text=${msg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition-colors inline-flex items-center gap-1"
          >
            <MessageCircle className="h-3 w-3" />
            Cobrar
          </a>
        )}
      </div>
    </div>
  );
}
