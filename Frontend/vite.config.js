import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/signup': 'http://localhost:5000',
      '/login': 'http://localhost:5000',
      '/logout': 'http://localhost:5000',
      '/search': 'http://localhost:5000',
      '/api': 'http://localhost:5000',
    },
    historyApiFallback: true
  }
})
