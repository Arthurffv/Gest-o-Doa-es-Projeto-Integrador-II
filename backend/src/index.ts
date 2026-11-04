import 'express-async-errors';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { config } from './config';
import { query } from './db';
import { HttpError, tratarErros } from './errors';
import { authRouter } from './routes/auth';
import { campanhasRouter } from './routes/campanhas';

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

fs.mkdirSync(config.uploadDir, { recursive: true });

// --- API ---
const api = express.Router();
api.get('/health', async (_req, res) => {
  await query('SELECT 1');
  res.json({ status: 'ok' });
});
api.use('/auth', authRouter);
api.use('/campanhas', campanhasRouter);
// TODO: api.use('/itens', itensRouter); api.use('/parceiros', ...); api.use('/relatorios', ...);
api.use((_req, _res) => { throw new HttpError(404, 'NAO_ENCONTRADO', 'Rota não encontrada.'); });
app.use('/api/v1', api);

// --- Front-end compilado (só existe no Docker / depois de "npm run build") ---
const publico = path.resolve(__dirname, '../public');
if (fs.existsSync(publico)) {
  app.use(express.static(publico));
  app.get('*', (_req, res) => res.sendFile(path.join(publico, 'index.html')));
}

app.use(tratarErros);
app.listen(config.port, () => console.log(`API no ar: http://localhost:${config.port}/api/v1/health`));
