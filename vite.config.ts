import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      preview: {
        allowedHosts: [
          'shark-app-ohcb2.ondigitalocean.app',
          '.ondigitalocean.app', // Allow all Digital Ocean app domains
          'localhost',
          '127.0.0.1'
        ],
        host: true,
        port: 8080
      },
      server: {
        host: true,
        port: 5173
      }
    };
});
