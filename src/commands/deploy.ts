import { Command, MODE } from '@axiosleo/cli-tool';
import { build as viteBuild } from 'vite';
import fs from 'fs/promises';
import AdmZip from 'adm-zip';
import { dirname, join } from 'node:path';

import generateConfig from '../generators/vite.config';
import {
  ensureDir,
  loadConfig,
  rmDir,
  runCommand,
  WDC_PATH,
  happDirPath,
  happDirName,
  readHappIconName,
} from '../utils';
import {
  createGHClient,
  loadCurationListData,
  saveCurationListData,
  extractChangelogContent,
  WEAVE_VERSION,
  createAndOpenPRUrl,
  extractOwnerAndRepoFromGithubUrl,
} from 'src/lib/deploymentUtils';
import { existsSync } from 'node:fs';

export default class DeployCommand extends Command {
  constructor() {
    super({
      name: 'deploy',
      desc: 'Deploy built happ to Weave tool curation list',
    });
  }

  async exec(args: any, options: any, argList: any, app: any) {
    type ThisConfig = {
      //-- Read from the directory path
      root: string;
      id: string;
      //-- Mandatory
      curationListOriginalUrl: string;
      curationListForkUrl: string;
      curationListId: string;
      subtitle: string;
      title: string;
      description: string;
      githubRepo: string;
      version: string;
      changeLog: string;
      //-- Optional
      versionBranch: string;
      tags: string[];
      //-- Read from the directory path
      iconName: string;
    };

    // ██╗   ██╗ █████╗ ██╗     ██╗██████╗  █████╗ ████████╗██╗ ██████╗ ███╗   ██╗███████╗
    // ██║   ██║██╔══██╗██║     ██║██╔══██╗██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
    // ██║   ██║███████║██║     ██║██║  ██║███████║   ██║   ██║██║   ██║██╔██╗ ██║███████╗
    // ╚██╗ ██╔╝██╔══██║██║     ██║██║  ██║██╔══██║   ██║   ██║██║   ██║██║╚██╗██║╚════██║
    //  ╚████╔╝ ██║  ██║███████╗██║██████╔╝██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║███████║
    //   ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝

    if (!happDirName) {
      console.error('No named path');
      return;
    }

    const config = await loadConfig(happDirPath);

    const errors = [];

    if (!config) errors.push('No wdc.config.ts found; needed for deployment configuration');

    if (config) {
      const E = (p: string) => errors.push(`Missing ${p} property on wdc.config.ts`);

      if (!config.curationListOriginalUrl) E('curationListOriginalUrl');
      if (!config.curationListForkUrl) E('curationListForkUrl');
      if (!config.subtitle) E('subtitle');
      if (!config.description) E('description');
      if (!config.githubRepo) E('githubRepo');
      if (!config.version) E('version');
      if (!config.changeLog) E('changeLog');
    }

    const iconName = readHappIconName();
    if (!iconName) errors.push('No icon found; add icon.svg or icon.png to the project root');

    if (errors.length) {
      console.error(errors.join('\n'));
      return;
    }

    const C: ThisConfig = {
      //-- Read from the directory path
      root: happDirPath,
      //-- Mandatory
      id: config!.id!,
      curationListOriginalUrl: config!.curationListOriginalUrl!,
      curationListForkUrl: config!.curationListForkUrl!,
      curationListId: config!.curationListId || config!.id!,
      subtitle: config!.subtitle!,
      title: config!.name || config!.id!,
      description: config!.description!,
      githubRepo: config!.githubRepo!,
      version: config!.version!,
      changeLog: extractChangelogContent(config!.changeLog!, config!.version!)!,
      //-- Optional
      versionBranch: config!.curationListVersionBranch || 'main',
      tags: config!.tags || [],
      //-- Read from the directory path
      iconName: iconName!,
    };

    /***************************************** */
    // MAKE LOCAL AND UPDATED CURATION LIST REPO
    /***************************************** */

    // Clone pull the latest changes or clone the repo

    const curationsRepoPath = join(happDirPath, 'dist/curation-list');
    if (existsSync(curationsRepoPath)) {
      await updateRepo();
    } else {
      await runCommand(`git clone ${C.curationListForkUrl} ${curationsRepoPath}`);
      await runCommand(
        `cd ${curationsRepoPath} && git remote add upstream ${C.curationListOriginalUrl}`,
      );
      await updateRepo();
    }

    async function updateRepo() {
      return await runCommand(
        `cd ${curationsRepoPath} && git fetch upstream && git checkout main && git reset --hard upstream/main`,
      );
    }

    /************************************************************************* */
    // Read data from the curation list curations and tool-list TypeScript files
    /************************************************************************* */

    const data = await loadCurationListData(happDirPath);

    /****************** */
    // Add tool to list if does not exist yet
    /****************** */

    let toolIndex = data.toolList.tools.findIndex((t) => t.id === C.curationListId);
    if (toolIndex === -1) {
      console.log('Adding tool to list');
      toolIndex =
        data.toolList.tools.push({
          id: C.curationListId,
          versionBranch: C.versionBranch,
          title: C.title,
          subtitle: C.subtitle,
          description: C.description,
          icon: `https://raw.githubusercontent.com/${C.githubRepo}/refs/heads/main/${C.iconName}`,
          tags: C.tags,
          versions: [],
        }) - 1;
    } else {
      console.log('Tool already on list');
    }

    // TODO: Extract specific version segment from changelog

    // TODO: Ensure latest commits are pushed to Github

    const githubReleaseTag = `v${C.version}`;
    const githubWebhappFileName = `${C.id}.webhapp`;
    const githubReleaseWebappURL = `https://github.com/${C.githubRepo}/releases/download/${githubReleaseTag}/${githubWebhappFileName}`;

    /******************************************************** */
    // Compute the hashes using `weave hash-webhapp app.webhapp`
    /******************************************************* */

    type Hashes = {
      happSha256: string;
      webhappSha256: string;
      uiSha256: string;
    };

    const webhappPath = join(happDirPath, `dist/dnas/${happDirName}.webhapp`);
    const { $ } = Bun;
    const result = await $`bun run weave hash-webhapp ${webhappPath}`;
    const rawOutput = result.stdout.toString().trim();
    const lastBrace = rawOutput.lastIndexOf('}');
    const output = rawOutput.slice(0, lastBrace + 1);
    let hashes: Hashes;
    try {
      hashes = JSON.parse(output) as Hashes;
    } catch (e) {
      console.log('Could not parse hashes from `weave hash-webhapp`', e);
      return;
    }

    /****************** */
    // Add version to tool list item or update existing one
    /****************** */

    const versions = data.toolList.tools[toolIndex].versions;

    const current = versions.findIndex((v) => v.version === C.version);
    const newVersion = {
      version: C.version,
      url: githubReleaseWebappURL,
      hashes,
      changelog: C.changeLog,
      releasedAt: new Date().getTime(),
    };

    if (current === -1) {
      console.log('New version detected; adding');
      versions.push(newVersion);
    } else {
      console.log('Versions already exists; overriding');
      versions[current] = newVersion;
    }

    /**************************************** */
    // Update curation list and save both lists
    /**************************************** */

    const newToolCurationItem = {
      toolListUrl: 'https://lightningrodlabs.org/weave-tool-curation/0.13/tool-list-0.13.json',
      toolId: C.curationListId,
      versionBranch: C.versionBranch,
      tags: C.tags,
    };

    const curationToolIndex = data.curations.curationLists.default.tools.findIndex(
      (t) => t.toolId === C.curationListId,
    );
    if (curationToolIndex === -1) {
      console.log('Adding tool to default curation list');
      data.curations.curationLists.default.tools.push(newToolCurationItem);
    } else {
      console.log('Updating tool on curation list');
      data.curations.curationLists.default.tools[curationToolIndex] = newToolCurationItem;
    }

    // Save the new JSON objects to disk

    await saveCurationListData(happDirPath, data);

    console.log('#### LISTS UPDATED ####');

    /************************************************************************* */
    // Make a Github Release
    /************************************************************************* */

    console.log(`Fetching Github repo ${C.githubRepo} releases`);

    const [owner, repo] = C.githubRepo.split('/');

    const GH = createGHClient(owner, repo);
    const webhappFilePath = join(happDirPath, `./dist/dnas/${githubWebhappFileName}`);
    await GH.createRelease(C.versionBranch, githubReleaseTag, C.changeLog, webhappFilePath);

    /************************************************************************* */
    // Install curation list dependencies and run validation/generatio command
    /************************************************************************* */

    const curationListSubrepo = join(curationsRepoPath, WEAVE_VERSION);

    console.log(`Installing curation list dependencies ${curationsRepoPath}`);
    await Bun.$`cd ${curationListSubrepo} && npm install`;

    console.log('Running curation list code generation');
    await Bun.$`cd ${curationListSubrepo} && npm run write-lists`;

    console.log('Running curation list tests');
    await Bun.$`cd ${curationListSubrepo} && npm run test`;

    /************************************************************************* */
    // Make curation list commit, push to Github, and open PR screen
    /************************************************************************* */

    console.log('Making curation list commit');
    const commitTitle = `Release ${C.title} v${C.version}`;
    await Bun.$`cd ${curationsRepoPath} && git add -A && git commit -m '${commitTitle}'`;

    console.log('Pushing curation list');
    await Bun.$`cd ${curationsRepoPath} && git push origin main --force`;

    /************************************************************************* */
    // Open browser screen with PR for original curation list repo pre-filled
    /************************************************************************* */

    const [forkOwner, forkRepo] = extractOwnerAndRepoFromGithubUrl(C.curationListOriginalUrl);
    const [upstreamOwner, upstreamRepo] = extractOwnerAndRepoFromGithubUrl(C.curationListForkUrl);

    console.log('Opening PR for upstream curation list repository');
    createAndOpenPRUrl(
      forkOwner,
      forkRepo,
      upstreamOwner,
      upstreamRepo,
      'main', // Feature branch in the fork
      commitTitle, // PR title
      C.changeLog, // PR description
    );
  }
}
