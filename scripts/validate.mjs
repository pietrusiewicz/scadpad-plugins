#!/usr/bin/env node
/**
 * Sprawdza, czy każdy plugin z plugins/index.json da się zaimportować i czy
 * spełnia kontrakt: eksportuje setup() i zgadza się z wpisem w indeksie.
 *
 * Uruchamiane lokalnie (`node scripts/validate.mjs`) i w CI.
 */
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX = join(ROOT, 'plugins', 'index.json');

const problems = [];

const index = JSON.parse(await readFile(INDEX, 'utf8'));
if (!Array.isArray(index.plugins)) {
  console.error('plugins/index.json: brak tablicy "plugins"');
  process.exit(1);
}

const seen = new Set();

for (const entry of index.plugins) {
  const where = `plugins/index.json → ${entry?.id ?? '?'}`;

  if (!entry?.id || !entry?.path) {
    problems.push(`${where}: brak "id" lub "path"`);
    continue;
  }
  if (seen.has(entry.id)) {
    problems.push(`${where}: zduplikowane id`);
    continue;
  }
  seen.add(entry.id);

  if (!/^[a-z0-9][a-z0-9-]*$/.test(entry.id)) {
    problems.push(`${where}: id musi być kebab-case`);
  }

  const file = join(ROOT, 'plugins', entry.path, 'index.js');
  let module;
  try {
    module = await import(pathToFileURL(file).href);
  } catch (error) {
    problems.push(`${where}: nie da się zaimportować ${file} — ${error.message}`);
    continue;
  }

  const plugin = module.default;
  if (!plugin || typeof plugin.setup !== 'function') {
    problems.push(`${where}: moduł nie eksportuje obiektu z setup()`);
    continue;
  }
  if (plugin.id && plugin.id !== entry.id) {
    problems.push(`${where}: plugin podaje id "${plugin.id}"`);
  }
  if (!entry.version) {
    problems.push(`${where}: brak "version"`);
  }

  console.log(`  ok   ${entry.id} ${entry.version ?? ''}`.trimEnd());
}

// Katalogi bez wpisu w indeksie są prawdopodobnie pomyłką.
for (const dirent of await readdir(join(ROOT, 'plugins'), { withFileTypes: true })) {
  if (dirent.isDirectory() && !seen.has(dirent.name)) {
    problems.push(`plugins/${dirent.name}: katalog istnieje, ale nie ma go w index.json`);
  }
}

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(ów):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`\nOK — ${seen.size} plugin(ów) spełnia kontrakt.`);
