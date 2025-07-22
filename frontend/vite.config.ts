import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/uploads': 'http://127.0.0.1:5000',
      '/api': { 
        target: 'http://127.0.0.1:5000', // Your backend server port
        changeOrigin: true,
        secure: false
      }
    }
  }
})
