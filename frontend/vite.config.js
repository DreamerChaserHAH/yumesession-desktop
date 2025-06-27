import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext', // Use 'esnext' to support top-level await and modern features
    rollupOptions: {
      external: ['#minpath','#minproc','#minurl','#minwebsocket','#minbrowser'],
    },
    // ...other build options...
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['react-markdown', 'remark-gfm']
  }
})
