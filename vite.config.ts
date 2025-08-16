import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react'
    }),
    // Sentry plugin for source map uploading
    process.env.SENTRY_AUTH_TOKEN && sentryVitePlugin({
      org: "act-l6",
      project: "career-services-frontend",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
    })
  ].filter(Boolean),
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js', '@supabase/ssr'],
    exclude: ['lucide-react'],
    force: true,
    esbuildOptions: {
      target: 'es2020'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
    },
    dedupe: ['react', 'react-dom']
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true
      }
    }
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/]
    },
    // Generate source maps for Sentry
    sourcemap: true
  }
});
