"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PageContainer, PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { addDays, formatBRL, formatDate, toISODate } from "@/lib/utils";
import { Banknote, Check } from "lucide-react";
import { toast } from "sonner";

export default function NovoEmprestimoPage() {
  const router = useRouter();
  const { db, addEmprestimo } = useStore();
  const [clienteId, setClienteId] = useState("");
  const [valor, setValor] = useState("");
  const [dias, setDias] = useState("30");
  const [juros, setJuros] = useState("1");

  const valorNum = Number(valor.replace(",", ".")) || 0;
  const diasNum = Number(dias) || 0;
  const jurosNum = Number(juros) || 0;
  const jurosTotal = +(valorNum * (jurosNum / 100) * diasNum).toFixed(2);
  const total = +(valorNum + jurosTotal).toFixed(2);
  const venc = toISODate(addDays(new Date(), diasNum));
  const cliente = db.clientes.find((c) => c.id === clienteId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId) return toast.error("Selecione um cliente");
    if (valorNum <= 0) return toast.error("Informe o valor");
    if (diasNum <= 0) return toast.error("Informe o prazo");

    addEmprestimo({
      clienteId,
      valorPrincipal: valorNum,
      jurosPctDia: jurosNum,
      diasPrazo: diasNum,
      totalComJuros: total,
      vencimento: venc,
    });
    toast.success("Empréstimo registrado!");
    router.push(`/clientes/${clienteId}`);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Novo Empréstimo"
        description="Registre um empréstimo em dinheiro com juros e prazo."
      />

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <Card>
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Cliente</Label>
                <Select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                  <option value="">— Selecione —</option>
                  {db.clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Valor emprestado (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="100,00"
                  className="font-mono text-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Prazo (dias)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={dias}
                    onChange={(e) => setDias(e.target.value)}
                    className="font-mono"
                    required
                  />
                </div>
                <div>
                  <Label>Juros (% ao dia)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={juros}
                    onChange={(e) => setJuros(e.target.value)}
                    className="font-mono"
                    required
                  />
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full">
                <Check className="h-5 w-5" />
                Registrar empréstimo
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit lg:sticky lg:top-6">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Banknote className="h-5 w-5 text-primary" />
              <span className="font-semibold">Simulação</span>
            </div>
            {cliente && (
              <p className="text-sm">
                <span className="text-muted-foreground">Cliente:</span>{" "}
                <span className="font-medium">{cliente.nome}</span>
              </p>
            )}
            <div className="space-y-1.5 text-sm">
              <Row label="Principal" value={formatBRL(valorNum)} />
              <Row
                label={`Juros (${jurosNum}%/dia × ${diasNum} dias)`}
                value={formatBRL(jurosTotal)}
              />
              <Row
                label="Total a receber"
                value={formatBRL(total)}
                highlight
              />
              <Row
                label="Vencimento"
                value={diasNum > 0 ? formatDate(venc) : "—"}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex justify-between py-1.5 ${
        highlight ? "border-t border-border pt-2 mt-1" : ""
      }`}
    >
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className={`font-mono ${
          highlight ? "font-bold text-primary text-base" : "font-medium"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
