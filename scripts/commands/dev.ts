import { Command, MODE } from '@axiosleo/cli-tool';
import { createServer } from 'vite';
import fs from 'fs/promises';
import getPort from 'get-port';
import { dirname, join } from 'node:path';

import generateConfig from '../../vite.config';
import { runCommand, WDC_PATH } from '../utils';

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
    this.addOption('standalone', 's', 'Run as a standalone Holochain app', MODE.OPTIONAL, true);
    this.addOption('agents', 'a', 'Number of agents', MODE.OPTIONAL, 2);
  }

  async exec(args: any, options: any, argList: any, app: any) {
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

    const viteServer = await createServer(
      generateConfig({ rootPath: workingDir, happ, port: UI_PORT }),
    );

    await viteServer.listen();
    viteServer.printUrls();
    viteServer.bindCLIShortcuts({ print: true });

    // async function bulidUi() {
    //   const distPath = join(workingDir, './dist');
    //   await fs.rm(distPath, { recursive: true });
    //   await viteBuild(generateConfig({ rootPath: workingDir, happ }));
    //   const zip = new AdmZip();
    //   zip.addLocalFile(distPath);
    //   await zip.writeZipPromise(join(distPath, '../ui.zip'));
    // }

    // await bulidUi();
  }
}
