import { Command, MODE } from '@axiosleo/cli-tool';
import { createServer } from 'vite';
import fs from 'fs/promises';
import getPort from 'get-port';
import path from 'node:path';
import { startVitest, createVitest } from 'vitest/node';
import chokidar from 'chokidar';

import generateWeaveConfig from '../generators/weave.config';
import { checkHappIsBuilt, ensureDir, wait, WDC_PATH } from '../utils';
import { runCommand } from '../coordinator';
import BuildCommand from './build';
import originalGenerateConfig from '../generators/vite.config';
import { watchForLatestViteConfig, watchForLatestVitestConfig } from 'src/lib/configGenerators';

const workingDir = process.cwd();
const happ = workingDir.split('/').pop()!;

export default class TestCommand extends Command {
  constructor() {
    super({
      name: 'test',
      desc: 'Start Vitest to test the UI code',
    });

    // this.addOption('standalone', 's', 'Run as a standalone Holochain app', MODE.OPTIONAL, false);
    this.addOption('once', undefined, 'Run tests only once and exit', MODE.OPTIONAL, false);
  }

  async exec(args: any, options: { once: boolean }, argList: any, app: any) {
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

    runCommand(
      `cd ${WDC_PATH} && bun run vitest ${options.once ? '--watch=false' : ''} -r ${workingDir}`,
      false,
    );
  }
}
