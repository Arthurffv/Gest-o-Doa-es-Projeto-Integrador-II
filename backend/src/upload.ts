import crypto from 'crypto';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { config } from './config';
import { HttpError } from './errors';

// Fotos: só JPEG/PNG, até 5 MB, salvas com nome gerado (UUID) na pasta uploads.
export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, config.uploadDir),
    filename: (_req, file, cb) => cb(null, crypto.randomUUID() + (file.mimetype === 'image/png' ? '.png' : '.jpg')),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) cb(null, true);
    else cb(new HttpError(415, 'TIPO_INVALIDO', 'Envie uma foto JPEG ou PNG.'));
  },
});

// O tipo informado pelo navegador pode ser falso; confere os primeiros bytes do arquivo.
export function assinaturaValida(caminho: string): boolean {
  const buf = Buffer.alloc(8);
  const fd = fs.openSync(caminho, 'r');
  try {
    fs.readSync(fd, buf, 0, 8, 0);
  } finally {
    fs.closeSync(fd);
  }
  const jpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return jpeg || png;
}

// Apaga um arquivo da pasta uploads sem derrubar a requisição se ele não existir.
export function removerFoto(nome: string | null | undefined) {
  if (!nome) return;
  fs.unlink(path.join(config.uploadDir, nome), () => {});
}
