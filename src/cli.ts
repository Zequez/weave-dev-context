#!/usr/bin/env bun
import { App } from '@axiosleo/cli-tool';
import BuildCommand from './commands/build';
import DevCommand from './commands/dev';
import ShellCommand from './commands/shell';
import InitCommand from './commands/init';

const app = new App({
  name: 'wdc', // cli app command name, required
  version: '0.1.1', // cli app version, required
  desc: 'Set of commands to use the Weave Dev Context',
  commands_sort: [],
});

app.register(BuildCommand);
app.register(DevCommand);
app.register(ShellCommand);
app.register(InitCommand);
app.start();
