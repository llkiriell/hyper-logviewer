import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false,
  esbuild: {
    loader: 'ts',
    include: /\.c?ts$/,
  },
  ssr: { noExternal: true, target: 'node' },
  build: {
    ssr: true,
    outDir: 'dist-electron',
    emptyOutDir: true,
    target: 'node22',
    sourcemap: false,
    minify: false,
    rollupOptions: {
      input: {
        main: 'electron/main.cts',
        preload: 'electron/preload.cts',
      },
      external: ['electron'],
      output: {
        format: 'cjs',
        entryFileNames: '[name].cjs',
        chunkFileNames: 'chunks/[name]-[hash].cjs',
      },
    },
  },
});
