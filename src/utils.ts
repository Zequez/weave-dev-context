import { spawn } from 'child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'fs/promises';
import generateConfig from './generators/vite.config';

export const happDirPath = process.cwd();
export const happDirName = happDirPath.split('/').pop()!;

export async function runCommand(cmd: string) {
  console.log('>', cmd);
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, [], { shell: true, stdio: ['inherit', 'inherit', 'inherit'] });

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

export function wait(s: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, s * 1000);
  });
}

export async function checkHappIsBuilt(name: string) {
  const file = path.join(happDirPath, `./dist/dnas/${name}.happ`);
  // check if it exists
  return fs
    .access(file)
    .then(() => true)
    .catch(() => false);
}

export async function ensureLink(targetPath: string, linkPath: string) {
  // Check if link exists and delete it
  try {
    await fs.unlink(linkPath);
  } catch (e) {
    // ignore
  }
  return await fs.symlink(targetPath, linkPath);
}

export async function loadConfig(happPath: string) {
  const config = await import(path.join(happPath, './wdc.config.ts'));
  return config;
}

export async function maybeReadFile(path: string) {
  try {
    return await fs.readFile(path, 'utf-8');
  } catch (e) {
    return null;
  }
}
