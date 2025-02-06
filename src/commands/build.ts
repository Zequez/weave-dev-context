import { Command, MODE } from '@axiosleo/cli-tool';
import { build as viteBuild } from 'vite';
import fs from 'fs/promises';
import AdmZip from 'adm-zip';
import { dirname, join } from 'node:path';

import generateConfig from '../generators/vite.config';
import { ensureDir, rmDir, runCommand, WDC_PATH, happDirPath, happDirName } from '../utils';

export default class BuildCommand extends Command {
  constructor() {
    super({
      name: 'build',
      desc: 'Build UI, Happ and package the happ',
    });

    this.addOption('skip-ui', undefined, 'Skip building the UI', MODE.OPTIONAL, false);
  }

  async exec(args: any, options: { 'skip-ui': boolean }, argList: any, app: any) {
    if (!happDirName) {
      console.error('No named path');
      return;
    }

    // Get list of files on working dir
    const files = await fs.readdir(happDirPath);
    if (files.indexOf('index.html') === -1) {
      console.error('No index.html found');
      return;
    }

    const distPath = join(happDirPath, './dist');
    const uiDist = join(distPath, './ui');
    const cargoDist = join(distPath, './cargo');
    const dnasDist = join(distPath, './dnas');

    async function clean() {
      if (!options['skip-ui']) await rmDir(uiDist);
      await ensureDir(uiDist);
      await ensureDir(cargoDist);
      await ensureDir(dnasDist);
    }

    async function bulidUi() {
      await viteBuild(generateConfig({ rootPath: happDirPath, happ: happDirName }));
      const zip = new AdmZip();
      zip.addLocalFolder(uiDist);
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

      await fs.writeFile(join(dnasDist, 'dna.yaml'), dnaFile.replaceAll('wdc', happDirName));
      await fs.writeFile(join(dnasDist, 'happ.yaml'), happFile.replaceAll('wdc', happDirName));
      await fs.writeFile(
        join(dnasDist, 'web-happ.yaml'),
        webHappFile.replaceAll('wdc', happDirName),
      );
    }

    async function packDna() {
      await runCommand(`hc web-app pack --recursive "${dnasDist}"`);
    }

    await clean();
    if (!options['skip-ui']) await bulidUi();
    await buildCargo();
    await generateDna();
    await packDna();
  }
}
