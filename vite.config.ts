import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/lessonss/' : '/',
  plugins: [react()],
  server: { port: 3000, host: '0.0.0.0' },
  preview: { port: 4173, host: '0.0.0.0' },
});
