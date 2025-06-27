import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    rollupOptions: {
      external: ['#minpath','#minproc','#minurl','#minwebsocket','#minbrowser'],
      output: {
        // Handle the 'use client' directive warnings
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          router: ['react-router-dom'],
          markdown: ['marked']
        }
      },
      onwarn(warning, warn) {
        // Suppress 'use client' directive warnings
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return
        }
        // Suppress all directive-related warnings
        if (warning.message && warning.message.includes('Module level directives cause errors when bundled')) {
          return
        }
        if (warning.message && warning.message.includes('use client')) {
          return
        }
        warn(warning)
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['marked'],
    exclude: ['#minpath','#minproc','#minurl','#minwebsocket','#minbrowser']
  },
  esbuild: {
    // Suppress warnings about directives
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
