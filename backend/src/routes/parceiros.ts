import { Router } from 'express';
import { z } from 'zod';
import { autenticar, exigirPerfil } from '../auth';
import { query } from '../db';

export const parceirosRouter = Router();
parceirosRouter.use(autenticar, exigirPerfil('OPERADOR'));

const parceiroSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  tipo: z.enum(['LABORATORIO_UFOP', 'POSTO_DESCARTE', 'ASSISTENCIA_TECNICA']),
  contato: z.string().trim().max(150).optional(),
});

// GET /api/v1/parceiros — lista (só operador)
parceirosRouter.get('/', async (_req, res) => {
  const { rows } = await query('SELECT id, nome, tipo, contato FROM parceiro ORDER BY nome');
  res.json(rows);
});

// POST /api/v1/parceiros — cadastra (só operador)
parceirosRouter.post('/', async (req, res) => {
  const d = parceiroSchema.parse(req.body);
  const { rows } = await query(
    'INSERT INTO parceiro (nome, tipo, contato) VALUES ($1, $2, $3) RETURNING id, nome, tipo, contato',
    [d.nome, d.tipo, d.contato ?? null],
  );
  res.status(201).json(rows[0]);
});
