import { Command } from '@axiosleo/cli-tool';
import { spawn } from 'node:child_process';
import path from 'node:path';

import { WDC_PATH } from '../utils';

const workingDir = process.cwd();

export default class ShellCommand extends Command {
  constructor() {
    super({
      name: 'shell',
      desc: 'Enters a Nix development shell with Rust and Holochain installed',
    });
  }

  async exec(args: any, options: { standalone: boolean; agents: number }, argList: any, app: any) {
    const nixProcess = spawn(`nix develop "${WDC_PATH}"`, [], {
      stdio: 'inherit', // Use this to forward input/output to the terminal
      shell: true, // Ensures the command runs in a shell environment
    });

    nixProcess.on('exit', (code) => {
      console.log(`Nix shell exited with code ${code}`);
    });

    nixProcess.on('error', (err) => {
      console.error('Failed to start Nix shell:', err);
    });

    // // Handle process events
    // nixProcess.on('close', (code) => {
    //   if (code !== 0) {
    //     console.error(`nix develop exited with code ${code}`);
    //   } else {
    //     console.log('Exited nix shell.');
    //   }
    //   process.exit(code);
    // });

    // nixProcess.on('error', (err) => {
    //   console.error(`Error starting nix develop: ${err.message}`);
    //   process.exit(1);
    // });
  }
}
