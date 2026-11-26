// Cliente da API. Guarda o token no sessionStorage e envia no cabeçalho Authorization.
const BASE = '/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.status = status;
  }
}

const lerToken = () => sessionStorage.getItem('token');

export function guardarToken(token: string | null) {
  if (token) sessionStorage.setItem('token', token);
  else sessionStorage.removeItem('token');
}

async function requisitar(caminho: string, init: RequestInit): Promise<Response> {
  const token = lerToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const resposta = await fetch(BASE + caminho, { ...init, headers });
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null);
    // Token vencido ou inválido: avisa o AuthContext para mandar o usuário ao login.
    if (resposta.status === 401 && token) {
      guardarToken(null);
      window.dispatchEvent(new Event('sessao-expirada'));
    }
    const detalhes = corpo?.erro?.detalhes as { campo: string; mensagem: string }[] | undefined;
    const mensagem = detalhes?.length
      ? detalhes.map((d) => (d.campo ? `${d.campo}: ${d.mensagem}` : d.mensagem)).join(' · ')
      : (corpo?.erro?.mensagem ?? 'Erro inesperado. Tente novamente.');
    throw new ApiError(resposta.status, mensagem);
  }
  return resposta;
}

// JSON de ida e volta. Respostas 204 (sem corpo) devolvem undefined.
export async function api<T>(caminho: string, opcoes: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  let body: string | undefined;
  if (opcoes.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opcoes.body);
  }
  const resposta = await requisitar(caminho, { method: opcoes.method ?? 'GET', headers, body });
  if (resposta.status === 204) return undefined as T;
  return (await resposta.json()) as T;
}

// Envio de arquivo (multipart). Não defina Content-Type: o navegador coloca o boundary sozinho.
export async function apiUpload<T>(caminho: string, formData: FormData): Promise<T> {
  const resposta = await requisitar(caminho, { method: 'POST', body: formData });
  return (await resposta.json()) as T;
}

// Baixa um arquivo que exige login (ex.: foto do item), porque <img src> não envia o token.
export async function apiBlob(caminho: string): Promise<Blob> {
  const resposta = await requisitar(caminho, {});
  return resposta.blob();
}
