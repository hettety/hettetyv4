import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Make GEMINI_API_KEY (AI Studio convention) work in the browser build.
      // Without this, Vite replaces `process.env` with `{}` and the key is
      // silently undefined in production.
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? ''),
    },
    build: {
      rollupOptions: {
        output: {
          // NOTE: three.js is intentionally NOT listed here — putting it in
          // manualChunks makes Vite modulepreload it on first paint (~300KB
          // gzip). It is code-split naturally via the lazy Property3DViewer.
          manualChunks: {
            vendor: ['react', 'react-dom', 'framer-motion', 'lucide-react'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
            ai: ['@google/genai']
          }
        }
      }
    }
  };
});
