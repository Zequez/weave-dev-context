import { spawn } from 'node:child_process';
import chalk from 'chalk';

const childProcesses: ReturnType<typeof spawn>[] = [];

const colors = [chalk.yellow, chalk.blue, chalk.green, chalk.magenta];

function cleanup() {
  console.log(chalk.bgBlueBright('WDC Exitting...'));
  if (childProcesses.length) {
    console.log(`${childProcesses.length} child process to terminate...`);
    childProcesses.forEach((child) => {
      setTimeout(() => {
        if (!child.killed) {
          if (child.kill()) {
            console.log('Child exitted');
          }
        }
      }, 0);
    });
  }
  process.exit(); // Exit the main process
}

export async function runCommand(cmd: string, prefix = true) {
  console.log('>', cmd);
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, [], {
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: 'true' },
    });

    const i = childProcesses.push(child);
    const color = colors[(i - 1) % colors.length];

    child.stdout.on('data', (data) => {
      process.stdout.write(prefix ? color(`[${i}] ${data.toString()}`) : data.toString());
    });

    child.stderr.on('data', (data) => {
      process.stderr.write(
        prefix ? chalk.bgRedBright(`[${i}]`) + color(` ${data.toString()}`) : data.toString(),
      );
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve('Process completed successfully');
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
}

process.on('SIGINT', () => process.exit()); // Handle Ctrl+C
process.on('SIGTERM', () => process.exit()); // Handle termination signals
process.on('exit', cleanup); // Cleanup on process exit
