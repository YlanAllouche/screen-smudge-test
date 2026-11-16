import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createPlayer } from '../src/player.js';

const executable = fileURLToPath(new URL('../dist/screen-smudge-test.cjs', import.meta.url));

test('built executable serves an embedded browser using the same player', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'smudge-built-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.writeFile(path.join(root, 'note.md'), 'A realistic note.\n\n    Check the next task.\n');
  const server = spawn(process.execPath, [executable, '.', '0'], {
    cwd: root, env: { ...process.env, HOST: '127.0.0.1' },
  });
  t.after(() => server.kill());
  const address = await new Promise((resolve, reject) => {
    server.on('error', reject);
    server.on('exit', code => reject(new Error(`Server exited: ${code}`)));
    server.stdout.once('data', data => resolve(data.toString().trim().split(' ').at(-1)));
  });
  const html = await (await fetch(address)).text();
  const text = await (await fetch(address + '/text')).text();
  assert(text.startsWith(`⟦ ${path.basename(root)}/ ⟧`));
  assert(html.includes('<style>'));
  assert(!html.includes('src="app.js"'));
  assert(!html.includes('href="styles.css"'));
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const classes = new Set();
  let glyphs = [], tick;
  const context = {
    scale() {}, measureText: () => ({ width: 10 }),
    fillRect() { glyphs = []; },
    fillText(character, x, y) { glyphs.push({ character, x, y }); },
  };
  const elements = {
    screen: { clientWidth: 100, clientHeight: 78, getContext: () => context },
    font: { value: 'monospace' }, play: {}, stream: { setAttribute() {} },
    speed: { value: '1000' }, unit: {}, position: {}, theme: {},
  };
  vm.runInNewContext(script, {
    Intl, devicePixelRatio: 1,
    document: {
      getElementById: id => elements[id], addEventListener() {},
      body: { classList: { toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); } } },
    },
    fetch: async () => ({ text: async () => text }),
    ResizeObserver: class { observe() {} },
    requestAnimationFrame: callback => { tick = callback; },
  });
  await new Promise(resolve => setImmediate(resolve));
  const player = createPlayer(text);
  player.resize(10, 3);
  const compare = () => assert.deepEqual(glyphs.map(glyph => glyph.character), Array.from({ length: player.cells }, (_, index) => player.character(index)));
  compare();
  assert(glyphs[0].x < glyphs[1].x);
  elements.play.onclick(); player.togglePlay();
  assert(classes.has('idle'));
  tick(0); tick(1000); player.advance(1000); compare();
  elements.stream.onclick(); player.toggleStream();
  tick(1100); player.advance(100); compare();
  elements.play.onclick(); player.togglePlay();
  assert(!classes.has('idle'));
  tick(5000); compare();
});
