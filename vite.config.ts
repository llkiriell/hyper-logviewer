import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

function desktopShell(): Plugin {
  return {
    name: 'hyper-desktop-shell',
    apply: 'serve',
    configureServer(server) {
      if (server.config.mode !== 'desktop') return;
      server.httpServer?.once('listening', () => {
        const viteCli = path.join(path.dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');
        const shellBuild = spawnSync(
          process.execPath,
          [viteCli, 'build', '--config', 'vite.electron.config.ts', '--logLevel', 'warn'],
          { stdio: 'inherit' },
        );
        if (shellBuild.status !== 0) process.exit(shellBuild.status ?? 1);
        const address = server.httpServer?.address();
        const port = typeof address === 'object' && address ? address.port : 5173;
        const electron = require('electron') as string;
        const shell = spawn(electron, ['.'], {
          stdio: 'inherit',
          env: { ...process.env, LOGVIEWER_DEV_URL: `http://localhost:${port}/` },
        });
        shell.on('exit', () => void server.close().then(() => process.exit(0)));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), desktopShell()],
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
