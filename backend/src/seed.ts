import bcrypt from 'bcryptjs';
import { pool, query } from './db';

// Cria o operador inicial (RD07). Roda uma vez: npm run seed  (ou: docker compose exec app node dist/seed.js)
async function main() {
  const nome = process.env.OPERADOR_NOME ?? 'Operador Inicial';
  const email = (process.env.OPERADOR_EMAIL ?? '').toLowerCase();
  const senha = process.env.OPERADOR_SENHA ?? '';
  if (!email || senha.length < 8) throw new Error('Defina OPERADOR_EMAIL e OPERADOR_SENHA (mín. 8 caracteres) no .env');

  const hash = await bcrypt.hash(senha, 10);
  const r = await query(
    `INSERT INTO usuario (nome, email, senha_hash, perfil, aceitou_termos_em)
     VALUES ($1, $2, $3, 'OPERADOR', now()) ON CONFLICT (email) DO NOTHING`,
    [nome, email, hash],
  );
  console.log(r.rowCount ? `Operador criado: ${email}` : `Operador já existia: ${email}`);
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
