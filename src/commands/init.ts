import { Command } from '@axiosleo/cli-tool';
import initialize from 'src/lib/initialize';
import { happDirPath } from 'src/utils';

export default class InitCommand extends Command {
  constructor() {
    super({
      name: 'init',
      desc: 'Initializes a directory with links and some configuration files',
    });
  }

  async exec(args: any, options: any, argList: any, app: any) {
    initialize({ happDirPath });
  }
}
