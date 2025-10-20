import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // 加载父级 conf-token 目录下的 .env（与前端同仓）
  const rootEnvDir = path.resolve(__dirname, '..')
  const env = loadEnv(mode, rootEnvDir, '')
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true
    },
    define: {
      // 将 NFTStorage-api 暴露给客户端代码
      'import.meta.env.NFTStorage_api': JSON.stringify(env['NFTStorage-api'] || env.VITE_NFT_STORAGE_KEY || ''),
    }
  }
})

