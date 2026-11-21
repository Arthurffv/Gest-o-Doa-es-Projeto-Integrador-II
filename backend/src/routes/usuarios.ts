import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Router } from 'express';
import { autenticar, exigirPerfil } from '../auth';
import { pool, query } from '../db';
import { HttpError } from '../errors';
import { removerFoto } from '../upload';

export const usuariosRouter = Router();
usuariosRouter.use(autenticar);

// GET /api/v1/usuarios/me — dados de quem está logado
usuariosRouter.get('/me', async (req, res) => {
  const { rows } = await query('SELECT id, nome, email, perfil FROM usuario WHERE id = $1', [req.usuario!.id]);
  if (!rows[0]) throw new HttpError(401, 'TOKEN_INVALIDO', 'Sessão inválida ou expirada.');
  res.json(rows[0]);
});

// DELETE /api/v1/usuarios/me — direito de exclusão (LGPD): anonimiza a conta do doador.
// Os itens ficam (sem identificação) para não quebrar os relatórios; as fotos são apagadas.
usuariosRouter.delete('/me', exigirPerfil('DOADOR'), async (req, res) => {
  const id = req.usuario!.id;
  const senhaAleatoria = await bcrypt.hash(crypto.randomUUID(), 10);
  const client = await pool.connect();
  let fotos: string[] = [];
  try {
    await client.query('BEGIN');
    const r = await client.query(
      'SELECT foto_arquivo FROM item_doacao WHERE doador_id = $1 AND foto_arquivo IS NOT NULL',
      [id],
    );
    fotos = r.rows.map((l) => l.foto_arquivo as string);
    await client.query('UPDATE item_doacao SET foto_arquivo = NULL WHERE doador_id = $1', [id]);
    await client.query(
      `UPDATE usuario SET nome = 'Usuário removido', email = $2, senha_hash = $3 WHERE id = $1`,
      [id, `removido-${id}@invalid`, senhaAleatoria],
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  fotos.forEach(removerFoto);
  res.status(204).end();
});
