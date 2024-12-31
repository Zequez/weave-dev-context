import { Command } from '@axiosleo/cli-tool';
import { spawn } from 'node:child_process';

import { WDC_PATH } from '../utils';

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
  }
}
