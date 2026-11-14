import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? './' : '/',
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
}))
