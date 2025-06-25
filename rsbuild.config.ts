import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  tools: {
    swc: {
      jsc: {
        transform: {
          react: {
            runtime: 'automatic',
            importSource: 'rubedo-dom',
          }
        }
      }
    }
  },
  html: {
    title: 'Rubedo + Rsbuild',
  },
  server: {
    proxy: {
      '/connect': 'ws://localhost:80',
      '/qrcode': 'http://localhost:80',
      '/public': 'http://localhost:80',
      '/url': 'http://localhost:80',
    },
  },
});
