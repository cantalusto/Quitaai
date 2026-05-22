"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore, saldoCliente } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { formatBRL } from "@/lib/utils";
import { Users, Plus, Search, Trash2, Edit3 } from "lucide-react";
import type { Cliente, FrequenciaCobranca } from "@/lib/types";
import { toast } from "sonner";

export default function ClientesPage() {
  const { db, addCliente, updateCliente, deleteCliente } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);

  const filtered = db.clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(q.toLowerCase()) ||
      c.telefone.includes(q)
  );

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(c: Cliente, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setEditing(c);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      nome: String(fd.get("nome") || "").trim(),
      telefone: String(fd.get("telefone") || "").replace(/\D/g, ""),
      frequencia: (fd.get("frequencia") || "semanal") as FrequenciaCobranca,
      diaCobranca: fd.get("diaCobranca") ? Number(fd.get("diaCobranca")) : undefined,
    };
    if (!data.nome) {
      toast.error("Informe o nome");
      return;
    }
    if (editing) {
      updateCliente(editing.id, data);
      toast.success("Cliente atualizado");
    } else {
      addCliente(data);
      toast.success("Cliente cadastrado");
    }
    setOpen(false);
  }

  function handleDelete(c: Cliente, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Excluir ${c.nome}?`)) {
      deleteCliente(c.id);
      toast.success("Cliente removido");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-8 py-6 lg:py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {db.clientes.length} cadastrado{db.clientes.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button size="icon" onClick={openNew} className="rounded-full h-11 w-11">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Busca */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          className="pl-11 h-12 rounded-2xl border-0 bg-card"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-card p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">
            {q ? "Ninguém encontrado" : "Nenhum cliente ainda"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            {q ? "Tente outro nome." : "Cadastre seu primeiro cliente."}
          </p>
          {!q && (
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              Novo cliente
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-3xl bg-card divide-y divide-border overflow-hidden">
          {filtered.map((c) => {
            const saldo = saldoCliente(c.id, db.vendas, db.emprestimos, db.pagamentos);
            const initials = c.nome
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")
              .toUpperCase();
            return (
              <Link
                key={c.id}
                href={`/clientes/${c.id}`}
                className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors group"
              >
                <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center font-semibold text-sm shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.nome}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {saldo > 0 ? (
                      <span className="text-primary font-mono font-semibold">
                        {formatBRL(saldo)} em aberto
                      </span>
                    ) : (
                      "Em dia"
                    )}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => openEdit(c, e)}
                    className="p-2 rounded-full hover:bg-muted"
                    aria-label="Editar"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(c, e)}
                    className="p-2 rounded-full hover:bg-destructive/10"
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar cliente" : "Novo cliente"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" defaultValue={editing?.nome} required autoFocus />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone (com DDD)</Label>
            <Input
              id="telefone"
              name="telefone"
              type="tel"
              placeholder="(11) 99999-9999"
              defaultValue={editing?.telefone}
              className="font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="frequencia">Frequência</Label>
              <Select id="frequencia" name="frequencia" defaultValue={editing?.frequencia || "semanal"}>
                <option value="semanal">Semanal</option>
                <option value="quinzenal">Quinzenal</option>
                <option value="mensal">Mensal</option>
                <option value="avulso">Avulso</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="diaCobranca">Dia cobrança</Label>
              <Input
                id="diaCobranca"
                name="diaCobranca"
                type="number"
                min={0}
                max={31}
                defaultValue={editing?.diaCobranca ?? ""}
                placeholder="Opcional"
              />
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
