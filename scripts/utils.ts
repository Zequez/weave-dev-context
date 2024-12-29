import { spawn } from 'child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import generateConfig from '../vite.config';

export async function runCommand(cmd: string) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, [], { shell: true });

    child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    child.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve('Process completed successfully');
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
}

const currentFilePath = fileURLToPath(import.meta.url);
export const WDC_PATH = path.join(currentFilePath, '../');

// export const HAPPS_PATH = path.resolve(WDC_PATH, 'happs/');
