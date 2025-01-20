import { checkHappIsBuilt, ensureDir, wait, WDC_PATH } from '../utils';
import path from 'node:path';
import chokidar from 'chokidar';

import originalViteConfigGenerator from '../generators/vite.config';
import originalVitestConfigGenerator from '../generators/vitest.config';

const vitestConfigGeneratorPath = path.join(WDC_PATH, './src/generators/vitest.config.ts');
const viteConfigGeneratorPath = path.join(WDC_PATH, './src/generators/vite.config.ts');

const workingDir = process.cwd();
const happ = workingDir.split('/').pop()!;

export async function watchForLatestVitestConfig(
  config: {},
  cb: (config: ReturnType<typeof originalVitestConfigGenerator>) => void,
) {
  async function regenerate() {
    delete require.cache[vitestConfigGeneratorPath];
    const { default: generateConfig } = (await import(vitestConfigGeneratorPath)) as {
      default: typeof originalVitestConfigGenerator;
    };
    return generateConfig(config);
  }

  const watcher = chokidar.watch(viteConfigGeneratorPath).on('change', async (event, path) => {
    console.log('Vitest config changed, restarting...');
    cb(await regenerate());
  });

  process.on('exit', () => {
    watcher.close();
  });

  cb(await regenerate());
}

export async function watchForLatestViteConfig(
  { port }: { port: number },
  cb: (config: ReturnType<typeof originalViteConfigGenerator>) => void,
) {
  async function regenerate() {
    delete require.cache[viteConfigGeneratorPath];
    const { default: generateConfig } = (await import(viteConfigGeneratorPath)) as {
      default: typeof originalViteConfigGenerator;
    };
    return generateConfig({ rootPath: workingDir, happ, port });
  }
  const watcher = chokidar.watch(viteConfigGeneratorPath).on('change', async (event, path) => {
    console.log('Vite config changed, restarting...');
    cb(await regenerate());
  });

  process.on('exit', () => {
    watcher.close();
  });

  cb(await regenerate());
}
