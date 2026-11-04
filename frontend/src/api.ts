// Cliente simples da API. Guarda o token em memória/sessionStorage e envia no cabeçalho.
const BASE = '/api/v1';

export async function api<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('token');
  const resposta = await fetch(BASE + caminho, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opcoes.headers,
    },
  });
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) throw new Error(corpo?.erro?.mensagem ?? 'Erro inesperado.');
  return corpo as T;
}
