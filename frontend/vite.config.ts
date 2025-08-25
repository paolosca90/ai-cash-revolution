import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      '~backend/client': path.resolve(__dirname, './client'),
      '~backend': path.resolve(__dirname, '../backend'),
    },
  },
  plugins: [
    tailwindcss(),
    react({
      // Enable Fast Refresh for mobile development
      fastRefresh: true,
    }),
  ],
  build: {
    // Enable minification for production
    minify: 'terser',
    // Optimize for mobile
    target: ['es2020', 'chrome80', 'safari14', 'firefox78'],
    // Code splitting for better mobile performance
    rollupOptions: {
      output: {
        // Manual chunking for better caching
        manualChunks: {
          // Separate vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          'chart-vendor': ['recharts'],
          'icon-vendor': ['lucide-react'],
          
          // Separate page chunks
          'dashboard': ['./pages/Dashboard.tsx'],
          'trade': ['./pages/Trade.tsx'],
          'ml-dashboard': ['./pages/MLDashboard.tsx'],
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop().replace('.tsx', '').replace('.ts', '') : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const extType = info[info.length - 1] || '';
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `images/[name]-[hash][extname]`;
          } else if (/woff2?|eot|ttf|otf/i.test(extType)) {
            return `fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    // Optimize bundle size
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'], // Remove specific console methods
      },
    },
    // Set chunk size limit for mobile optimization
    chunkSizeWarningLimit: 1000, // 1MB chunks
    // Enable source maps for debugging
    sourcemap: false,
  },
  // Mobile development optimizations
  server: {
    host: true, // Allow external connections (for mobile testing)
    port: 5173,
    // Enable HMR over network for mobile testing
    hmr: {
      host: 'localhost',
      port: 5173,
    },
    // CORS settings for mobile development
    cors: true,
  },
  // Preview server settings
  preview: {
    host: true,
    port: 4173,
    cors: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'recharts',
      'lucide-react',
    ],
    // Pre-bundle these for faster mobile startup
    force: true,
  },
  // Define global constants for mobile optimization
  define: {
    __MOBILE_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
