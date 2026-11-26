export type Perfil = 'DOADOR' | 'OPERADOR';
export interface Usuario { id: number; nome: string; email: string; perfil: Perfil }

export interface Campanha {
  id: number;
  nome: string;
  descricao: string | null;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string;
  ativa: boolean;
  localColeta: string;
  horarioColeta: string;
  instrucoesEntrega: string | null;
}

export type Categoria = 'ROUPAS' | 'ELETRONICOS' | 'ALIMENTOS';
export type EstadoConservacao = 'NOVO' | 'BOM' | 'USADO' | 'DEFEITUOSO';
export type StatusItem = 'PENDENTE' | 'APROVADO' | 'RECUSADO' | 'ENCAMINHADO' | 'RECEBIDO';

export interface Item {
  id: number;
  categoria: Categoria;
  descricao: string;
  quantidade: number;
  estadoConservacao: EstadoConservacao;
  dataValidade: string | null;
  temFoto: boolean;
  status: StatusItem;
  motivoRecusa: string | null;
  criadoEm: string;
  avaliadoEm: string | null;
  campanhaId: number;
  campanhaNome: string;
  localColeta: string;
  horarioColeta: string;
  instrucoesEntrega: string | null;
  parceiroNome: string | null;
  doadorNome?: string; // só aparece para o operador
}

export type TipoParceiro = 'LABORATORIO_UFOP' | 'POSTO_DESCARTE' | 'ASSISTENCIA_TECNICA';
export interface Parceiro { id: number; nome: string; tipo: TipoParceiro; contato: string | null }

export interface Pagina<T> { data: T[]; page: number; pageSize: number; total: number }
