import { defineConfig } from 'vite';

export default function generateConfig({
  rootPath,
  happ,
  port,
}: {
  rootPath: string;
  happ: string;
  port?: number;
}) {
  return defineConfig({
    plugins: [],
    server: {
      hmr: {
        host: 'localhost',
      },
      port,
    },
    root: rootPath,
    build: {
      outDir: `./dist`,
      emptyOutDir: true,
    },
  });
}
