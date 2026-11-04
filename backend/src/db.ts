import { Pool } from 'pg';
import { config } from './config';

export const pool = new Pool({ connectionString: config.databaseUrl });

// Sempre use parâmetros ($1, $2...) — nunca concatene valores do usuário no SQL.
export const query = (texto: string, params: unknown[] = []) => pool.query(texto, params);
