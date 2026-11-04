import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em desenvolvimento, chamadas para /api vão para o back-end (porta 3000).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3000' } },
});
