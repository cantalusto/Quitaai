"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PageContainer, PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { addDays, formatBRL, formatDate, toISODate } from "@/lib/utils";
import {
  Plus,
  Trash2,
  ShoppingCart,
  MessageCircle,
  Check,
  Copy,
  User,
  Calendar,
  Percent,
} from "lucide-react";
import type { ModalidadeVenda, VendaItem } from "@/lib/types";
import { toast } from "sonner";

type CartItem = VendaItem & { uid: string };

export default function NovaVendaPage() {
  const router = useRouter();
  const { db, addVenda } = useStore();

  const [clienteId, setClienteId] = useState<string>("");
  const [codigo, setCodigo] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modalidade, setModalidade] = useState<ModalidadeVenda>("fiado");
  const [diasPrazo, setDiasPrazo] = useState("7");
  const [jurosPctDia, setJurosPctDia] = useState("1");

  const [showFinalize, setShowFinalize] = useState(false);
  const [resumo, setResumo] = useState<string>("");
  const [vendaFinalizada, setVendaFinalizada] = useState(false);

  const totalBruto = useMemo(
    () => cart.reduce((acc, i) => acc + i.subtotal, 0),
    [cart]
  );

  const jurosTotal =
    modalidade === "crediario"
      ? totalBruto * (Number(jurosPctDia) / 100) * Number(diasPrazo)
      : 0;
  const totalComJuros = totalBruto + jurosTotal;
  const dias = Number(diasPrazo) || 0;
  const vencimento =
    modalidade !== "avista" ? toISODate(addDays(new Date(), dias)) : undefined;

  const cliente = db.clientes.find((c) => c.id === clienteId);

  function addItem() {
    const prod = db.produtos.find((p) => p.codigo === codigo.trim());
    if (!prod) {
      toast.error(`Produto com código "${codigo}" não encontrado`);
      return;
    }
    const qtd = Number(quantidade.replace(",", "."));
    if (!qtd || qtd <= 0) {
      toast.error("Informe o peso/quantidade");
      return;
    }
    const subtotal = +(prod.preco * qtd).toFixed(2);
    setCart((c) => [
      ...c,
      {
        uid: Math.random().toString(36).slice(2),
        produtoId: prod.id,
        codigo: prod.codigo,
        nome: prod.nome,
        quantidade: qtd,
        precoUnit: prod.preco,
        subtotal,
      },
    ]);
    setCodigo("");
    setQuantidade("");
  }

  function removeItem(uid: string) {
    setCart((c) => c.filter((i) => i.uid !== uid));
  }

  function finalizar() {
    if (!clienteId) {
      toast.error("Selecione um cliente");
      return;
    }
    if (cart.length === 0) {
      toast.error("Adicione pelo menos um item");
      return;
    }
    setShowFinalize(true);
  }

  function confirmarVenda() {
    const venda = addVenda({
      clienteId,
      itens: cart.map(({ uid, ...i }) => i),
      totalBruto,
      modalidade,
      diasPrazo: modalidade !== "avista" ? dias : undefined,
      jurosPctDia: modalidade === "crediario" ? Number(jurosPctDia) : undefined,
      totalComJuros,
      vencimento,
    });
    setResumo(gerarResumo(venda.id));
    setVendaFinalizada(true);
    toast.success("Venda registrada!");
  }

  function gerarResumo(_vendaId: string): string {
    const linhas: string[] = [];
    linhas.push(`*Quita.ai* — Comprovante de Venda`);
    linhas.push(`━━━━━━━━━━━━━━━━━━━━━━`);
    linhas.push(`👤 *Cliente:* ${cliente?.nome ?? ""}`);
    linhas.push(`📅 *Data:* ${formatDate(new Date())}`);
    linhas.push("");
    linhas.push(`🛒 *Itens:*`);
    cart.forEach((i) => {
      const qtdStr =
        i.precoUnit && i.subtotal
          ? `${i.quantidade.toLocaleString("pt-BR")} ${
              i.codigo ? "" : ""
            }× ${formatBRL(i.precoUnit)}`
          : "";
      linhas.push(`• ${i.nome} — ${qtdStr} = ${formatBRL(i.subtotal)}`);
    });
    linhas.push("");

    if (modalidade === "avista") {
      linhas.push(`💵 *Total pago:* ${formatBRL(totalBruto)}`);
      linhas.push(`✅ Pagamento à vista`);
    } else if (modalidade === "fiado") {
      linhas.push(`💵 *A pagar:* ${formatBRL(totalBruto)}`);
      linhas.push(`📅 *Vencimento:* ${formatDate(vencimento!)}`);
    } else {
      linhas.push(`💵 *Valor da compra:* ${formatBRL(totalBruto)}`);
      linhas.push(`📈 *Juros:* ${jurosPctDia}%/dia × ${dias} dias = ${formatBRL(jurosTotal)}`);
      linhas.push(`📅 *Vence em:* ${formatDate(vencimento!)}`);
      linhas.push(`💰 *Total a pagar:* ${formatBRL(totalComJuros)}`);
    }

    linhas.push(`━━━━━━━━━━━━━━━━━━━━━━`);
    linhas.push(`Obrigado pela preferência! 🙏`);
    return linhas.join("\n");
  }

  function copiarResumo() {
    navigator.clipboard.writeText(resumo);
    toast.success("Resumo copiado!");
  }

  const waLink = cliente?.telefone
    ? `https://wa.me/${cliente.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(
        resumo
      )}`
    : "";

  function novaVenda() {
    setCart([]);
    setClienteId("");
    setShowFinalize(false);
    setVendaFinalizada(false);
    setResumo("");
  }

  return (
    <PageContainer>
      <PageHeader
        title="Nova Venda"
        description="Selecione cliente, adicione itens por código e finalize."
      />

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Esquerda: cliente + adicionar itens + carrinho */}
        <div className="space-y-4">
          {/* Cliente */}
          <Card>
            <CardContent className="p-4">
              <Label>
                <User className="inline h-4 w-4 mr-1" />
                Cliente
              </Label>
              <Select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
              >
                <option value="">— Selecione um cliente —</option>
                {db.clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
              {db.clientes.length === 0 && (
                <p className="text-xs text-destructive mt-2">
                  Cadastre clientes na aba Clientes primeiro.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Adicionar item */}
          <Card>
            <CardContent className="p-4">
              <Label>Adicionar produto</Label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addItem();
                }}
                className="grid grid-cols-[1fr_1fr_auto] gap-2"
              >
                <div>
                  <Input
                    placeholder="Código"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="Peso / Qtd"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <Button type="submit" size="default">
                  <Plus className="h-4 w-4" />
                </Button>
              </form>
              {codigo && (() => {
                const p = db.produtos.find((p) => p.codigo === codigo.trim());
                if (!p) return null;
                return (
                  <p className="text-xs text-muted-foreground mt-2">
                    → <span className="font-medium text-foreground">{p.nome}</span> ·{" "}
                    <span className="font-mono">{formatBRL(p.preco)}/{p.unidade}</span>
                  </p>
                );
              })()}
            </CardContent>
          </Card>

          {/* Carrinho */}
          <Card>
            <CardContent className="p-0">
              {cart.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Nenhum item adicionado ainda
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {cart.map((i) => (
                    <div
                      key={i.uid}
                      className="flex items-center gap-3 p-3 sm:p-4"
                    >
                      <Badge variant="default" className="font-mono shrink-0">
                        {i.codigo}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{i.nome}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {i.quantidade.toLocaleString("pt-BR")} × {formatBRL(i.precoUnit)}
                        </p>
                      </div>
                      <p className="font-mono font-semibold">
                        {formatBRL(i.subtotal)}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(i.uid)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Direita: resumo + finalizar */}
        <Card className="lg:sticky lg:top-6 h-fit">
          <CardContent className="p-5 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Total da compra</p>
              <p className="text-3xl font-bold font-mono text-primary">
                {formatBRL(totalBruto)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {cart.length} item(s)
              </p>
            </div>

            <div>
              <Label>Forma de pagamento</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["avista", "fiado", "crediario"] as ModalidadeVenda[]).map(
                  (m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModalidade(m)}
                      className={`px-2 py-2 text-xs font-medium rounded-lg border transition-all ${
                        modalidade === m
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {m === "avista"
                        ? "À vista"
                        : m === "fiado"
                        ? "Fiado"
                        : "Crediário"}
                    </button>
                  )
                )}
              </div>
            </div>

            {modalidade !== "avista" && (
              <div>
                <Label>
                  <Calendar className="inline h-3.5 w-3.5 mr-1" />
                  Prazo (dias)
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={diasPrazo}
                  onChange={(e) => setDiasPrazo(e.target.value)}
                  className="font-mono"
                />
                {vencimento && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Vence em <span className="font-mono">{formatDate(vencimento)}</span>
                  </p>
                )}
              </div>
            )}

            {modalidade === "crediario" && (
              <div>
                <Label>
                  <Percent className="inline h-3.5 w-3.5 mr-1" />
                  Juros (% ao dia)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={jurosPctDia}
                  onChange={(e) => setJurosPctDia(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Padrão sugerido: 1%/dia (editável)
                </p>
              </div>
            )}

            {modalidade === "crediario" && totalBruto > 0 && (
              <div className="bg-muted rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">{formatBRL(totalBruto)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">+ Juros ({dias}d × {jurosPctDia}%)</span>
                  <span className="font-mono">{formatBRL(jurosTotal)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border">
                  <span className="font-semibold">Total c/ juros</span>
                  <span className="font-mono font-bold text-primary">
                    {formatBRL(totalComJuros)}
                  </span>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={finalizar}
              disabled={cart.length === 0 || !clienteId}
            >
              <ShoppingCart className="h-5 w-5" />
              Finalizar venda
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal Finalizar */}
      <Dialog
        open={showFinalize}
        onClose={() => !vendaFinalizada && setShowFinalize(false)}
        title={vendaFinalizada ? "Venda registrada ✓" : "Confirmar venda"}
      >
        {!vendaFinalizada ? (
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium">{cliente?.nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Itens</span>
                <span>{cart.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modalidade</span>
                <span className="capitalize">{modalidade}</span>
              </div>
              {vencimento && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vencimento</span>
                  <span className="font-mono">{formatDate(vencimento)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-semibold">Total a pagar</span>
                <span className="font-mono font-bold text-primary">
                  {formatBRL(totalComJuros)}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowFinalize(false)} className="flex-1">
                Voltar
              </Button>
              <Button onClick={confirmarVenda} className="flex-1">
                <Check className="h-4 w-4" />
                Confirmar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <pre className="bg-muted rounded-lg p-4 text-xs font-mono whitespace-pre-wrap max-h-72 overflow-y-auto">
              {resumo}
            </pre>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={copiarResumo}>
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
              {waLink ? (
                <Button asChild>
                  <a href={waLink} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    Enviar WhatsApp
                  </a>
                </Button>
              ) : (
                <Button disabled title="Cliente sem telefone">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              )}
            </div>
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={novaVenda} className="flex-1">
                Nova venda
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push(`/clientes/${clienteId}`)}
                className="flex-1"
              >
                Ver cliente
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </PageContainer>
  );
}
