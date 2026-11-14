#!/usr/bin/env node
// © 2026 Saeed SheikhAmiri — Motion Skill Scout Community License v1.0

import { spawnSync } from 'node:child_process';
import { statfsSync, existsSync } from 'node:fs';

const checks = [];
const add = (name, ok, detail, required = true) => checks.push({ name, ok, detail, required });

const nodeMajor = Number(process.versions.node.split('.')[0]);
add('node', nodeMajor >= 18, `v${process.versions.node}${nodeMajor >= 18 ? '' : ' — upgrade to 18+'}`);

const git = version('git', ['--version']);
add('git', Boolean(git), git || 'not found — needed for pinned installs');

const ffmpeg = version('ffmpeg', ['-version']);
add('ffmpeg', Boolean(ffmpeg), ffmpeg ? ffmpeg.split('\n')[0] : 'not found — needed for cutting, muxing and QA');

const ffprobe = version('ffprobe', ['-version']);
add('ffprobe', Boolean(ffprobe), ffprobe ? 'available' : 'not found — needed to inspect renders');

const npx = version('npx', ['--version']);
add('npx', Boolean(npx), npx ? `v${npx.trim()}` : 'not found — only needed for the optional skills CLI', false);

let disk = null;
try {
  const stats = statfsSync(process.cwd());
  disk = (stats.bavail * stats.bsize) / 1024 ** 3;
} catch {
  // statfs is not available on every platform/filesystem; disk is advisory.
}
add('disk', disk === null || disk > 2, disk === null ? 'could not measure' : `${disk.toFixed(1)} GB free — keep 2 GB for renders`, false);

add('cwd', existsSync(process.cwd()), process.cwd(), true);

const failed = checks.filter((check) => !check.ok && check.required);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ ok: failed.length === 0, checks }, null, 2));
} else {
  console.log('MOTION SKILL SCOUT — preflight\n');
  for (const check of checks) {
    const mark = check.ok ? 'ok  ' : check.required ? 'FAIL' : 'warn';
    console.log(`${mark}  ${check.name.padEnd(8)} ${check.detail}`);
  }
  console.log(`\n${failed.length ? `${failed.length} required check(s) failed.` : 'Ready for the interview.'}`);
  console.log('This does not install anything.');
}

process.exit(failed.length ? 1 : 0);

function version(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 5000 });
  if (result.error || result.status !== 0) return null;
  return (result.stdout || result.stderr || '').trim();
}