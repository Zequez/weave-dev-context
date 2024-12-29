import { Command, MODE } from '@axiosleo/cli-tool';
import { createServer } from 'vite';
import fs from 'fs/promises';
import getPort from 'get-port';
import path from 'node:path';

import generateWeaveConfig from '../../weave/config';
import generateConfig from '../../vite.config';
import { ensureDir, runCommand, WDC_PATH } from '../utils';

const workingDir = process.cwd();
const happ = workingDir.split('/').pop()!;

export default class DevCommand extends Command {
  constructor() {
    super({
      name: 'dev',
      desc: 'Develop the happ, Happ and package the happ',
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
    console.log(args, options, argList);

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
      const viteServer = await createServer(
        generateConfig({ rootPath: workingDir, happ, port: UI_PORT }),
      );

      await viteServer.listen();
      viteServer.printUrls();
      viteServer.bindCLIShortcuts({ print: true });
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
      await Promise.all(
        [...new Array(options.agents)].map((_, i) => {
          return runCommand(
            `cd ${WDC_PATH} && bun run weave --agent-idx ${i + 1} --dev-config ${configPath}`,
          );
        }),
      );
    }

    await startUiServer();
    await startWeaveServer();
  }
}
