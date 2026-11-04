import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { HttpError } from './errors';

export type Perfil = 'DOADOR' | 'OPERADOR';
export interface UsuarioToken { id: number; perfil: Perfil }

declare global {
  namespace Express {
    interface Request { usuario?: UsuarioToken }
  }
}

export const gerarToken = (u: UsuarioToken) =>
  jwt.sign({ id: u.id, perfil: u.perfil }, config.jwtSecret, { expiresIn: '8h' });

// Exige login. Preenche req.usuario com { id, perfil }.
export function autenticar(req: Request, _res: Response, next: NextFunction) {
  const cabecalho = req.headers.authorization;
  if (!cabecalho?.startsWith('Bearer ')) throw new HttpError(401, 'NAO_AUTENTICADO', 'Faça login para continuar.');
  try {
    const dados = jwt.verify(cabecalho.slice(7), config.jwtSecret) as UsuarioToken;
    req.usuario = { id: dados.id, perfil: dados.perfil };
    next();
  } catch {
    throw new HttpError(401, 'TOKEN_INVALIDO', 'Sessão inválida ou expirada.');
  }
}

// Exige um perfil específico (use depois de autenticar).
export const exigirPerfil = (perfil: Perfil) => (req: Request, _res: Response, next: NextFunction) => {
  if (req.usuario?.perfil !== perfil) throw new HttpError(403, 'SEM_PERMISSAO', 'Você não tem permissão para isso.');
  next();
};
