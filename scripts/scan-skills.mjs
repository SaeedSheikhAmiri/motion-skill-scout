#!/usr/bin/env node
// © 2026 Saeed SheikhAmiri — Motion Skill Scout Community License v1.0

import { existsSync, statSync } from 'node:fs';
import { findSkills } from './lib/manifest.mjs';

const args = process.argv.slice(2);
const target = args.find((arg) => !arg.startsWith('-')) || '.';
const json = args.includes('--json');

if (!existsSync(target) || !statSync(target).isDirectory()) {
  console.error(`scan-skills: '${target}' is not a directory`);
  process.exit(2);
}

const skills = findSkills(target);

if (json) {
  console.log(JSON.stringify({ root: target, count: skills.length, skills }, null, 2));
} else {
  console.log(`Found ${skills.length} SKILL.md file(s) in ${target}\n`);
  for (const skill of skills) {
    console.log(`${(skill.name || '(no name)').padEnd(28)} ${skill.path}`);
    if (skill.description) console.log(`  ${skill.description.slice(0, 150)}`);
  }
  if (!skills.length) {
    console.log('No SKILL.md found. This repository may be a framework rather than a skill pack.');
  }
}

process.exit(skills.length ? 0 : 1);