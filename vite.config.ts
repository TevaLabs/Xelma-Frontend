import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    sveltekit(),
    svelte(),
    nodePolyfills()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Existing manual chunks
          stellar: ['@stellar/xdr', '@stellar/sdk'],
          charts: ['chart.js', 'chartjs-plugin-datalabels'],

          // New socket chunk
          socket: ['socket.io-client']
        }
      }
    }
  }
});