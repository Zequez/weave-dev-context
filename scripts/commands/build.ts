import { Command, MODE } from '@axiosleo/cli-tool';
import { build as viteBuild } from 'vite';
import fs from 'fs/promises';
import AdmZip from 'adm-zip';
import { spawn } from 'child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import generateConfig from '../../vite.config';
import { ensureDir, rmDir, runCommand, WDC_PATH } from '../utils';

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

    const distPath = join(workingDir, './dist');
    const uiDist = join(distPath, './ui');
    const cargoDist = join(distPath, './cargo');
    const dnasDist = join(distPath, './dnas');

    async function clean() {
      await rmDir(uiDist);
      await ensureDir(uiDist);
      await ensureDir(cargoDist);
      await ensureDir(dnasDist);
    }

    async function bulidUi() {
      await viteBuild(generateConfig({ rootPath: workingDir, happ }));
      const zip = new AdmZip();
      zip.addLocalFile(uiDist);
      await zip.writeZipPromise(join(distPath, './ui.zip'));
    }

    async function buildCargo() {
      await runCommand(
        `cd ${WDC_PATH} && cargo build --target-dir=${cargoDist} --release --target wasm32-unknown-unknown`,
      );
    }

    async function generateDna() {
      const dnaFile = await fs.readFile(join(WDC_PATH, 'dnas/dna.yaml'), 'utf8');
      const happFile = await fs.readFile(join(WDC_PATH, 'dnas/happ.yaml'), 'utf8');
      const webHappFile = await fs.readFile(join(WDC_PATH, 'dnas/web-happ.yaml'), 'utf8');

      await fs.writeFile(join(dnasDist, 'dna.yaml'), dnaFile.replaceAll('wdc', happ));
      await fs.writeFile(join(dnasDist, 'happ.yaml'), happFile.replaceAll('wdc', happ));
      await fs.writeFile(join(dnasDist, 'web-happ.yaml'), webHappFile.replaceAll('wdc', happ));
    }

    async function packDna() {
      await runCommand(`hc web-app pack --recursive "${dnasDist}"`);
    }

    await clean();
    await bulidUi();
    await buildCargo();
    await generateDna();
    await packDna();
  }
}
