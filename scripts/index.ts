#!/usr/bin/env bun
import { App } from '@axiosleo/cli-tool';
import BuildCommand from './commands/build';
import DevCommand from './commands/dev';
import ShellCommand from './commands/shell';

process.title = 'wdc';

const app = new App({
  name: 'wdc', // cli app command name, required
  version: '0.1.0', // cli app version, required
  desc: 'Set of commands to use the Weave Dev Context',
  commands_sort: [],
});

app.register(BuildCommand);
app.register(DevCommand);
app.register(ShellCommand);
app.start();

// import fs from 'fs';
// import { spawn } from 'child_process';

// const TARGET = 'bar';

// const scripts: { [key: string]: string } = {
//   'build-ui': 'vite build',
//   'pack-ui': `rm -f happs/${TARGET}/dist/ui.zip && bun run build-ui && cd happs/${TARGET}/dist && bestzip dist.zip *`,
//   'build-happ': 'bun run build-zomes && pack',
//   'build-zomes':
//     "RUSTFLAGS='' CARGO_TARGET_DIR=target cargo build --release --target wasm32-unknown-unknown",
//   pack: 'hc app pack dnas --recursive',
// };

// async function parse(argv: string[]) {
//   const args = argv.slice(2);
//   const availableTargets = fs.readdirSync('./happs');
//   const target = availableTargets.indexOf(args[0]) !== -1 ? args[0] : null;
//   if (!target) {
//     console.log('Target not found', target);
//     console.log('Available targets', availableTargets.join(', '));
//     return;
//   }
//   const script = args[1] in scripts ? args[1] : null;
//   if (!script) {
//     console.log('Script not found', script);
//     console.log('Available scripts: \n', JSON.stringify(script, null, 2));
//     return;
//   }

//   console.log(`Running ${target} ${script}`);
//   // Run child process
//   const scriptToRun = scripts[script];
//   const child = spawn(scriptToRun, {
//     shell: true,
//     stdio: 'inherit',
//     env: process.env,
//   });
// }

// await parse(process.argv);

// const scriptArgs = args.slice(1);
