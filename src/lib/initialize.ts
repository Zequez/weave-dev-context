import { WDC_PATH, ensureLink, maybeReadFile } from 'src/utils';
import fs from 'node:fs/promises';
import path from 'node:path';
import generateTsConfig from '../generators/tsconfig';

export default async function initialize({ happDirPath }: { happDirPath: string }) {
  // Add TSConfig
  const tsConfig = generateTsConfig();
  const tsConfigPath = path.join(happDirPath, './tsconfig.json');
  await fs.writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2));

  // Symlink node_modules to happ
  const nodeModulesPath = path.join(WDC_PATH, './node_modules');
  await ensureLink(nodeModulesPath, path.join(happDirPath, './node_modules'));

  // Symlink self to own node_modules as wdc
  await ensureLink(WDC_PATH, path.join(WDC_PATH, 'node_modules/wdc'));

  // Add tsconfig, node_modules and dist to .gitignore
  const gitIgnorePath = path.join(happDirPath, '.gitignore');
  let gitIgnore = (await maybeReadFile(gitIgnorePath)) || '';

  const lines = gitIgnore.split('\n');
  function addLine(line: string) {
    if (lines.indexOf(line) === -1) {
      lines.push(line);
    }
  }
  addLine('tsconfig.json');
  addLine('node_modules');
  addLine('dist');

  gitIgnore = lines.join('\n');

  await fs.writeFile(gitIgnorePath, gitIgnore);
}
