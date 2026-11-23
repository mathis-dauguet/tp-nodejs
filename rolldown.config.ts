import { defineConfig } from 'rolldown';
import run from '@rollup/plugin-run';

const isDev = process.env.ROLLDOWN_WATCH === 'true';

export default defineConfig({
    input: 'src/index.ts',
    platform: 'node',
    output: {
        file: 'dist/index.js',
        format: 'esm',
        sourcemap: true,
    },
    tsconfig: true,
    plugins: [isDev && run({ allowRestarts: true })].filter(Boolean),
});