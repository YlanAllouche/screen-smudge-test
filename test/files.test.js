import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { readFolder } from '../src/files.js';

test('includes hidden and extensionless text, follows links, skips binary data and stops cycles', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'smudge-files-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, '.hidden'));
  await fs.writeFile(path.join(root, '.hidden/note.md'), 'A hidden note.');
  await fs.writeFile(path.join(root, 'Dockerfile'), 'FROM example\n');
  await fs.writeFile(path.join(root, 'binary.txt'), Buffer.from([0, 255, 0, 1]));
  await fs.symlink('.hidden/note.md', path.join(root, 'note-link'));
  await fs.symlink('binary.txt', path.join(root, 'binary-link'));
  await fs.symlink('..', path.join(root, '.hidden/back'), 'dir');
  const text = readFolder(root);
  assert(text.includes('⟦ .hidden/ ⟧'));
  assert(text.includes('⟦ START note-link ⟧A hidden note.⟦ END note-link ⟧'));
  assert(text.includes('⟦ START Dockerfile ⟧FROM example\n⟦ END Dockerfile ⟧'));
  assert(text.includes('⟦ CYCLE ⟧'));
  assert(!text.includes('START binary'));
});
