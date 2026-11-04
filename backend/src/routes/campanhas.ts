import { Router } from 'express';
import { autenticar } from '../auth';
import { query } from '../db';

export const campanhasRouter = Router();
campanhasRouter.use(autenticar);

// GET /api/v1/campanhas — doador vê só as ativas; operador vê todas.
// Use este arquivo como MODELO para as demais rotas (itens, parceiros, relatório).
campanhasRouter.get('/', async (req, res) => {
  const soAtivas = req.usuario!.perfil === 'DOADOR';
  const { rows } = await query(
    `SELECT id, nome, descricao, data_inicio, data_fim, ativa, local_coleta, horario_coleta, instrucoes_entrega
       FROM campanha
      WHERE ($1::boolean = false OR (ativa = true AND CURRENT_DATE BETWEEN data_inicio AND data_fim))
      ORDER BY id DESC`,
    [soAtivas],
  );
  res.json(rows);
});

// TODO (B03): POST / e PATCH /:id  (só OPERADOR — use exigirPerfil('OPERADOR'))
