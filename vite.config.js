import { defineConfig } from 'vite';
export default defineConfig({
  root: 'site',
  base: './',
  publicDir: 'public',
  build: { outDir: '../docs', emptyOutDir: true, target: 'es2022' }
});