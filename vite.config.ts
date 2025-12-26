import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load các biến môi trường (bao gồm cả API_KEY)
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    // Thay thế chuỗi 'process.env.API_KEY' bằng giá trị thực khi build
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});