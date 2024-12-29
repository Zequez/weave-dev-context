import { spawn } from 'child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'fs/promises';
import generateConfig from '../vite.config';

export async function runCommand(cmd: string) {
  console.log('>', cmd);
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, [], { shell: true, stdio: ['inherit', 'inherit', 'inherit'] });

    // child.stdout.on('data', (data) => {
    //   console.log(`stdout: ${data}`);
    // });

    // child.stderr.on('data', (data) => {
    //   console.error(`stderr: ${data}`);
    // });

    child.on('close', (code) => {
      if (code === 0) {
        resolve('Process completed successfully');
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
}

export async function rmDir(pathname: string) {
  await fs.rm(pathname, { recursive: true });
}

export async function ensureDir(pathname: string) {
  return await fs.mkdir(pathname, { recursive: true });
}

const currentFilePath = fileURLToPath(import.meta.url);
export const WDC_PATH = path.join(path.dirname(currentFilePath), '../');

// export const HAPPS_PATH = path.resolve(WDC_PATH, 'happs/');
