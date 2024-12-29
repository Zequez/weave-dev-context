import { Command, MODE } from '@axiosleo/cli-tool';
import { build as viteBuild } from 'vite';
import fs from 'fs/promises';
import AdmZip from 'adm-zip';
import { spawn } from 'child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import generateConfig from '../../vite.config';
import { runCommand, WDC_PATH } from '../utils';

console.log(WDC_PATH);

const workingDir = process.cwd();

export default class BuildCommand extends Command {
  constructor() {
    super({
      name: 'build',
      desc: 'Build UI, Happ and package the happ',
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
    // this.addOption('happ', 'a', 'Happ to be built', MODE.OPTIONAL, null);
  }

  async exec(args: any, options: any, argList: any, app: any) {
    join(workingDir, './dist');

    const happ = workingDir.split('/').pop()!;

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

    async function bulidUi() {
      const distPath = join(workingDir, './dist');
      await fs.rm(distPath, { recursive: true });
      await viteBuild(generateConfig({ rootPath: workingDir, happ }));
      const zip = new AdmZip();
      zip.addLocalFile(distPath);
      await zip.writeZipPromise(join(distPath, '../ui.zip'));
    }

    await bulidUi();
  }
}
