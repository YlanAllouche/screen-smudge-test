import fs from 'node:fs';
import path from 'node:path';
import { isBinaryFileSync } from 'isbinaryfile';

function walk(directory, parents = []) {
  const real = fs.realpathSync(directory);
  if (parents.includes(real)) return '⟦ CYCLE ⟧';
  return fs.readdirSync(directory).sort().map(name => {
    const file = path.join(directory, name);
    const stat = fs.statSync(file);
    return stat.isDirectory()
      ? `⟦ ${name}/ ⟧${walk(file, [...parents, real])}⟦ ../ ⟧`
      : stat.isFile() && !isBinaryFileSync(file)
        ? `⟦ START ${name} ⟧${fs.readFileSync(file, 'utf8')}⟦ END ${name} ⟧`
        : '';
  }).join('');
}

export function readFolder(directory) {
  return `⟦ ${path.basename(directory)}/ ⟧${walk(directory)}⟦ END FOLDER ⟧`;
}
