export type FrequenciaCobranca = "semanal" | "quinzenal" | "mensal" | "avulso";

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  frequencia: FrequenciaCobranca;
  diaCobranca?: number; // 0-6 (dom-sab) p/ semanal; 1-31 p/ mensal
  criadoEm: string;
}

export type Unidade = "kg" | "un";

export interface Produto {
  id: string;
  codigo: string;
  nome: string;
  preco: number;
  unidade: Unidade;
  criadoEm: string;
}

export interface VendaItem {
  produtoId: string;
  codigo: string;
  nome: string;
  quantidade: number;
  precoUnit: number;
  subtotal: number;
}

export type ModalidadeVenda = "avista" | "fiado" | "crediario";

export interface Venda {
  id: string;
  clienteId: string;
  itens: VendaItem[];
  totalBruto: number;
  modalidade: ModalidadeVenda;
  diasPrazo?: number; // p/ fiado/crediario
  jurosPctDia?: number; // p/ crediario
  totalComJuros: number;
  vencimento?: string;
  criadaEm: string;
}

export interface Emprestimo {
  id: string;
  clienteId: string;
  valorPrincipal: number;
  jurosPctDia: number;
  diasPrazo: number;
  totalComJuros: number;
  vencimento: string;
  criadoEm: string;
}

export type OrigemPagamento = "venda" | "emprestimo" | "avulso";

export interface Pagamento {
  id: string;
  clienteId: string;
  valor: number;
  data: string;
  origem: OrigemPagamento;
  refId?: string; // venda.id ou emprestimo.id
  observacao?: string;
}

export interface DBState {
  clientes: Cliente[];
  produtos: Produto[];
  vendas: Venda[];
  emprestimos: Emprestimo[];
  pagamentos: Pagamento[];
}
