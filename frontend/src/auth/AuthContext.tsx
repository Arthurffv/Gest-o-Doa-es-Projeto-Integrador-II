import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, guardarToken } from '../api';
import type { Usuario } from '../types';

interface AuthCtx {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<Usuario>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>;
  sair: () => void;
  excluirConta: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  // Só "carrega" se existe um token guardado para validar.
  const [carregando, setCarregando] = useState(() => sessionStorage.getItem('token') !== null);

  // Ao abrir a página, confere o token guardado e recupera quem está logado.
  useEffect(() => {
    if (sessionStorage.getItem('token') === null) return;
    let ativo = true;
    api<Usuario>('/usuarios/me')
      .then((u) => { if (ativo) setUsuario(u); })
      .catch(() => guardarToken(null))
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  // A API respondeu 401 com token: a sessão acabou.
  useEffect(() => {
    const aoExpirar = () => setUsuario(null);
    window.addEventListener('sessao-expirada', aoExpirar);
    return () => window.removeEventListener('sessao-expirada', aoExpirar);
  }, []);

  const entrar = useCallback(async (email: string, senha: string) => {
    const r = await api<{ token: string; usuario: Usuario }>('/auth/login', { method: 'POST', body: { email, senha } });
    guardarToken(r.token);
    setUsuario(r.usuario);
    return r.usuario;
  }, []);

  const cadastrar = useCallback(async (nome: string, email: string, senha: string) => {
    await api('/auth/register', { method: 'POST', body: { nome, email, senha, aceitouTermos: true } });
    await entrar(email, senha);
  }, [entrar]);

  const sair = useCallback(() => {
    guardarToken(null);
    setUsuario(null);
  }, []);

  const excluirConta = useCallback(async () => {
    await api('/usuarios/me', { method: 'DELETE' });
    sair();
  }, [sair]);

  const valor = useMemo(
    () => ({ usuario, carregando, entrar, cadastrar, sair, excluirConta }),
    [usuario, carregando, entrar, cadastrar, sair, excluirConta],
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth precisa estar dentro do AuthProvider');
  return ctx;
}
