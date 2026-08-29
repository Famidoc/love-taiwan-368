import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/love-taiwan-368/',
  server: {
    port: 3368,
    strictPort: false,
    open: true
  }
});
