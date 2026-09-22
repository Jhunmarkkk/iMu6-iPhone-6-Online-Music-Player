import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['iOS >= 9', 'Safari >= 9'],
      modernPolyfills: true,
      renderModernChunks: true
    })
  ],
  build: {
    target: 'es2015'
  }
})
