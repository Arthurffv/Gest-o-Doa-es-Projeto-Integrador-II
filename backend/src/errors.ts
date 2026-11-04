import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, public codigo: string, mensagem: string) {
    super(mensagem);
  }
}

// Formato padrão de erro da API: { erro: { codigo, mensagem, detalhes? } }
export function tratarErros(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      erro: {
        codigo: 'VALIDACAO',
        mensagem: 'Dados inválidos.',
        detalhes: err.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })),
      },
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ erro: { codigo: err.codigo, mensagem: err.message } });
  }
  console.error(err);
  return res.status(500).json({ erro: { codigo: 'ERRO_INTERNO', mensagem: 'Erro interno do servidor.' } });
}
