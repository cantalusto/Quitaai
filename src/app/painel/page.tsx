"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore, saldoVenda, saldoEmprestimo, pagoVenda, pagoEmprestimo } from "@/lib/store";
import { formatBRL, toISODate } from "@/lib/utils";
import {
  TrendingUp,
  Wallet,
  ShoppingBag,
  AlertTriangle,
  Trophy,
  Award,
  Clock,
  Package,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PainelPage() {
  const { db, ready } = useStore();

  const stats = useMemo(() => {
    if (!ready) return null;

    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - 7);

    // Vendas
    const totalReceber =
      db.vendas
        .filter((v) => v.modalidade !== "avista")
        .reduce((acc, v) => acc + saldoVenda(v, db.pagamentos), 0) +
      db.emprestimos.reduce((acc, e) => acc + saldoEmprestimo(e, db.pagamentos), 0);

    const vendasMes = db.vendas.filter((v) => new Date(v.criadaEm) >= inicioMes);
    const vendasSemana = db.vendas.filter((v) => new Date(v.criadaEm) >= inicioSemana);

    const receitaMes = vendasMes.reduce((acc, v) => acc + v.totalComJuros, 0);
    const receitaSemana = vendasSemana.reduce((acc, v) => acc + v.totalComJuros, 0);
    const ticketMedio =
      vendasMes.length > 0 ? receitaMes / vendasMes.length : 0;

    const recebidoMes = db.pagamentos
      .filter((p) => new Date(p.data) >= inicioMes)
      .reduce((acc, p) => acc + p.valor, 0);

    // === Insights de clientes ===
    type ClienteStats = {
      id: string;
      nome: string;
      totalCompras: number;
      qtdCompras: number;
      saldoAberto: number;
      diasAtrasoMedio: number;
      cobrancasTotais: number;
      cobrancasAtrasadas: number;
      cobrancasPontuais: number;
    };

    const hojeISO = toISODate(hoje);
    const cs = new Map<string, ClienteStats>();
    db.clientes.forEach((c) => {
      cs.set(c.id, {
        id: c.id,
        nome: c.nome,
        totalCompras: 0,
        qtdCompras: 0,
        saldoAberto: 0,
        diasAtrasoMedio: 0,
        cobrancasTotais: 0,
        cobrancasAtrasadas: 0,
        cobrancasPontuais: 0,
      });
    });

    let atrasoSumPorCliente = new Map<string, { dias: number; n: number }>();

    db.vendas.forEach((v) => {
      const s = cs.get(v.clienteId);
      if (!s) return;
      s.totalCompras += v.totalComJuros;
      s.qtdCompras += 1;

      if (v.modalidade !== "avista" && v.vencimento) {
        s.cobrancasTotais += 1;
        const saldo = saldoVenda(v, db.pagamentos);
        s.saldoAberto += saldo;
        if (saldo <= 0) {
          // pago totalmente — vê se pagou em dia
          const ultimoPag = db.pagamentos
            .filter((p) => p.origem === "venda" && p.refId === v.id)
            .sort((a, b) => b.data.localeCompare(a.data))[0];
          if (ultimoPag && toISODate(new Date(ultimoPag.data)) <= v.vencimento) {
            s.cobrancasPontuais += 1;
          }
        } else if (v.vencimento < hojeISO) {
          s.cobrancasAtrasadas += 1;
          const diasAtraso = Math.round(
            (hoje.getTime() - new Date(v.vencimento).getTime()) / 86400000
          );
          const cur = atrasoSumPorCliente.get(v.clienteId) || { dias: 0, n: 0 };
          cur.dias += diasAtraso;
          cur.n += 1;
          atrasoSumPorCliente.set(v.clienteId, cur);
        }
      }
    });

    db.emprestimos.forEach((e) => {
      const s = cs.get(e.clienteId);
      if (!s) return;
      s.cobrancasTotais += 1;
      const saldo = saldoEmprestimo(e, db.pagamentos);
      s.saldoAberto += saldo;
      if (saldo <= 0) {
        const ultimoPag = db.pagamentos
          .filter((p) => p.origem === "emprestimo" && p.refId === e.id)
          .sort((a, b) => b.data.localeCompare(a.data))[0];
        if (ultimoPag && toISODate(new Date(ultimoPag.data)) <= e.vencimento) {
          s.cobrancasPontuais += 1;
        }
      } else if (e.vencimento < hojeISO) {
        s.cobrancasAtrasadas += 1;
        const diasAtraso = Math.round(
          (hoje.getTime() - new Date(e.vencimento).getTime()) / 86400000
        );
        const cur = atrasoSumPorCliente.get(e.clienteId) || { dias: 0, n: 0 };
        cur.dias += diasAtraso;
        cur.n += 1;
        atrasoSumPorCliente.set(e.clienteId, cur);
      }
    });

    cs.forEach((s, id) => {
      const a = atrasoSumPorCliente.get(id);
      s.diasAtrasoMedio = a ? a.dias / a.n : 0;
    });

    const clientesArr = Array.from(cs.values()).filter(
      (s) => s.qtdCompras > 0 || s.saldoAberto > 0
    );

    const topCompradores = [...clientesArr]
      .filter((c) => c.totalCompras > 0)
      .sort((a, b) => b.totalCompras - a.totalCompras)
      .slice(0, 5);

    const piorPagadores = [...clientesArr]
      .filter((c) => c.diasAtrasoMedio > 0)
      .sort((a, b) => b.diasAtrasoMedio - a.diasAtrasoMedio)
      .slice(0, 5);

    const melhorPagadores = [...clientesArr]
      .filter((c) => c.cobrancasTotais > 0)
      .map((c) => ({
        ...c,
        pontualidade: (c.cobrancasPontuais / c.cobrancasTotais) * 100,
      }))
      .sort((a, b) => b.pontualidade - a.pontualidade || b.cobrancasTotais - a.cobrancasTotais)
      .slice(0, 5);

    // === Insights de produtos ===
    type ProdStats = {
      id: string;
      codigo: string;
      nome: string;
      qtdVendida: number;
      receitaTotal: number;
      vendasContagem: number;
    };
    const ps = new Map<string, ProdStats>();
    db.produtos.forEach((p) => {
      ps.set(p.id, {
        id: p.id,
        codigo: p.codigo,
        nome: p.nome,
        qtdVendida: 0,
        receitaTotal: 0,
        vendasContagem: 0,
      });
    });
    db.vendas.forEach((v) => {
      v.itens.forEach((i) => {
        const s = ps.get(i.produtoId);
        if (!s) return;
        s.qtdVendida += i.quantidade;
        s.receitaTotal += i.subtotal;
        s.vendasContagem += 1;
      });
    });
    const produtosArr = Array.from(ps.values()).filter((p) => p.vendasContagem > 0);
    const topProdutosQtd = [...produtosArr]
      .sort((a, b) => b.qtdVendida - a.qtdVendida)
      .slice(0, 5);
    const topProdutosReceita = [...produtosArr]
      .sort((a, b) => b.receitaTotal - a.receitaTotal)
      .slice(0, 5);

    // Chart 7 dias
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() - (6 - i));
      const iso = toISODate(d);
      const total = db.vendas
        .filter((v) => toISODate(new Date(v.criadaEm)) === iso)
        .reduce((acc, v) => acc + v.totalComJuros, 0);
      return {
        date: d,
        iso,
        label: d.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3),
        total,
      };
    });
    const maxBar = Math.max(...last7.map((d) => d.total), 1);

    return {
      totalReceber,
      receitaMes,
      receitaSemana,
      recebidoMes,
      ticketMedio,
      qtdVendasMes: vendasMes.length,
      topCompradores,
      piorPagadores,
      melhorPagadores,
      topProdutosQtd,
      topProdutosReceita,
      last7,
      maxBar,
    };
  }, [db, ready]);

  if (!stats) {
    return <div className="p-8 text-center text-muted-foreground">Carregando…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-6 lg:py-10">
      <div className="mb-7">
        <p className="text-sm text-muted-foreground">Panorama do seu negócio</p>
        <h1 className="text-2xl font-bold tracking-tight mt-0.5">Painel</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Kpi
          label="A receber"
          value={formatBRL(stats.totalReceber)}
          icon={Wallet}
          tone="primary"
        />
        <Kpi
          label="Recebido no mês"
          value={formatBRL(stats.recebidoMes)}
          icon={TrendingUp}
          tone="success"
        />
        <Kpi
          label="Vendas do mês"
          value={formatBRL(stats.receitaMes)}
          sub={`${stats.qtdVendasMes} venda${stats.qtdVendasMes !== 1 ? "s" : ""}`}
          icon={ShoppingBag}
          tone="info"
        />
        <Kpi
          label="Ticket médio"
          value={formatBRL(stats.ticketMedio)}
          icon={Award}
          tone="warning"
        />
      </div>

      {/* Gráfico 7 dias */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3 px-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Vendas dos últimos 7 dias
          </h2>
        </div>
        <div className="rounded-3xl bg-card p-5">
          <div className="flex items-end justify-between gap-2 h-32">
            {stats.last7.map((d) => {
              const h = (d.total / stats.maxBar) * 100;
              return (
                <div key={d.iso} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={cn(
                        "w-full rounded-t-lg transition-all",
                        d.total > 0 ? "bg-primary" : "bg-muted"
                      )}
                      style={{ height: `${Math.max(h, 4)}%` }}
                      title={`${d.label}: ${formatBRL(d.total)}`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-between items-baseline">
            <div>
              <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
              <p className="font-mono font-bold text-lg">
                {formatBRL(stats.receitaSemana)}
              </p>
            </div>
            <Link
              href="/vendas/nova"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              Nova venda
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Top clientes */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3 px-2">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Insights de clientes
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <RankCard
            title="Quem mais compra"
            icon={Trophy}
            tone="primary"
            items={stats.topCompradores.map((c) => ({
              id: c.id,
              nome: c.nome,
              valor: formatBRL(c.totalCompras),
              sub: `${c.qtdCompras} compra${c.qtdCompras > 1 ? "s" : ""}`,
            }))}
            empty="Nenhuma venda registrada ainda."
          />
          <RankCard
            title="Paga melhor"
            icon={Award}
            tone="success"
            items={stats.melhorPagadores.map((c) => ({
              id: c.id,
              nome: c.nome,
              valor: `${c.pontualidade.toFixed(0)}%`,
              sub: `${c.cobrancasPontuais}/${c.cobrancasTotais} em dia`,
            }))}
            empty="Sem dados de pagamentos."
          />
          <RankCard
            title="Mais atrasa"
            icon={Clock}
            tone="destructive"
            items={stats.piorPagadores.map((c) => ({
              id: c.id,
              nome: c.nome,
              valor: `${Math.round(c.diasAtrasoMedio)}d`,
              sub: "média de atraso",
            }))}
            empty="Ninguém atrasado 🎉"
          />
        </div>
      </section>

      {/* Top produtos */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3 px-2">
          <Package className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Insights de produtos
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <RankCard
            title="Mais vendidos (quantidade)"
            icon={Trophy}
            tone="primary"
            items={stats.topProdutosQtd.map((p) => ({
              id: p.id,
              nome: p.nome,
              valor: p.qtdVendida.toLocaleString("pt-BR", { maximumFractionDigits: 3 }),
              sub: `cód. ${p.codigo}`,
            }))}
            empty="Nenhuma venda registrada."
          />
          <RankCard
            title="Maior receita"
            icon={TrendingUp}
            tone="success"
            items={stats.topProdutosReceita.map((p) => ({
              id: p.id,
              nome: p.nome,
              valor: formatBRL(p.receitaTotal),
              sub: `cód. ${p.codigo}`,
            }))}
            empty="Nenhuma venda registrada."
          />
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "success" | "warning" | "info" | "destructive";
}) {
  const toneClass = {
    primary: "text-primary bg-primary/15",
    success: "text-[color:var(--success)] bg-[color:var(--success)]/15",
    warning: "text-[color:var(--warning)] bg-[color:var(--warning)]/15",
    info: "text-blue-500 bg-blue-500/15",
    destructive: "text-destructive bg-destructive/15",
  }[tone];

  return (
    <div className="rounded-3xl bg-card p-4 sm:p-5">
      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center mb-3", toneClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-lg sm:text-xl font-bold mt-1 font-mono tracking-tight truncate">
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

function RankCard({
  title,
  icon: Icon,
  tone,
  items,
  empty,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "success" | "destructive";
  items: { id: string; nome: string; valor: string; sub: string }[];
  empty: string;
}) {
  const toneClass = {
    primary: "text-primary",
    success: "text-[color:var(--success)]",
    destructive: "text-destructive",
  }[tone];

  return (
    <div className="rounded-3xl bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn("h-4 w-4", toneClass)} />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">{empty}</p>
      ) : (
        <ol className="space-y-2">
          {items.map((item, idx) => (
            <li key={item.id} className="flex items-center gap-3">
              <span
                className={cn(
                  "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0",
                  idx === 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.nome}</p>
                <p className="text-[11px] text-muted-foreground truncate">{item.sub}</p>
              </div>
              <p className={cn("text-sm font-mono font-bold shrink-0", toneClass)}>
                {item.valor}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
