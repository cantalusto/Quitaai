"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Cliente,
  DBState,
  Emprestimo,
  Pagamento,
  Produto,
  Venda,
} from "./types";
import { uid } from "./utils";

const STORAGE_KEY = "quita-ai-db-v1";

const initialState: DBState = {
  clientes: [],
  produtos: [],
  vendas: [],
  emprestimos: [],
  pagamentos: [],
};

const seed: DBState = {
  clientes: [
    {
      id: "C1",
      nome: "Tete Nazaré",
      telefone: "5511999999999",
      frequencia: "semanal",
      diaCobranca: 4, // quinta
      criadoEm: new Date().toISOString(),
    },
    {
      id: "C2",
      nome: "João da Esquina",
      telefone: "5511988888888",
      frequencia: "mensal",
      diaCobranca: 10,
      criadoEm: new Date().toISOString(),
    },
  ],
  produtos: [
    { id: "P1", codigo: "001", nome: "Filé de Peito", preco: 28, unidade: "kg", criadoEm: new Date().toISOString() },
    { id: "P2", codigo: "002", nome: "Coxa/Sobrecoxa", preco: 18, unidade: "kg", criadoEm: new Date().toISOString() },
    { id: "P3", codigo: "003", nome: "Picanha", preco: 89.9, unidade: "kg", criadoEm: new Date().toISOString() },
    { id: "P4", codigo: "004", nome: "Linguiça Toscana", preco: 24.5, unidade: "kg", criadoEm: new Date().toISOString() },
    { id: "P5", codigo: "099", nome: "Empréstimo em Dinheiro", preco: 1, unidade: "un", criadoEm: new Date().toISOString() },
  ],
  vendas: [],
  emprestimos: [],
  pagamentos: [],
};

interface StoreContextValue {
  db: DBState;
  ready: boolean;
  // Clientes
  addCliente: (data: Omit<Cliente, "id" | "criadoEm">) => Cliente;
  updateCliente: (id: string, data: Partial<Cliente>) => void;
  deleteCliente: (id: string) => void;
  // Produtos
  addProduto: (data: Omit<Produto, "id" | "criadoEm">) => Produto;
  updateProduto: (id: string, data: Partial<Produto>) => void;
  deleteProduto: (id: string) => void;
  // Vendas
  addVenda: (data: Omit<Venda, "id" | "criadaEm">) => Venda;
  // Empréstimos
  addEmprestimo: (data: Omit<Emprestimo, "id" | "criadoEm">) => Emprestimo;
  // Pagamentos
  addPagamento: (data: Omit<Pagamento, "id">) => Pagamento;
  // Util
  resetDB: () => void;
  loadSeed: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DBState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setDb(JSON.parse(raw));
      } else {
        setDb(seed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      }
    } catch (e) {
      console.warn("Falha ao carregar DB", e);
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: DBState) => {
    setDb(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn("Falha ao salvar DB", e);
    }
  }, []);

  const value = useMemo<StoreContextValue>(() => {
    const update = (mut: (s: DBState) => DBState) => {
      setDb((prev) => {
        const next = mut(prev);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    };

    return {
      db,
      ready,
      addCliente: (data) => {
        const c: Cliente = { ...data, id: uid(), criadoEm: new Date().toISOString() };
        update((s) => ({ ...s, clientes: [...s.clientes, c] }));
        return c;
      },
      updateCliente: (id, data) =>
        update((s) => ({
          ...s,
          clientes: s.clientes.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),
      deleteCliente: (id) =>
        update((s) => ({ ...s, clientes: s.clientes.filter((c) => c.id !== id) })),
      addProduto: (data) => {
        const p: Produto = { ...data, id: uid(), criadoEm: new Date().toISOString() };
        update((s) => ({ ...s, produtos: [...s.produtos, p] }));
        return p;
      },
      updateProduto: (id, data) =>
        update((s) => ({
          ...s,
          produtos: s.produtos.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deleteProduto: (id) =>
        update((s) => ({ ...s, produtos: s.produtos.filter((p) => p.id !== id) })),
      addVenda: (data) => {
        const v: Venda = { ...data, id: uid(), criadaEm: new Date().toISOString() };
        update((s) => ({ ...s, vendas: [...s.vendas, v] }));
        return v;
      },
      addEmprestimo: (data) => {
        const e: Emprestimo = { ...data, id: uid(), criadoEm: new Date().toISOString() };
        update((s) => ({ ...s, emprestimos: [...s.emprestimos, e] }));
        return e;
      },
      addPagamento: (data) => {
        const p: Pagamento = { ...data, id: uid() };
        update((s) => ({ ...s, pagamentos: [...s.pagamentos, p] }));
        return p;
      },
      resetDB: () => persist(initialState),
      loadSeed: () => persist(seed),
    };
  }, [db, ready, persist]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

// === Helpers derivados ===

export function saldoVenda(venda: Venda, pagamentos: Pagamento[]): number {
  const pago = pagamentos
    .filter((p) => p.origem === "venda" && p.refId === venda.id)
    .reduce((acc, p) => acc + p.valor, 0);
  return Math.max(0, venda.totalComJuros - pago);
}

export function pagoVenda(venda: Venda, pagamentos: Pagamento[]): number {
  return pagamentos
    .filter((p) => p.origem === "venda" && p.refId === venda.id)
    .reduce((acc, p) => acc + p.valor, 0);
}

export function saldoEmprestimo(emp: Emprestimo, pagamentos: Pagamento[]): number {
  const pago = pagamentos
    .filter((p) => p.origem === "emprestimo" && p.refId === emp.id)
    .reduce((acc, p) => acc + p.valor, 0);
  return Math.max(0, emp.totalComJuros - pago);
}

export function pagoEmprestimo(emp: Emprestimo, pagamentos: Pagamento[]): number {
  return pagamentos
    .filter((p) => p.origem === "emprestimo" && p.refId === emp.id)
    .reduce((acc, p) => acc + p.valor, 0);
}

export function saldoCliente(
  clienteId: string,
  vendas: Venda[],
  emprestimos: Emprestimo[],
  pagamentos: Pagamento[]
): number {
  const vTotal = vendas
    .filter((v) => v.clienteId === clienteId && v.modalidade !== "avista")
    .reduce((acc, v) => acc + saldoVenda(v, pagamentos), 0);
  const eTotal = emprestimos
    .filter((e) => e.clienteId === clienteId)
    .reduce((acc, e) => acc + saldoEmprestimo(e, pagamentos), 0);
  return vTotal + eTotal;
}
