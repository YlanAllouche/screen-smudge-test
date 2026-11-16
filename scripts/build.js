import { build, transform } from 'esbuild';
import { readFile, mkdir, chmod } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const browser = await build({
  absWorkingDir: root,
  entryPoints: ['src/browser/app.js'],
  bundle: true,
  minify: true,
  platform: 'browser',
  target: 'es2022',
  write: false,
});
const css = await transform(await readFile(new URL('../src/browser/styles.css', import.meta.url), 'utf8'), {
  loader: 'css', minify: true,
});
const html = (await readFile(new URL('../src/browser/index.html', import.meta.url), 'utf8'))
  .replace('<link rel="stylesheet" href="styles.css">', `<style>${css.code.trim()}</style>`)
  .replace('<script src="app.js"></script>', () => `<script>${browser.outputFiles[0].text.trim()}</script>`)
  .replace(/>\s+</g, '><')
  .trim();

await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await build({
  absWorkingDir: root,
  entryPoints: ['src/cli.js'],
  outfile: 'dist/screen-smudge-test.cjs',
  bundle: true,
  minify: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  packages: 'external',
  plugins: [{
    name: 'inline-page',
    setup(builder) {
      builder.onResolve({ filter: /^smudge:page$/ }, () => ({ path: 'page', namespace: 'inline-page' }));
      builder.onLoad({ filter: /.*/, namespace: 'inline-page' }, () => ({ contents: `export default ${JSON.stringify(html)}` }));
    },
  }],
});
await chmod(new URL('../dist/screen-smudge-test.cjs', import.meta.url), 0o755);
