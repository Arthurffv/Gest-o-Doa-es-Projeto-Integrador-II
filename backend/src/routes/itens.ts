import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import { autenticar, exigirPerfil } from '../auth';
import { config } from '../config';
import { query } from '../db';
import { HttpError } from '../errors';
import { assinaturaValida, removerFoto, upload } from '../upload';

export const itensRouter = Router();
itensRouter.use(autenticar);

// Item + dados da campanha (para o doador ver onde e quando entregar). Respostas em camelCase.
const SELECT_ITEM = `
  SELECT i.id, i.categoria, i.descricao, i.quantidade,
         i.estado_conservacao AS "estadoConservacao",
         i.data_validade::text AS "dataValidade",
         (i.foto_arquivo IS NOT NULL) AS "temFoto",
         i.status, i.motivo_recusa AS "motivoRecusa",
         i.criado_em AS "criadoEm", i.avaliado_em AS "avaliadoEm",
         c.id AS "campanhaId", c.nome AS "campanhaNome",
         c.local_coleta AS "localColeta", c.horario_coleta AS "horarioColeta",
         c.instrucoes_entrega AS "instrucoesEntrega",
         p.nome AS "parceiroNome"
    FROM item_doacao i
    JOIN campanha c ON c.id = i.campanha_id
    LEFT JOIN parceiro p ON p.id = i.parceiro_id`;

const hojeISO = () => new Date().toISOString().slice(0, 10);

const criarSchema = z
  .object({
    campanhaId: z.number().int().positive(),
    categoria: z.enum(['ROUPAS', 'ELETRONICOS', 'ALIMENTOS']),
    descricao: z.string().trim().min(2).max(300),
    quantidade: z.number().int().min(1).max(9999),
    estadoConservacao: z.enum(['NOVO', 'BOM', 'USADO', 'DEFEITUOSO']),
    dataValidade: z.iso.date().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.categoria === 'ALIMENTOS' && !d.dataValidade) {
      ctx.addIssue({ code: 'custom', path: ['dataValidade'], message: 'Alimentos exigem data de validade.' });
    }
    if (d.dataValidade && d.dataValidade < hojeISO()) {
      ctx.addIssue({ code: 'custom', path: ['dataValidade'], message: 'Item com validade vencida não pode ser doado.' });
    }
  });

const idDe = (req: Request): number => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(404, 'NAO_ENCONTRADO', 'Item não encontrado.');
  return id;
};

// Carrega o mínimo do item e já aplica a regra de acesso:
// doador só enxerga os próprios itens (de outro doador responde 404); operador enxerga todos.
async function carregarItemBasico(req: Request) {
  const id = idDe(req);
  const { rows } = await query(
    'SELECT id, doador_id AS "doadorId", status, foto_arquivo AS "fotoArquivo" FROM item_doacao WHERE id = $1',
    [id],
  );
  const item = rows[0];
  if (!item || (req.usuario!.perfil === 'DOADOR' && item.doadorId !== req.usuario!.id)) {
    throw new HttpError(404, 'NAO_ENCONTRADO', 'Item não encontrado.');
  }
  return item as { id: number; doadorId: number; status: string; fotoArquivo: string | null };
}

// POST /api/v1/itens — doador registra um item (RF02, US01)
itensRouter.post('/', exigirPerfil('DOADOR'), async (req, res) => {
  const d = criarSchema.parse(req.body);
  const campanha = await query(
    `SELECT 1 FROM campanha WHERE id = $1 AND ativa = true AND CURRENT_DATE BETWEEN data_inicio AND data_fim`,
    [d.campanhaId],
  );
  if (!campanha.rowCount) {
    throw new HttpError(400, 'CAMPANHA_INDISPONIVEL', 'Campanha inexistente, encerrada ou fora do período.');
  }
  const { rows } = await query(
    `INSERT INTO item_doacao (campanha_id, doador_id, categoria, descricao, quantidade, estado_conservacao, data_validade)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, status`,
    [d.campanhaId, req.usuario!.id, d.categoria, d.descricao, d.quantidade, d.estadoConservacao, d.dataValidade ?? null],
  );
  res.status(201).json({ ...rows[0], mensagem: 'Item enviado para pré-triagem' });
});

const paginaSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /api/v1/itens — ramo do DOADOR: só os seus itens, paginado (US02, RF06).
// Para OPERADOR chama next(): a listagem do operador é do pacote P4 (routes/triagem.ts).
itensRouter.get('/', async (req, res, next) => {
  if (req.usuario!.perfil !== 'DOADOR') return next();
  const { page, pageSize } = paginaSchema.parse(req.query);
  const total = await query('SELECT count(*)::int AS total FROM item_doacao WHERE doador_id = $1', [req.usuario!.id]);
  const { rows } = await query(
    `${SELECT_ITEM} WHERE i.doador_id = $1 ORDER BY i.id DESC LIMIT $2 OFFSET $3`,
    [req.usuario!.id, pageSize, (page - 1) * pageSize],
  );
  res.json({ data: rows, page, pageSize, total: total.rows[0].total });
});

// GET /api/v1/itens/:id — detalhe (dono ou operador)
itensRouter.get('/:id', async (req, res) => {
  const basico = await carregarItemBasico(req);
  const { rows } = await query(`${SELECT_ITEM} WHERE i.id = $1`, [basico.id]);
  const item = rows[0];
  if (req.usuario!.perfil === 'OPERADOR') {
    const doador = await query('SELECT nome FROM usuario WHERE id = $1', [basico.doadorId]);
    item.doadorNome = doador.rows[0]?.nome;
  }
  res.json(item);
});

// DELETE /api/v1/itens/:id — doador exclui item que ainda está PENDENTE
itensRouter.delete('/:id', exigirPerfil('DOADOR'), async (req, res) => {
  const item = await carregarItemBasico(req);
  if (item.status !== 'PENDENTE') {
    throw new HttpError(409, 'ITEM_NAO_PENDENTE', 'Só é possível excluir itens que ainda estão pendentes.');
  }
  const { rows } = await query(
    `DELETE FROM item_doacao WHERE id = $1 AND doador_id = $2 AND status = 'PENDENTE' RETURNING foto_arquivo`,
    [item.id, req.usuario!.id],
  );
  if (!rows[0]) throw new HttpError(409, 'ITEM_NAO_PENDENTE', 'O item mudou de situação. Atualize a página.');
  removerFoto(rows[0].foto_arquivo);
  res.status(204).end();
});

// Traduz os erros do multer para o formato padrão da API.
const receberFoto = (req: Request, res: Response, next: NextFunction) => {
  upload.single('foto')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      const tamanho = err.code === 'LIMIT_FILE_SIZE';
      return next(new HttpError(tamanho ? 413 : 400, tamanho ? 'ARQUIVO_GRANDE' : 'VALIDACAO',
        tamanho ? 'A foto deve ter no máximo 5 MB.' : 'Envie uma única foto no campo "foto".'));
    }
    next(err as Error | undefined);
  });
};

// POST /api/v1/itens/:id/foto — doador anexa foto (multipart, campo "foto") enquanto o item está PENDENTE (RF03)
itensRouter.post('/:id/foto', exigirPerfil('DOADOR'), receberFoto, async (req, res) => {
  const arquivo = req.file;
  if (!arquivo) throw new HttpError(400, 'VALIDACAO', 'Envie a foto no campo "foto".');
  try {
    const item = await carregarItemBasico(req);
    if (item.status !== 'PENDENTE') {
      throw new HttpError(409, 'ITEM_NAO_PENDENTE', 'A foto só pode ser alterada enquanto o item está pendente.');
    }
    if (!assinaturaValida(arquivo.path)) throw new HttpError(415, 'TIPO_INVALIDO', 'O arquivo não é uma foto JPEG ou PNG válida.');
    await query('UPDATE item_doacao SET foto_arquivo = $1, atualizado_em = now() WHERE id = $2', [arquivo.filename, item.id]);
    removerFoto(item.fotoArquivo); // apaga a foto anterior, se havia
    res.json({ temFoto: true });
  } catch (e) {
    removerFoto(arquivo.filename);
    throw e;
  }
});

// GET /api/v1/itens/:id/foto — baixa a foto (dono ou operador). Exige token, por isso o front usa fetch e não <img src>.
itensRouter.get('/:id/foto', async (req, res, next) => {
  const item = await carregarItemBasico(req);
  if (!item.fotoArquivo) throw new HttpError(404, 'NAO_ENCONTRADO', 'Este item não tem foto.');
  res.sendFile(item.fotoArquivo, { root: path.resolve(config.uploadDir) }, (err) => {
    if (err) next(new HttpError(404, 'NAO_ENCONTRADO', 'Foto não encontrada.'));
  });
});
