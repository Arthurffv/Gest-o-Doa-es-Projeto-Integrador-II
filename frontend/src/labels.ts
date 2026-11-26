import type { Categoria, EstadoConservacao, StatusItem, TipoParceiro } from './types';

export const ROTULO_CATEGORIA: Record<Categoria, string> = {
  ROUPAS: 'Roupas',
  ELETRONICOS: 'Eletrônicos',
  ALIMENTOS: 'Alimentos',
};
export const ROTULO_ESTADO: Record<EstadoConservacao, string> = {
  NOVO: 'Novo',
  BOM: 'Bom',
  USADO: 'Usado',
  DEFEITUOSO: 'Defeituoso',
};
export const ROTULO_STATUS: Record<StatusItem, string> = {
  PENDENTE: 'Pendente',
  APROVADO: 'Aprovado',
  RECUSADO: 'Recusado',
  ENCAMINHADO: 'Encaminhado',
  RECEBIDO: 'Recebido',
};
export const ROTULO_TIPO_PARCEIRO: Record<TipoParceiro, string> = {
  LABORATORIO_UFOP: 'Laboratório da UFOP',
  POSTO_DESCARTE: 'Posto de descarte',
  ASSISTENCIA_TECNICA: 'Assistência técnica',
};

// '2026-12-31' (ou '2026-12-31T00:00:00Z') -> '31/12/2026'
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}
