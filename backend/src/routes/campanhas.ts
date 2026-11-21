import { Router } from 'express';
import { z } from 'zod';
import { autenticar, exigirPerfil } from '../auth';
import { query } from '../db';
import { HttpError } from '../errors';

export const campanhasRouter = Router();
campanhasRouter.use(autenticar);

// Datas viram texto (YYYY-MM-DD) no SQL para não sofrer com fuso horário no JSON.
const CAMPOS = `id, nome, descricao,
  data_inicio::text AS "dataInicio", data_fim::text AS "dataFim", ativa,
  local_coleta AS "localColeta", horario_coleta AS "horarioColeta",
  instrucoes_entrega AS "instrucoesEntrega"`;

// GET /api/v1/campanhas — doador vê só as ativas e dentro do período; operador vê todas.
campanhasRouter.get('/', async (req, res) => {
  const soAtivas = req.usuario!.perfil === 'DOADOR';
  const { rows } = await query(
    `SELECT ${CAMPOS}
       FROM campanha
      WHERE ($1::boolean = false OR (ativa = true AND CURRENT_DATE BETWEEN data_inicio AND data_fim))
      ORDER BY id DESC`,
    [soAtivas],
  );
  res.json(rows);
});

const base = z.object({
  nome: z.string().trim().min(2).max(120),
  descricao: z.string().trim().max(2000).optional(),
  dataInicio: z.iso.date(),
  dataFim: z.iso.date(),
  localColeta: z.string().trim().min(2).max(255),
  horarioColeta: z.string().trim().min(2).max(150),
  instrucoesEntrega: z.string().trim().max(2000).optional(),
});
const criarSchema = base.refine((d) => d.dataFim >= d.dataInicio, {
  message: 'A data final não pode ser anterior à inicial.',
  path: ['dataFim'],
});
const atualizarSchema = base.partial().extend({ ativa: z.boolean().optional() });

// POST /api/v1/campanhas — só operador
campanhasRouter.post('/', exigirPerfil('OPERADOR'), async (req, res) => {
  const d = criarSchema.parse(req.body);
  const { rows } = await query(
    `INSERT INTO campanha (nome, descricao, data_inicio, data_fim, local_coleta, horario_coleta, instrucoes_entrega)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${CAMPOS}`,
    [d.nome, d.descricao ?? null, d.dataInicio, d.dataFim, d.localColeta, d.horarioColeta, d.instrucoesEntrega ?? null],
  );
  res.status(201).json(rows[0]);
});

// Nomes das colunas vêm deste mapa fixo (nunca do que o usuário enviou), então o SQL dinâmico é seguro.
const COLUNAS = {
  nome: 'nome',
  descricao: 'descricao',
  dataInicio: 'data_inicio',
  dataFim: 'data_fim',
  localColeta: 'local_coleta',
  horarioColeta: 'horario_coleta',
  instrucoesEntrega: 'instrucoes_entrega',
  ativa: 'ativa',
} as const;

// PATCH /api/v1/campanhas/:id — só operador; envia só o que quer mudar
campanhasRouter.patch('/:id', exigirPerfil('OPERADOR'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(404, 'NAO_ENCONTRADO', 'Campanha não encontrada.');

  const dados = atualizarSchema.parse(req.body);
  const campos = Object.entries(dados).filter(([, v]) => v !== undefined);
  if (campos.length === 0) throw new HttpError(400, 'VALIDACAO', 'Envie ao menos um campo para atualizar.');

  const sets = campos.map(([k], i) => `${COLUNAS[k as keyof typeof COLUNAS]} = $${i + 1}`);
  const valores = campos.map(([, v]) => v);
  try {
    const { rows } = await query(
      `UPDATE campanha SET ${sets.join(', ')} WHERE id = $${campos.length + 1} RETURNING ${CAMPOS}`,
      [...valores, id],
    );
    if (!rows[0]) throw new HttpError(404, 'NAO_ENCONTRADO', 'Campanha não encontrada.');
    res.json(rows[0]);
  } catch (e) {
    // 23514 = violação de CHECK (data_fim anterior a data_inicio)
    if ((e as { code?: string }).code === '23514') {
      throw new HttpError(400, 'VALIDACAO', 'A data final não pode ser anterior à inicial.');
    }
    throw e;
  }
});
