import dotenv from 'dotenv';
import path from 'path';

// Em desenvolvimento lê o .env da raiz do repositório; no Docker as variáveis já vêm do compose.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function obrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Variável de ambiente ausente: ${nome} (veja o .env.example)`);
  return valor;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: obrigatoria('DATABASE_URL'),
  jwtSecret: obrigatoria('JWT_SECRET'),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR ?? path.resolve(__dirname, '../uploads'),
};
