import { spawn } from 'child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import fss from 'node:fs';
import type { WdcConfig } from './defineConfig';

export const happDirPath = process.cwd();
export const happDirName = happDirPath.split('/').pop()!;

export async function runCommand(cmd: string) {
  console.log('>', cmd);
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, [], { shell: true, stdio: ['inherit', 'inherit', 'inherit'] });

    child.on('close', (code) => {
      if (code === 0) {
        // Resolve the output
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
  const configPath = path.join(happPath, './wdc.config.ts');
  if (await maybeReadFile(configPath)) {
    const config = await import(path.join(happPath, './wdc.config.ts'));
    return { id: happDirName, ...config.default } as WdcConfig;
  } else {
    return null;
  }
}

export async function maybeReadFile(path: string) {
  try {
    return await fs.readFile(path, 'utf-8');
  } catch (e) {
    return null;
  }
}

export function readHappIconName() {
  const happIconPng = path.join(happDirPath, './icon.png');
  const happIconSvg = path.join(happDirPath, './icon.svg');
  return fss.existsSync(happIconSvg)
    ? path.basename(happIconSvg)
    : fss.existsSync(happIconPng)
      ? path.basename(happIconPng)
      : null;
}
