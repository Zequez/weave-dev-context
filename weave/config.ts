import { defineConfig, type AgentSpecifier } from '@theweave/cli';
import path from 'path';
import { WDC_PATH } from '../scripts/utils.ts';
import fs from 'node:fs';

export default function generateConfig({
  rootPath,
  happ,
  uiPort,
  agents,
}: {
  rootPath: string;
  happ: string;
  uiPort: number;
  agents: number;
}) {
  if (agents < 1) throw 'Agents must be 1 or more';

  const happIconPng = path.join(rootPath, './icon.png');
  const happIconSvg = path.join(rootPath, './icon.png');
  const defaultIcon = path.join(WDC_PATH, './weave/icons/moss-dev.png');

  const iconPath = fs.existsSync(happIconPng)
    ? happIconPng
    : fs.existsSync(happIconSvg)
    ? happIconSvg
    : defaultIcon;

  const joiningAgents = agents - 1;
  const joiningIdx = [...new Array(joiningAgents)].map((_, i) => i + 2);
  return defineConfig({
    toolCurations: [],
    groups: [
      {
        name: 'Weave Dev Context',
        networkSeed: '098rc1m-09384u-crm-29384u-cmkj',
        icon: {
          type: 'filesystem',
          path: path.join(WDC_PATH, './weave/icons/moss-dev.png'),
        },
        creatingAgent: {
          agentIdx: 1,
          agentProfile: {
            nickname: 'Dog',
            avatar: {
              type: 'filesystem',
              path: path.join(WDC_PATH, './weave/icons/dog.png'),
            },
          },
        },
        joiningAgents: (
          [
            {
              agentIdx: 2,
              agentProfile: {
                nickname: 'Cat',
                avatar: {
                  type: 'filesystem',
                  path: path.join(WDC_PATH, './weave/icons/cat.png'),
                },
              },
            },
            {
              agentIdx: 3,
              agentProfile: {
                nickname: 'Horse',
                avatar: {
                  type: 'filesystem',
                  path: path.join(WDC_PATH, './weave/icons/horse.png'),
                },
              },
            },
            {
              agentIdx: 4,
              agentProfile: {
                nickname: 'Monkey',
                avatar: {
                  type: 'filesystem',
                  path: path.join(WDC_PATH, './weave/icons/monkey.png'),
                },
              },
            },
            {
              agentIdx: 5,
              agentProfile: {
                nickname: 'Pig',
                avatar: {
                  type: 'filesystem',
                  path: path.join(WDC_PATH, './weave/icons/pig.png'),
                },
              },
            },
          ] satisfies AgentSpecifier[]
        ).slice(0, joiningAgents),
        applets: [
          {
            name: happ,
            instanceName: happ,
            registeringAgent: 1,
            joiningAgents: joiningIdx,
          },
          {
            name: 'kando',
            instanceName: 'kando',
            registeringAgent: 1,
            joiningAgents: joiningIdx,
          },
        ],
      },
    ],
    applets: [
      {
        name: happ,
        subtitle: happ,
        description: happ,
        icon: {
          type: 'filesystem',
          path: iconPath,
        },
        source: {
          type: 'localhost',
          happPath: path.join(rootPath, `./dist/dnas/${happ}.happ`),
          uiPort,
        },
      },
      {
        name: 'kando',
        subtitle: 'kanban boards',
        description: 'Real-time kanban boards based on syn',
        icon: {
          type: 'https',
          url: 'https://raw.githubusercontent.com/holochain-apps/kando/main/we_dev/kando_icon.png',
        },
        source: {
          type: 'https',
          url: 'https://github.com/holochain-apps/kando/releases/download/v0.10.9/kando.webhapp',
        },
      },
      //   {
      //   name: 'notebooks',
      //   subtitle: 'Collaborative note taking',
      //   description: 'Real-time notetaking based on syn',
      //   icon: {
      //     type: 'https',
      //     url: 'https://lightningrodlabs.org/projects/notebooks_logo.svg',
      //   },
      //   source: {
      //     type: 'https',
      //     url: 'https://github.com/lightningrodlabs/notebooks/releases/download/v0.2.10/notebooks.webhapp',
      //   },
      // },
    ],
  });
}
