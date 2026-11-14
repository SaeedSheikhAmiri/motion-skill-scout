#!/usr/bin/env node
// © 2026 Saeed SheikhAmiri — Motion Skill Scout Community License v1.0

import { existsSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { findSkills, hashDir } from './lib/manifest.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const target = flag('--path');
const repo = flag('--repo');
const commit = flag('--commit');
const license = flag('--license', 'unknown');
const licenseClass = flag('--license-class');
const note = flag('--note');
const file = flag('--file', 'skills.lock.json');

if (!target || !repo || !commit) {
  console.error('usage: lock.mjs --path <dir> --repo <owner/repo> --commit <sha> [--license <name>] [--file skills.lock.json]');
  process.exit(2);
}
if (!/^[0-9a-f]{40}$/.test(commit)) {
  console.error('lock: --commit must be a full 40-character SHA');
  process.exit(2);
}
if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
  console.error('lock: --repo must be owner/repo');
  process.exit(2);
}
if (!existsSync(target) || !statSync(target).isDirectory()) {
  console.error(`lock: '${target}' is not a directory`);
  process.exit(2);
}

const { manifest, files, entries } = hashDir(target);
const skills = findSkills(target);
const now = new Date().toISOString();

let lock = { version: 1, updatedAt: now, skills: [] };
if (existsSync(file)) {
  try {
    lock = JSON.parse(readFileSync(file, 'utf8'));
    if (!Array.isArray(lock.skills)) throw new Error('missing skills array');
  } catch (error) {
    console.error(`lock: cannot parse ${file}: ${error.message}`);
    process.exit(2);
  }
}

const record = {
  repo,
  source: `https://github.com/${repo}`,
  path: target,
  commit,
  license,
  ...(licenseClass ? { licenseClass } : {}),
  skillNames: skills.map((skill) => skill.name).filter(Boolean),
  manifest,
  files,
  entries,
  ...(note ? { note } : {}),
  updatedAt: now,
};

const index = lock.skills.findIndex((item) => item.repo === repo && item.path === target);
if (index >= 0) lock.skills[index] = { ...lock.skills[index], ...record, installedAt: lock.skills[index].installedAt || now };
else lock.skills.push({ ...record, installedAt: now });

lock.version = 1;
lock.updatedAt = now;
writeFileSync(file, `${JSON.stringify(lock, null, 2)}\n`);

console.log(`locked ${repo} @ ${commit.slice(0, 8)}`);
console.log(`  path:     ${target}`);
console.log(`  skills:   ${skills.length}${skills.length ? ` (${skills.map((s) => s.name).filter(Boolean).join(', ')})` : ''}`);
console.log(`  files:    ${entries.length}`);
console.log(`  manifest: ${manifest.slice(0, 16)}…`);
console.log(`  lockfile: ${file}`);
console.log('Updates are now manual: re-run verify-lock.mjs to detect drift.');