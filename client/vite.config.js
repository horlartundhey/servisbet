import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath, URL } from 'node:url'

// Plugin to add build timestamp for iOS Safari cache busting
const buildTimestampPlugin = () => ({
  name: 'build-timestamp',
  generateBundle() {
    const timestamp = Date.now()
    this.emitFile({
      type: 'asset',
      fileName: 'build-info.json',
      source: JSON.stringify({ buildTime: timestamp }, null, 2)
    })
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), buildTimestampPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: ['es2020', 'safari14'], // Modern iOS Safari compatibility
    outDir: 'dist',
    sourcemap: false,
    assetsDir: 'assets',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-slot', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        }
      }
    }
  },
  define: {
    global: 'globalThis', // iOS Safari global variable fix
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  }
})
