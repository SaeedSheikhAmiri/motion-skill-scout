#!/usr/bin/env node
// © 2026 Saeed SheikhAmiri — Motion Skill Scout Community License v1.0

import { existsSync, readFileSync, statSync } from 'node:fs';
import { hashDir } from './lib/manifest.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const file = flag('--file', 'skills.lock.json');
const json = args.includes('--json');

if (!existsSync(file)) {
  console.error(`verify-lock: '${file}' not found. Install something with vendor.sh + lock.mjs first.`);
  process.exit(2);
}

let lock;
try {
  lock = JSON.parse(readFileSync(file, 'utf8'));
} catch (error) {
  console.error(`verify-lock: cannot parse ${file}: ${error.message}`);
  process.exit(2);
}

const results = [];
for (const item of lock.skills || []) {
  if (!existsSync(item.path) || !statSync(item.path).isDirectory()) {
    results.push({ repo: item.repo, path: item.path, status: 'missing', detail: 'installed folder is gone' });
    continue;
  }
  const current = hashDir(item.path);
  if (current.manifest === item.manifest) {
    results.push({ repo: item.repo, path: item.path, status: 'ok', detail: `${current.files} files unchanged` });
    continue;
  }
  const before = new Map((item.entries || []).map((entry) => [entry.path, entry.sha256]));
  const after = new Map(current.entries.map((entry) => [entry.path, entry.sha256]));
  const changed = [...after.keys()].filter((path) => before.has(path) && before.get(path) !== after.get(path));
  const added = [...after.keys()].filter((path) => !before.has(path));
  const removed = [...before.keys()].filter((path) => !after.has(path));
  results.push({
    repo: item.repo,
    path: item.path,
    status: 'drift',
    detail: `changed ${changed.length}, added ${added.length}, removed ${removed.length}`,
    changed: changed.slice(0, 10),
    added: added.slice(0, 10),
    removed: removed.slice(0, 10),
  });
}

const bad = results.filter((result) => result.status !== 'ok');

if (json) {
  console.log(JSON.stringify({ ok: bad.length === 0, checked: results.length, results }, null, 2));
} else if (!results.length) {
  console.log('No entries in the lockfile.');
} else {
  console.log(`MOTION SKILL SCOUT — lockfile check (${results.length} entries)\n`);
  for (const result of results) {
    const mark = result.status === 'ok' ? 'ok    ' : result.status.toUpperCase().padEnd(6);
    console.log(`${mark} ${result.repo.padEnd(42)} ${result.detail}`);
    if (result.status === 'drift') {
      for (const path of result.changed) console.log(`         changed: ${path}`);
      for (const path of result.added) console.log(`         added:   ${path}`);
      for (const path of result.removed) console.log(`         removed: ${path}`);
    }
  }
  console.log(
    bad.length
      ? '\nDrift detected. Review the files, then re-approve and re-run lock.mjs. No automatic update is allowed.'
      : '\nEvery installed skill matches its approved snapshot.',
  );
}

process.exit(bad.length ? 1 : 0);