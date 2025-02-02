import path from 'node:path';
import fs from 'node:fs/promises';
import prettier from 'prettier';
import type { DeveloperCollectiveToolList, ToolCurations } from '@theweave/moss-types';
import axios from 'axios';
import open from 'open';

const GH = Bun.env.GITHUB_TOKEN
  ? axios.create({
      baseURL: 'https://api.github.com', // Set a base URL if all requests go to GitHub
      headers: {
        Authorization: `Bearer ${Bun.env.GITHUB_TOKEN}`,
      },
    })
  : null;

// TODO: Don't hardcode it, make it configurable
export const WEAVE_VERSION = '0.13';

function curationListPaths(happPath: string) {
  const curationsBasePath = path.join(happPath, `./dist/curation-list/${WEAVE_VERSION}/modify/`);
  const curationsPath = path.join(curationsBasePath, `curations-${WEAVE_VERSION}.ts`);
  const toolListPath = path.join(curationsBasePath, `tool-list-${WEAVE_VERSION}.ts`);
  return { curationsPath, toolListPath };
}

export async function loadCurationListData(happPath: string) {
  const paths = curationListPaths(happPath);
  const curations = await import(paths.curationsPath);
  const toolList = await import(paths.toolListPath);
  return { curations: curations.default, toolList: toolList.default } as {
    curations: ToolCurations;
    toolList: DeveloperCollectiveToolList;
  };
}

function replaceCurationFunCal(code: string, funName: string, content: string) {
  const start = code.lastIndexOf(funName + '(') + funName.length + 1;
  const end = code.lastIndexOf(')');

  const almostFinal = code.slice(0, start) + content + code.slice(end);
  return convertToTemplateLiterals(almostFinal);
}

function convertToTemplateLiterals(str: string) {
  return str.replace(/"([^"]*\\n[^"]*)"/g, (_, match) => {
    return `\`${match.replace(/\\n/g, '\n')}\``;
  });
}

export async function saveCurationListData(
  happPath: string,
  data: {
    curations: ToolCurations;
    toolList: DeveloperCollectiveToolList;
  },
) {
  const paths = curationListPaths(happPath);
  const rawToolList = await fs.readFile(paths.toolListPath, 'utf-8');
  const updatedToolList = replaceCurationFunCal(
    rawToolList,
    'defineDevCollectiveToolList',
    JSON.stringify(data.toolList, null, 2),
  );

  const rawCurationList = await fs.readFile(paths.curationsPath, 'utf-8');
  const updatedCurationList = replaceCurationFunCal(
    rawCurationList,
    'defineCurationLists',
    JSON.stringify(data.curations, null, 2),
  );

  const prettierConfig: prettier.Options = {
    parser: 'babel',
    semi: true,
    doubleQuote: true,
    printWidth: 150,
    // plugins: ['prettier-plugin-convert-to-template-literals'],
  };
  const formattedToolList = await prettier.format(updatedToolList, prettierConfig);
  const formattedCurationList = await prettier.format(updatedCurationList, prettierConfig);

  await fs.writeFile(paths.toolListPath, formattedToolList);
  await fs.writeFile(paths.curationsPath, formattedCurationList);
}

//  ██████╗ ██╗████████╗██╗  ██╗██╗   ██╗██████╗
// ██╔════╝ ██║╚══██╔══╝██║  ██║██║   ██║██╔══██╗
// ██║  ███╗██║   ██║   ███████║██║   ██║██████╔╝
// ██║   ██║██║   ██║   ██╔══██║██║   ██║██╔══██╗
// ╚██████╔╝██║   ██║   ██║  ██║╚██████╔╝██████╔╝
//  ╚═════╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝

export function createGHClient(owner: string, repo: string) {
  if (!Bun.env.GITHUB_TOKEN) throw new Error('Missing GITHUB_TOKEN environment variable');
  const GH = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
      Authorization: `Bearer ${Bun.env.GITHUB_TOKEN}`,
    },
  });

  async function getReleases() {
    const response = GH.get(`/repos/${owner}/${repo}/releases`);
    return (await response).data;
  }

  async function createReleaseFull(
    branch: string,
    tagName: string,
    changeLog: string,
    webhappPath: string,
  ) {
    const releases = await getReleases();
    let currentRelease = releases.find((r: any) => r.tag_name === tagName);

    if (currentRelease) {
      console.log(`RELEASE ALREADY EXISTS`);
    } else {
      try {
        await createTag(branch, tagName);
        console.log(`Created tag ${tagName} for ${owner}/${repo}:${branch}`);
      } catch (e) {
        const response = (e as any)?.response!;
        if (response && response.status === 422) {
          // Do nothing, tag exist
          console.log(`Tag ${tagName} for ${owner}/${repo}:${branch} already exist`);
        } else {
          console.error('Unknown error creating tag');
          throw e;
        }
      }

      currentRelease = await createRelease(tagName, tagName, changeLog);
    }

    console.log(`RELEASE ID ${currentRelease.id}`);
    console.log('Uploading webhapp file');

    const fileName = path.basename(webhappPath);
    const webhappAsset = currentRelease.assets.find((a: any) => a.name === fileName);
    if (webhappAsset) {
      console.log('Asset already exists, skipping upload');
    } else {
      await uploadAsset(currentRelease.id, webhappPath, fileName);
      console.log('Upload was successful');
    }
  }

  async function uploadAsset(releaseId: number, filePath: string, fileName: string) {
    const url = `https://uploads.github.com/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${fileName}`;

    const file = await fs.readFile(filePath);

    const response = await GH.post(url, file, {
      headers: {
        Authorization: `Bearer ${Bun.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/octet-stream',
      },
    });

    console.log(`File uploaded: ${response.data.browser_download_url}`);
  }

  async function createTag(branch: string, tagName: string) {
    const latestCommitSHA = await getLatestCommitHash(branch);

    const tagResponse = await GH.post(`/repos/${owner}/${repo}/git/tags`, {
      tag: tagName,
      message: tagName,
      object: latestCommitSHA,
      type: 'commit',
    });

    await GH.post(`/repos/${owner}/${repo}/git/refs`, {
      ref: `refs/tags/${tagName}`,
      sha: tagResponse.data.sha,
    });

    return tagName;
  }

  async function createRelease(tagName: string, title: string, description: string) {
    const response = await GH.post(`/repos/${owner}/${repo}/releases`, {
      tag_name: tagName,
      name: title,
      body: description,
      draft: false,
      prerelease: false,
    });

    return response.data; // Return the release ID
  }

  async function getLatestCommitHash(branch: string) {
    const response = await GH.get(`/repos/${owner}/${repo}/branches/${branch}`);
    return response.data.commit.sha;
  }

  return {
    createRelease: createReleaseFull,
  };
}

export async function getGithubRepoReleases(owner: string, repo: string) {
  if (!GH) throw new Error('Missing GITHUB_TOKEN environment variable');

  const response = await GH.get(`/repos/${owner}/${repo}/releases`);

  return response.data;
}

export function createAndOpenPRUrl(
  forkOwner: string,
  forkRepo: string,
  upstreamOwner: string,
  upstreamRepo: string,
  branch: string,
  title: string,
  description: string,
) {
  const baseUrl = `https://github.com/${forkOwner}/${forkRepo}/compare/${branch}...${upstreamOwner}:${upstreamRepo}:${branch}`;
  const params = new URLSearchParams({
    title,
    body: description,
    expand: '1',
  }).toString();

  const prUrl = `${baseUrl}?${params}`;
  console.log(`Opening PR URL: ${prUrl}`);
  open(prUrl);
}

export function extractOwnerAndRepoFromGithubUrl(url: string) {
  if (!url.startsWith('https://github.com')) {
    throw new Error('Must be a Github URL');
  }

  const match = url.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?/);
  if (!match) {
    throw new Error('Invalid GitHub repository URL');
  }

  return [match[1], match[2]];
}

//  ██████╗ ████████╗██╗  ██╗███████╗██████╗
// ██╔═══██╗╚══██╔══╝██║  ██║██╔════╝██╔══██╗
// ██║   ██║   ██║   ███████║█████╗  ██████╔╝
// ██║   ██║   ██║   ██╔══██║██╔══╝  ██╔══██╗
// ╚██████╔╝   ██║   ██║  ██║███████╗██║  ██║
//  ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝

export function extractChangelogContent(changelog: string, version: string): string | null {
  const regex = new RegExp(`# ${version}\\n([\\s\\S]*?)(?=\\n# \\d|$)`);
  const match = changelog.match(regex);

  return match ? match[1].trim() : null;
}
