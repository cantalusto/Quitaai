"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { formatBRL } from "@/lib/utils";
import { Package, Plus, Search, Trash2, Edit3 } from "lucide-react";
import type { Produto, Unidade } from "@/lib/types";
import { toast } from "sonner";

export default function ProdutosPage() {
  const { db, addProduto, updateProduto, deleteProduto } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);

  const filtered = db.produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(q.toLowerCase()) ||
      p.codigo.includes(q)
  );

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(p: Produto) {
    setEditing(p);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      codigo: String(fd.get("codigo") || "").trim(),
      nome: String(fd.get("nome") || "").trim(),
      preco: Number(String(fd.get("preco") || "0").replace(",", ".")),
      unidade: (fd.get("unidade") || "kg") as Unidade,
    };
    if (!data.codigo || !data.nome) {
      toast.error("Código e nome são obrigatórios");
      return;
    }
    if (data.preco <= 0) {
      toast.error("Preço inválido");
      return;
    }
    const dup = db.produtos.find(
      (p) => p.codigo === data.codigo && p.id !== editing?.id
    );
    if (dup) {
      toast.error("Já existe produto com esse código");
      return;
    }
    if (editing) {
      updateProduto(editing.id, data);
      toast.success("Produto atualizado");
    } else {
      addProduto(data);
      toast.success("Produto cadastrado");
    }
    setOpen(false);
  }

  function handleDelete(p: Produto) {
    if (confirm(`Excluir ${p.nome}?`)) {
      deleteProduto(p.id);
      toast.success("Produto removido");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-8 py-6 lg:py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {db.produtos.length} cadastrado{db.produtos.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button size="icon" onClick={openNew} className="rounded-full h-11 w-11">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produto ou código..."
          className="pl-11 h-12 rounded-2xl border-0 bg-card"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-card p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Package className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">
            {q ? "Nenhum produto encontrado" : "Nenhum produto"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            {q ? "Tente outro termo." : "Cadastre seus produtos pra usar no PDV."}
          </p>
          {!q && (
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              Novo produto
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-3xl bg-card divide-y divide-border overflow-hidden">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors group"
            >
              <div className="w-11 h-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-mono font-bold text-sm shrink-0">
                {p.codigo}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.nome}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  por {p.unidade === "kg" ? "kg" : "unidade"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold">{formatBRL(p.preco)}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(p)}
                  className="p-2 rounded-full hover:bg-muted"
                  aria-label="Editar"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  className="p-2 rounded-full hover:bg-destructive/10"
                  aria-label="Excluir"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar produto" : "Novo produto"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                name="codigo"
                defaultValue={editing?.codigo}
                placeholder="001"
                className="font-mono"
                required
                autoFocus
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                name="nome"
                defaultValue={editing?.nome}
                placeholder="Filé de Peito"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="preco">Preço</Label>
              <Input
                id="preco"
                name="preco"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editing?.preco}
                placeholder="0,00"
                className="font-mono"
                required
              />
            </div>
            <div>
              <Label htmlFor="unidade">Unidade</Label>
              <Select id="unidade" name="unidade" defaultValue={editing?.unidade || "kg"}>
                <option value="kg">Por kg</option>
                <option value="un">Por unidade</option>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{editing ? "Salvar" : "Cadastrar"}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
