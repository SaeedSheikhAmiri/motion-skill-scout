// © 2026 Saeed SheikhAmiri — Motion Skill Scout Community License v1.0

import { createHash } from 'node:crypto';
import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.cache', '__pycache__', '.venv', 'venv']);

export function walk(root, current = root, files = []) {
  for (const name of readdirSync(current)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(current, name);
    const stat = lstatSync(full);
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) walk(root, full, files);
    else if (stat.isFile()) files.push({ full, rel: relative(root, full).split(sep).join('/'), size: stat.size });
  }
  return files;
}

export function hashDir(root) {
  const files = walk(root).sort((a, b) => a.rel.localeCompare(b.rel));
  const aggregate = createHash('sha256');
  const entries = [];
  for (const file of files) {
    const hash = createHash('sha256').update(readFileSync(file.full)).digest('hex');
    entries.push({ path: file.rel, size: file.size, sha256: hash });
    aggregate.update(`${file.rel}\0${hash}\n`);
  }
  return { manifest: aggregate.digest('hex'), files: entries.length, entries };
}

export function frontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!item) continue;
    let value = item[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[item[1]] = value;
  }
  return data;
}

export function findSkills(root) {
  return walk(root)
    .filter((file) => file.rel.split('/').pop() === 'SKILL.md')
    .map((file) => {
      const meta = frontmatter(readFileSync(file.full, 'utf8'));
      return { name: meta.name || null, description: meta.description || null, path: file.rel, dir: file.rel.split('/').slice(0, -1).join('/') || '.' };
    });
}