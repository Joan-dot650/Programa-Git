import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El proxy mantiene la sesión y CSRF en el mismo origen durante el desarrollo.
export default defineConfig({
  plugins: [react()],
  base: '/raizvolt/react/',
  server: {
    proxy: { '/raizvolt/api': 'http://127.0.0.1:8080' },
  },
});
