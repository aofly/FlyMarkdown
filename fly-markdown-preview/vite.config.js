import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('@codemirror')) {
            return 'codemirror';
          } else if (id.includes('marked') || id.includes('dompurify') || id.includes('highlight.js')) {
            return 'markdown';
          } else if (id.includes('mermaid') || id.includes('echarts')) {
            return 'charts';
          } else if (id.includes('katex')) {
            return 'math';
          } else if (id.includes('react') || id.includes('react-dom')) {
            return 'vendor';
          }
        }
      }
    }
  }
})
