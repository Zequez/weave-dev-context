import { defineConfig } from 'vite';
import UnoCSS from 'unocss/vite';
import Icons from 'unplugin-icons/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';
import { WDC_PATH } from '../utils.ts';
import unocssConfig from '../../unocss.config.ts';

const unPluginIconsCompilerMap = {
  svelte: 'svelte',
  react: 'jsx',
};

export default function generateConfig({
  rootPath,
  happ,
  port,
  appPort,
  adminPort,
  framework,
}: {
  rootPath: string;
  happ: string;
  port?: number;
  appPort?: number;
  adminPort?: number;
  framework?: 'svelte' | 'react';
}) {
  const resolvedFramework = framework || 'svelte';
  const plugins = [
    UnoCSS(unocssConfig),
    Icons({ compiler: unPluginIconsCompilerMap[resolvedFramework] as any, defaultClass: 'block' }),
  ];
  if (resolvedFramework === 'svelte') plugins.unshift(svelte());
  if (resolvedFramework === 'react') console.log('Starting with reactt');

  return defineConfig({
    plugins,
    server: {
      hmr: {
        host: 'localhost',
      },
      port,
    },
    define: {
      'import.meta.env.HAPP': JSON.stringify(happ),
      'import.meta.env.APP_PORT': appPort,
      'import.meta.env.ADMIN_PORT': adminPort,
    },
    root: rootPath,
    build: {
      outDir: `./dist/ui`,
      emptyOutDir: true,
    },
    optimizeDeps: {
      force: true,
    },
  });
}
