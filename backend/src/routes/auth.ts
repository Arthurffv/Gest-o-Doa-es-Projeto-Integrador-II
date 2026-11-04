import bcrypt from 'bcryptjs';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { gerarToken } from '../auth';
import { query } from '../db';
import { HttpError } from '../errors';

export const authRouter = Router();

const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: { codigo: 'MUITAS_TENTATIVAS', mensagem: 'Muitas tentativas. Tente novamente em alguns minutos.' } },
});

const cadastroSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  senha: z.string().min(8).max(100),
  aceitouTermos: z.literal(true, { message: 'É preciso aceitar os termos.' }),
});

// POST /api/v1/auth/register — cria sempre um DOADOR (RF01)
authRouter.post('/register', async (req, res) => {
  const dados = cadastroSchema.parse(req.body);
  const existente = await query('SELECT 1 FROM usuario WHERE email = $1', [dados.email]);
  if (existente.rowCount) throw new HttpError(409, 'EMAIL_EXISTENTE', 'Este e-mail já está cadastrado.');

  const senhaHash = await bcrypt.hash(dados.senha, 10);
  const { rows } = await query(
    `INSERT INTO usuario (nome, email, senha_hash, perfil, aceitou_termos_em)
     VALUES ($1, $2, $3, 'DOADOR', now())
     RETURNING id, nome, email, perfil`,
    [dados.nome, dados.email, senhaHash],
  );
  res.status(201).json(rows[0]);
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  senha: z.string().min(1),
});

// POST /api/v1/auth/login — devolve o JWT (8 h)
authRouter.post('/login', limitarLogin, async (req, res) => {
  const dados = loginSchema.parse(req.body);
  const { rows } = await query('SELECT id, nome, email, perfil, senha_hash FROM usuario WHERE email = $1', [dados.email]);
  const usuario = rows[0];
  const ok = usuario && (await bcrypt.compare(dados.senha, usuario.senha_hash));
  // Mensagem genérica de propósito: não revela se o e-mail existe.
  if (!ok) throw new HttpError(401, 'CREDENCIAIS_INVALIDAS', 'E-mail ou senha inválidos.');

  const token = gerarToken({ id: usuario.id, perfil: usuario.perfil });
  res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil } });
});
