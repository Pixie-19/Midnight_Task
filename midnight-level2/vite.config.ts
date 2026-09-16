import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Midnight SDK packages use Node.js built-ins (Buffer, process, crypto).
    // vite-plugin-node-polyfills shims them for the browser bundle.
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      // The `ws` package is Node.js-only. Midnight packages use it for
      // WebSocket subscriptions; in the browser the native WebSocket is used
      // instead. Aliasing to an empty module prevents bundling errors.
      ws: 'node_modules/vite-plugin-node-polyfills/shims/empty.js',
    },
  },
  build: {
    // Increase the warning threshold — Midnight SDK bundles are large due to
    // ZK cryptography libraries (WASM + JS). This silences the non-actionable
    // chunk-size warning during the initial scaffold build.
    chunkSizeWarningLimit: 4096,
    target: 'es2022',
  },
  // Expose env vars prefixed with VITE_ to the browser bundle.
  // See .env.example for the required variables.
  envPrefix: 'VITE_',
});
