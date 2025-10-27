import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const serverPort = parseInt(env.PORT || '3000'); // Use same port for both frontend and backend
    
    return {
      server: {
        port: serverPort,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: `http://${env.BACKEND_HOST || 'localhost'}:${env.BACKEND_PORT || '5000'}`,
            changeOrigin: true,
            secure: false,
          },
          '/api-docs': {
            target: `http://${env.BACKEND_HOST || 'localhost'}:${env.BACKEND_PORT || '5000'}`,
            changeOrigin: true,
            secure: false,
          }
        },
      },
      build: {
        outDir: 'dist', // Ensure build output goes to dist folder
        sourcemap: false, // Disable sourcemaps for production build
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'], // Create vendor chunk for common libraries
            }
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
