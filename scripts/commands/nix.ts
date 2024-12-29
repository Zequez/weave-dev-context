import { Command } from '@axiosleo/cli-tool';
import { spawn } from 'child_process';
import { chdir } from 'process';

import { WDC_PATH } from '../utils';

const workingDir = process.cwd();

export default class DevCommand extends Command {
  constructor() {
    super({
      name: 'nix',
      desc: 'Enters the Nix shell',
    });
  }

  async exec(args: any, options: { standalone: boolean; agents: number }, argList: any, app: any) {
    chdir(WDC_PATH);
    const nixProcess = spawn('nix', ['develop'], {
      stdio: 'inherit', // Use this to forward input/output to the terminal
      shell: true, // Ensures the command runs in a shell environment
    });

    // Handle process events
    nixProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`nix develop exited with code ${code}`);
      } else {
        console.log('Exited nix shell.');
      }
      process.exit(code);
    });

    nixProcess.on('error', (err) => {
      console.error(`Error starting nix develop: ${err.message}`);
      process.exit(1);
    });

    chdir(workingDir);
  }
}
