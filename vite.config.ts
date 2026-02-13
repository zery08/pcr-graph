import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const openaiBaseUrl = env.VITE_OPENAI_BASE_URL

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: openaiBaseUrl
        ? {
            '/api/openai': {
              target: openaiBaseUrl,
              changeOrigin: true,
              secure: false,
              rewrite: (proxyPath) => proxyPath.replace(/^\/api\/openai/, ''),
            },
          }
        : undefined,
    },
  }
})
