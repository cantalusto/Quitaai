"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  pagoEmprestimo,
  pagoVenda,
  saldoCliente,
  saldoEmprestimo,
  saldoVenda,
  useStore,
} from "@/lib/store";
import { PageContainer, PageHeader, EmptyState } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatBRL, formatDate, toISODate } from "@/lib/utils";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  MessageCircle,
  Phone,
  Receipt,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import type { Emprestimo, Venda } from "@/lib/types";
import { toast } from "sonner";

export default function ClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { db, addPagamento } = useStore();
  const cliente = db.clientes.find((c) => c.id === id);

  const [payOpen, setPayOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<{
    origem: "venda" | "emprestimo";
    refId: string;
    saldo: number;
    label: string;
  } | null>(null);
  const [payValor, setPayValor] = useState("");

  const vendas = useMemo(
    () =>
      db.vendas
        .filter((v) => v.clienteId === id && v.modalidade !== "avista")
        .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm)),
    [db.vendas, id]
  );
  const vendasAvista = useMemo(
    () =>
      db.vendas
        .filter((v) => v.clienteId === id && v.modalidade === "avista")
        .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm)),
    [db.vendas, id]
  );
  const emprestimos = useMemo(
    () =>
      db.emprestimos
        .filter((e) => e.clienteId === id)
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
    [db.emprestimos, id]
  );
  const pagamentos = useMemo(
    () =>
      db.pagamentos
        .filter((p) => p.clienteId === id)
        .sort((a, b) => b.data.localeCompare(a.data)),
    [db.pagamentos, id]
  );

  const saldoTotal = saldoCliente(id, db.vendas, db.emprestimos, db.pagamentos);

  if (!cliente) {
    return (
      <PageContainer>
        <EmptyState
          title="Cliente não encontrado"
          action={
            <Button onClick={() => router.push("/clientes")}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          }
        />
      </PageContainer>
    );
  }

  function abrirPagamento(opts: typeof payTarget) {
    setPayTarget(opts);
    setPayValor(opts ? String(opts.saldo.toFixed(2)) : "");
    setPayOpen(true);
  }

  function confirmarPagamento() {
    if (!payTarget) return;
    const v = Number(payValor.replace(",", "."));
    if (!v || v <= 0) return toast.error("Valor inválido");
    if (v > payTarget.saldo + 0.01)
      return toast.error("Valor maior que o saldo");

    addPagamento({
      clienteId: id,
      valor: +v.toFixed(2),
      data: new Date().toISOString(),
      origem: payTarget.origem,
      refId: payTarget.refId,
    });
    toast.success("Pagamento registrado!");
    setPayOpen(false);
    setPayTarget(null);
  }

  const msgCobranca = encodeURIComponent(
    `Olá ${cliente.nome}! Lembrete: você tem ${formatBRL(
      saldoTotal
    )} em aberto. Quando puder, vamos acertar? 🙏`
  );

  return (
    <PageContainer>
      <PageHeader
        title={cliente.nome}
        description={
          cliente.telefone ? (
            <span className="inline-flex items-center gap-1 font-mono text-sm">
              <Phone className="h-3 w-3" />
              {cliente.telefone}
            </span>
          ) : undefined
        }
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/clientes")}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            {cliente.telefone && saldoTotal > 0 && (
              <Button asChild>
                <a
                  href={`https://wa.me/${cliente.telefone.replace(
                    /\D/g,
                    ""
                  )}?text=${msgCobranca}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                  Cobrar
                </a>
              </Button>
            )}
          </>
        }
      />

      {/* Saldo total */}
      <Card className="mb-6 bg-gradient-to-br from-primary/10 to-secondary/20 border-primary/30">
        <CardContent className="p-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Total em aberto
            </p>
            <p className="text-3xl sm:text-4xl font-bold font-mono text-primary mt-1">
              {formatBRL(saldoTotal)}
            </p>
          </div>
          <Wallet className="h-10 w-10 text-primary/50" />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vendas em aberto */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Vendas
          </h2>
          <div className="space-y-2">
            {vendas.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Nenhuma venda fiada/crediário
                </CardContent>
              </Card>
            ) : (
              vendas.map((v) => (
                <VendaCard
                  key={v.id}
                  venda={v}
                  pago={pagoVenda(v, db.pagamentos)}
                  saldo={saldoVenda(v, db.pagamentos)}
                  onPagar={() =>
                    abrirPagamento({
                      origem: "venda",
                      refId: v.id,
                      saldo: saldoVenda(v, db.pagamentos),
                      label: `Venda ${formatDate(v.criadaEm)}`,
                    })
                  }
                />
              ))
            )}
          </div>
        </section>

        {/* Empréstimos */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            Empréstimos
          </h2>
          <div className="space-y-2">
            {emprestimos.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum empréstimo
                </CardContent>
              </Card>
            ) : (
              emprestimos.map((e) => (
                <EmprestimoCard
                  key={e.id}
                  emp={e}
                  pago={pagoEmprestimo(e, db.pagamentos)}
                  saldo={saldoEmprestimo(e, db.pagamentos)}
                  onPagar={() =>
                    abrirPagamento({
                      origem: "emprestimo",
                      refId: e.id,
                      saldo: saldoEmprestimo(e, db.pagamentos),
                      label: `Empréstimo ${formatDate(e.criadoEm)}`,
                    })
                  }
                />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Pagamentos + vendas avista */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Pagamentos
          </h2>
          {pagamentos.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Nenhum pagamento registrado
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {pagamentos.map((p) => (
                  <div key={p.id} className="flex justify-between p-3 sm:p-4">
                    <div>
                      <p className="text-sm font-medium capitalize">{p.origem}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {formatDate(p.data)}
                      </p>
                    </div>
                    <p className="font-mono font-semibold text-[color:var(--success)]">
                      + {formatBRL(p.valor)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Vendas à vista
          </h2>
          {vendasAvista.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Nenhuma venda à vista
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {vendasAvista.map((v) => (
                  <div key={v.id} className="flex justify-between p-3 sm:p-4">
                    <div>
                      <p className="text-sm font-medium">
                        {v.itens.length} item(s)
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {formatDate(v.criadaEm)}
                      </p>
                    </div>
                    <p className="font-mono font-semibold">{formatBRL(v.totalBruto)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      {/* Modal pagamento */}
      <Dialog
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Registrar pagamento"
        description={payTarget?.label}
      >
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saldo atual</span>
              <span className="font-mono font-semibold">
                {payTarget ? formatBRL(payTarget.saldo) : ""}
              </span>
            </div>
          </div>
          <div>
            <Label>Valor pago</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={payValor}
              onChange={(e) => setPayValor(e.target.value)}
              className="font-mono text-lg"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              Pode ser parcial. O saldo restante continua em aberto.
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarPagamento}>
              <CheckCircle2 className="h-4 w-4" />
              Confirmar
            </Button>
          </div>
        </div>
      </Dialog>
    </PageContainer>
  );
}

function VendaCard({
  venda,
  pago,
  saldo,
  onPagar,
}: {
  venda: Venda;
  pago: number;
  saldo: number;
  onPagar: () => void;
}) {
  const pct = venda.totalComJuros > 0 ? (pago / venda.totalComJuros) * 100 : 0;
  const hoje = toISODate(new Date());
  const venc = venda.vencimento;
  const atrasado = venc && venc < hoje && saldo > 0;
  const quitado = saldo <= 0;

  return (
    <Card className={quitado ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex justify-between mb-2">
          <div>
            <p className="text-xs text-muted-foreground">
              {formatDate(venda.criadaEm)} ·{" "}
              <span className="capitalize">{venda.modalidade}</span>
              {venda.itens.length > 0 && ` · ${venda.itens.length} item(s)`}
            </p>
          </div>
          {quitado ? (
            <Badge variant="success">Quitado</Badge>
          ) : atrasado ? (
            <Badge variant="destructive">Atrasado</Badge>
          ) : venc ? (
            <Badge variant="outline">{formatDate(venc)}</Badge>
          ) : null}
        </div>
        <div className="flex items-baseline justify-between mb-1.5 text-sm">
          <span className="font-mono">
            <span className="text-[color:var(--success)]">{formatBRL(pago)}</span>
            <span className="text-muted-foreground"> / </span>
            <span>{formatBRL(venda.totalComJuros)}</span>
          </span>
          <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
        </div>
        <Progress
          value={pct}
          color={quitado ? "success" : atrasado ? "destructive" : "primary"}
        />
        {!quitado && (
          <div className="flex justify-between items-center mt-3">
            <div>
              <p className="text-xs text-muted-foreground">Falta</p>
              <p className="font-mono font-bold text-primary">{formatBRL(saldo)}</p>
            </div>
            <Button size="sm" onClick={onPagar}>
              Receber pagamento
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmprestimoCard({
  emp,
  pago,
  saldo,
  onPagar,
}: {
  emp: Emprestimo;
  pago: number;
  saldo: number;
  onPagar: () => void;
}) {
  const pct = emp.totalComJuros > 0 ? (pago / emp.totalComJuros) * 100 : 0;
  const hoje = toISODate(new Date());
  const atrasado = emp.vencimento < hoje && saldo > 0;
  const quitado = saldo <= 0;

  return (
    <Card className={quitado ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex justify-between mb-2">
          <div>
            <p className="font-mono text-sm font-medium">
              {formatBRL(emp.valorPrincipal)} +{" "}
              <span className="text-primary">{emp.jurosPctDia}%/dia</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(emp.criadoEm)} · {emp.diasPrazo} dias
            </p>
          </div>
          {quitado ? (
            <Badge variant="success">Quitado</Badge>
          ) : atrasado ? (
            <Badge variant="destructive">Atrasado</Badge>
          ) : (
            <Badge variant="outline">{formatDate(emp.vencimento)}</Badge>
          )}
        </div>
        <div className="flex items-baseline justify-between mb-1.5 text-sm">
          <span className="font-mono">
            <span className="text-[color:var(--success)]">{formatBRL(pago)}</span>
            <span className="text-muted-foreground"> / </span>
            <span>{formatBRL(emp.totalComJuros)}</span>
          </span>
          <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
        </div>
        <Progress
          value={pct}
          color={quitado ? "success" : atrasado ? "destructive" : "primary"}
        />
        {!quitado && (
          <div className="flex justify-between items-center mt-3">
            <div>
              <p className="text-xs text-muted-foreground">Falta</p>
              <p className="font-mono font-bold text-primary">{formatBRL(saldo)}</p>
            </div>
            <Button size="sm" onClick={onPagar}>
              Receber pagamento
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
