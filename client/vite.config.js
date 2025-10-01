import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: ['es2015', 'safari11'], // iOS Safari compatibility
    outDir: 'dist',
    sourcemap: false,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // iOS Safari cache busting - use dynamic hash generation
        entryFileNames: () => {
          const timestamp = Date.now();
          return `assets/[name]-[hash]-${timestamp}.js`;
        },
        chunkFileNames: () => {
          const timestamp = Date.now();
          return `assets/[name]-[hash]-${timestamp}.js`;
        },
        assetFileNames: () => {
          const timestamp = Date.now();
          return `assets/[name]-[hash]-${timestamp}.[ext]`;
        },
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
