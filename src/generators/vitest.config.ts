import { defineConfig } from 'vitest/config';

export default function generateConfig(config: any) {
  return defineConfig({
    test: {
      globals: true,
      environment: 'node',
    },
  });
}
