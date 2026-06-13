import { build, context } from 'esbuild';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outdir = resolve(__dirname, 'dist');
const watch = process.argv.includes('--watch');

rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });

const entryPoints = {
  'background/service-worker': 'src/background/service-worker.ts',
  'content/index': 'src/content/index.ts',
  'popup/popup': 'src/popup/popup.ts',
  'options/options': 'src/options/options.ts',
};

/** Copy static assets (manifest, html, css, icons) into dist. */
function copyStatic() {
  cpSync(resolve(__dirname, 'manifest.json'), resolve(outdir, 'manifest.json'));
  cpSync(resolve(__dirname, 'src/popup/popup.html'), resolve(outdir, 'popup/popup.html'));
  cpSync(resolve(__dirname, 'src/popup/popup.css'), resolve(outdir, 'popup/popup.css'));
  cpSync(resolve(__dirname, 'src/options/options.html'), resolve(outdir, 'options/options.html'));
  cpSync(resolve(__dirname, 'icons'), resolve(outdir, 'icons'), { recursive: true });
}

const options = {
  entryPoints,
  outdir,
  bundle: true,
  format: 'esm',
  target: 'chrome114',
  sourcemap: watch ? 'inline' : false,
  logLevel: 'info',
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  copyStatic();
  console.log('[geoscout-ext] watching…');
} else {
  await build(options);
  copyStatic();
  console.log('[geoscout-ext] built → dist/');
}
