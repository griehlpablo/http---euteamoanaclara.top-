import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectDir = resolve(scriptDir, '..');
const distDir = join(projectDir, 'dist');
const rootDir = resolve(projectDir, '..');

const entries = await readdir(distDir, { withFileTypes: true });

for (const entry of entries) {
  const source = join(distDir, entry.name);
  const target = join(rootDir, entry.name);

  await rm(target, { recursive: true, force: true });

  if (entry.isDirectory()) {
    await mkdir(target, { recursive: true });
    await cp(source, target, { recursive: true, force: true });
  } else {
    await cp(source, target, { force: true });
  }
}

console.log(`Build publicado na raiz: ${entries.map((entry) => entry.name).join(', ')}`);
