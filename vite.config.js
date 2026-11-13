import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  esbuild: { jsx: 'automatic' },
  plugins: [tailwindcss()],
});
