import { Command, MODE } from '@axiosleo/cli-tool';
import { createServer } from 'vite';
import fs from 'fs/promises';
import getPort from 'get-port';
import path from 'node:path';
import chokidar from 'chokidar';

import generateWeaveConfig from '../generators/weave.config';
import { checkHappIsBuilt, ensureDir, wait, WDC_PATH } from '../utils';
import { runCommand } from '../coordinator';
import BuildCommand from './build';
import originalGenerateConfig from '../generators/vite.config';

const workingDir = process.cwd();
const happ = workingDir.split('/').pop()!;

export default class DevCommand extends Command {
  constructor() {
    super({
      name: 'dev',
      desc: 'Start the Vite UI dev server, and the Weave dev server. It uses the compiled happ files, so make sure you run the build command at least once.',
    });

    // /**
    //  * add argument of current command
    //  * @param name argument name
    //  * @param desc argument description
    //  * @param mode argument mode : required | optional
    //  * @param default_value only supported on optional mode
    //  */
    // this.addArgument('arg-name', 'desc', MODE.REQUIRED, null);

    // /**
    //  * add option of current command
    //  * @param name option name
    //  * @param short option short name
    //  * @param desc option description
    //  * @param mode option mode : required | optional
    //  * @param default_value only supported on optional mode
    //  */
    this.addOption('standalone', 's', 'Run as a standalone Holochain app', MODE.OPTIONAL, false);
    this.addOption('agents', 'a', 'Number of agents', MODE.OPTIONAL, 2);
  }

  async exec(args: any, options: { standalone: boolean; agents: number }, argList: any, app: any) {
    process.env.NODE_ENV = 'development';

    if (!happ) {
      console.error('No named path');
      return;
    }

    // Get list of files on working dir
    const files = await fs.readdir(workingDir);
    if (files.indexOf('index.html') === -1) {
      console.error('No index.html found');
      return;
    }

    const UI_PORT = await getPort();
    const distPath = path.join(workingDir, './dist');
    const weaveDist = path.join(distPath, './weave');
    ensureDir(weaveDist);

    async function startUiServer() {
      const viteConfigPath = path.join(WDC_PATH, './src/generators/vite.config.ts');

      async function getLatestConfig() {
        delete require.cache[viteConfigPath];
        const { default: generateConfig } = (await import(viteConfigPath)) as {
          default: typeof originalGenerateConfig;
        };
        return generateConfig({ rootPath: workingDir, happ, port: UI_PORT });
      }

      let viteServer: Awaited<ReturnType<typeof createServer>>;

      async function startServer() {
        console.log('Starting UI development server');
        if (viteServer) await viteServer.close();
        const latestConfig = await getLatestConfig();
        viteServer = await createServer(latestConfig);

        await viteServer.listen();
        viteServer.printUrls();
        viteServer.bindCLIShortcuts({ print: true });
      }

      startServer();
      const watcher = chokidar.watch(viteConfigPath).on('change', (event, path) => {
        console.log('Vite config changed, restarting...');
        startServer();
      });

      process.on('exit', () => {
        watcher.close();
        viteServer.close();
      });
    }

    async function startWeaveServer() {
      const weaveConfig = generateWeaveConfig({
        rootPath: workingDir,
        happ,
        uiPort: UI_PORT,
        agents: options.agents,
      });

      const configPath = path.join(weaveDist, './config.json');

      await fs.writeFile(configPath, JSON.stringify(weaveConfig, null, 2));
      for (let i = 0; i < options.agents; ++i) {
        if (i > 0) {
          await wait(6);
        }

        runCommand(
          `cd ${WDC_PATH} && bun run weave --agent-idx ${i + 1} --dev-config ${configPath}`,
        );
      }
    }

    if (!(await checkHappIsBuilt(happ))) {
      console.log('DNA not found, building first...');
      const buildCmd = new BuildCommand();
      await buildCmd.exec(null, null, null, null);
    }

    await startUiServer();
    await startWeaveServer();
  }
}
