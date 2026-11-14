#!/usr/bin/env node
// © 2026 Saeed SheikhAmiri — Motion Skill Scout Community License v1.0
// Deterministic stack ranking. No network access, no installs.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CATALOG_URL = new URL('../references/catalog.json', import.meta.url);

const OUTPUT_TAGS = {
  'talking-head': ['talking-head', 'lower-thirds', 'b-roll', 'word-timed', 'captions'],
  promo: ['promo', 'kinetic', 'titles'],
  explainer: ['explainer', 'storyboard', 'paper', 'collage', 'pipeline'],
  shorts: ['shorts', 'vertical', 'captions', 'safe-areas'],
  data: ['data', 'charts', 'maps', 'csv'],
  'math-3d': ['math', 'science', '3d', 'diagrams'],
  unsure: [],
};

const STYLE_TAGS = {
  'paper-dossier': ['paper', 'dossier', 'collage', 'halftone', 'riso', 'scrapbook'],
  'clean-tech': ['clean-tech', 'minimal', 'deterministic', 'web'],
  kinetic: ['kinetic', 'typography'],
  'news-data': ['news', 'data', 'charts', 'maps'],
  cinematic: ['cinematic', 'continuous-camera'],
};

const ALLOWED = {
  output: Object.keys(OUTPUT_TAGS),
  engine: ['remotion', 'html', 'after-effects', 'manim', 'none'],
  aspect: ['9:16', '16:9', '1:1', 'both'],
  language: ['fa', 'ar', 'en', 'bilingual', 'other'],
  footage: ['talking-head', 'product', 'none'],
  captions: ['burned', 'srt', 'none'],
  usage: ['commercial', 'personal', 'open-source'],
  level: ['beginner', 'advanced', 'full-pipeline'],
  style: ['paper-dossier', 'clean-tech', 'kinetic', 'news-data', 'cinematic', 'none'],
};

const RTL_LANGS = new Set(['fa', 'ar', 'bilingual']);
const ENGINE_BASELINE = {
  remotion: 'remotion-official',
  html: 'hyperframes',
  manim: 'manim-skill',
};

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const has = (name) => args.includes(name);

main();

function main() {
  if (has('--help') || has('-h')) {
    console.log('Usage: node recommend.mjs --answers <answers.json> [--json] [--top N]\n       node recommend.mjs --list');
    process.exit(0);
  }

  const catalog = JSON.parse(readFileSync(CATALOG_URL, 'utf8'));

  if (has('--list')) {
    list(catalog);
    return;
  }

  const answersPath = flag('--answers');
  if (!answersPath) fail('Missing --answers <file>. Run with --list to inspect the catalog.');

  let answers;
  try {
    answers = JSON.parse(readFileSync(answersPath, 'utf8'));
  } catch (error) {
    fail(`Cannot read answers JSON: ${error.message}`);
  }

  const { normalized, warnings } = normalizeAnswers(answers);
  if (!normalized.output && !normalized.engine) {
    fail('At least "output" or "engine" is required. See references/scoring.md.');
  }

  const scored = catalog.entries
    .filter((entry) => entry.installable !== false && entry.kind !== 'catalog')
    .map((entry) => ({ entry, ...score(entry, normalized) }));
  const excludedItems = scored
    .filter((item) => item.excluded)
    .map((item) => ({ id: item.entry.id, repo: item.entry.repo, reason: item.excluded }));
  const raw = scored
    .filter((item) => !item.excluded)
    .sort((a, b) => b.score - a.score);

  const baseline = pickBaseline(catalog, normalized, raw);
  const primaryPool = raw.filter((item) => {
    if (item.entry.id === baseline?.entry.id) return false;
    if (!item.entry.roles.includes('primary')) return false;
    if (normalized.output === 'math-3d') {
      return item.entry.tags.some((tag) => ['math', 'manim', 'science'].includes(tag));
    }
    return true;
  });
  const primary = normalized.output === 'math-3d' && baseline?.entry.id === 'manim-skill' ? null : primaryPool[0];
  const utility = pickUtility(raw, normalized, primary);
  const selected = new Set([baseline?.entry.id, primary?.entry.id, utility?.entry.id].filter(Boolean));

  const stack = {
    baseline: baseline ? shape(baseline, normalized) : null,
    primary: primary ? shape(primary, normalized) : null,
    utility: utility ? shape(utility, normalized) : null,
  };

  const alternatives = raw
    .filter((item) => !selected.has(item.entry.id) && item.entry.roles.includes('primary'))
    .filter((item) => normalized.output !== 'math-3d' || item.entry.tags.some((tag) => ['math', 'manim', 'science'].includes(tag)))
    .slice(0, Math.max(0, Number(flag('--top') || 4)))
    .map((item) => shape(item, normalized));

  if (!baseline) {
    warnings.push(
      normalized.engine === 'after-effects'
        ? 'No baseline for After Effects: these skills generate assets; render alpha overlays and import them into Premiere/AE.'
        : 'No engine chosen: baseline omitted. Pick Remotion for data-driven work or HyperFrames for HTML-native motion.',
    );
  }
  if (primary) {
    for (const note of primary.notes) warnings.push(`${primary.entry.name}: ${note}`);
  } else if (baseline) {
    warnings.push('One install is enough here: the baseline also covers the primary role.');
  }

  const result = {
    snapshot: catalog.snapshot,
    answers: normalized,
    stack,
    alternatives,
    excluded: excludedItems,
    warnings: [...new Set(warnings)],
  };

  if (has('--json')) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  printHuman(result);
}

function normalizeAnswers(input) {
  const normalized = {};
  const warnings = [];
  for (const key of Object.keys(ALLOWED)) {
    let value = input[key];
    if (value === undefined || value === null || value === '') continue;
    value = String(value).trim().toLowerCase();
    if (value === 'vertical') value = '9:16';
    if (value === 'landscape') value = '16:9';
    if (value === 'square') value = '1:1';
    if (value === 'persian' || value === 'farsi') value = 'fa';
    if (value === 'arabic') value = 'ar';
    if (value === 'english') value = 'en';
    if (value === 'open source' || value === 'open_source') value = 'open-source';
    if (value === 'motion only') value = 'none';
    if (value === 'math' || value === '3d') value = 'math-3d';
    if (!ALLOWED[key].includes(value)) {
      warnings.push(`Unknown ${key}="${input[key]}"; treated as neutral.`);
      continue;
    }
    normalized[key] = value;
  }
  return { normalized, warnings };
}

function score(entry, a) {
  let score = 0;
  const why = [];
  const notes = [];

  if (a.usage === 'commercial') {
    if (entry.licenseClass === 'noncommercial') {
      return { excluded: 'Noncommercial license and commercial usage', score: -1, why, notes };
    }
    if (entry.licenseClass === 'permissive') {
      score += 12;
      why.push('commercially permissive license');
    }
    if (entry.licenseClass === 'unclear') {
      score -= 12;
      notes.push('license metadata is unclear; get written permission before client work');
    }
    if (entry.licenseClass === 'copyleft') notes.push('AGPL: check obligations if you expose it as a service');
    if (entry.licenseClass === 'vendor') notes.push('vendor license; check the free/commercial threshold');
  }

  if (entry.engines.includes('any')) score += 10;
  if (a.engine) {
    if (a.engine === 'none') {
      score += entry.engines.includes('any') ? 8 : 3;
    } else if (entry.engines.includes(a.engine)) {
      score += 30;
      why.push(`matches ${a.engine}`);
    } else if (a.engine === 'after-effects' && (entry.engines.includes('premiere') || entry.engines.includes('after-effects'))) {
      score += 20;
      why.push('produces alpha assets for Premiere/AE');
    } else if (entry.engines.includes('any')) {
      score += 12;
    } else {
      score -= 28;
      notes.push(`built for ${entry.engines.join(', ')}, not ${a.engine}; expect a port`);
    }
    if (a.engine === 'after-effects' && entry.tags.includes('alpha')) {
      score += 25;
      why.push('real alpha output for the NLE');
    }
  }

  const outputHits = entry.tags.filter((tag) => (OUTPUT_TAGS[a.output] || []).includes(tag));
  if (outputHits.length) {
    score += Math.min(36, outputHits.length * 12);
    why.push(`covers ${outputHits.slice(0, 3).join(', ')}`);
  }
  const styleHits = entry.tags.filter((tag) => (STYLE_TAGS[a.style] || []).includes(tag));
  if (styleHits.length) {
    score += Math.min(24, styleHits.length * 12);
    if (a.style && a.style !== 'none') score += 8;
    why.push(`matches the ${a.style} look`);
  }

  if (a.footage === 'talking-head') {
    if (entry.tags.includes('talking-head')) { score += 12; why.push('designed for talking-head footage'); }
    if (entry.tags.includes('b-roll')) score += 8;
  }
  if (a.footage === 'product' && (entry.tags.includes('promo') || entry.tags.includes('logo'))) score += 10;
  if (a.footage === 'none' && entry.tags.includes('motion-design')) score += 6;

  if (a.captions === 'burned') {
    if (entry.tags.includes('captions')) { score += 15; why.push('handles burned-in captions'); }
    if (entry.tags.includes('word-timed')) score += 8;
  }
  if (a.captions === 'srt') {
    if (entry.tags.includes('captions') || entry.tags.includes('srt')) score += 8;
  }

  if (a.aspect && a.aspect !== 'both' && entry.aspect.includes(a.aspect)) score += 8;
  if (a.aspect === 'both' && entry.aspect.length > 1) score += 4;

  if (a.language && RTL_LANGS.has(a.language)) {
    if (entry.rtl === true) { score += 25; why.push('RTL-aware'); }
    else notes.push('no explicit RTL guidance; test shaping, bidi and font metrics');
  }

  if (a.level === 'beginner') {
    if (entry.kind === 'pipeline') score += 18;
    if (entry.kind === 'official') score += 10;
    if (entry.kind === 'craft' || entry.kind === 'aesthetic') score += 2;
  }
  if (a.level === 'advanced' && (entry.kind === 'craft' || entry.kind === 'editing')) score += 10;
  if (a.level === 'full-pipeline' && entry.kind === 'pipeline') score += 22;

  if (entry.kind === 'official') score += 8;
  if (entry.kind === 'engine') score += 6;
  if (entry.kind === 'pipeline') score += 4;
  if (entry.kind === 'craft' || entry.kind === 'aesthetic' || entry.kind === 'editing') score += 3;

  const signal = Math.max(entry.stars || 0, entry.hubStars ? entry.hubStars / 10 : 0);
  score += Math.min(8, Math.log10(signal + 1) * 2);

  return { score: Math.round(score), why, notes };
}

function pickBaseline(catalog, a, raw) {
  const id = ENGINE_BASELINE[a.engine];
  if (id) {
    const item = raw.find((entry) => entry.entry.id === id);
    if (item) return item;
  }
  return null;
}

function pickUtility(raw, a, primary) {
  if (!primary) return null;
  const needs = new Set();
  if (a.footage === 'talking-head') {
    needs.add('silence');
    needs.add('cleanup');
  } else if (a.captions === 'burned' && !primary.entry.tags.includes('captions')) {
    needs.add('captions');
  }
  if (!needs.size) return null;

  return raw.find((item) => {
    if (item.entry.roles[0] !== 'utility') return false;
    if (item.entry.id === primary.entry.id) return false;
    if (!item.entry.tags.some((tag) => needs.has(tag))) return false;
    if (item.notes.some((note) => note.includes('expect a port'))) return false;
    return item.score >= 8;
  }) || null;
}

function shape(item, a) {
  const { entry, score: total, why, notes } = item;
  return {
    id: entry.id,
    repo: entry.repo,
    name: entry.name,
    kind: entry.kind,
    role: entry.roles.includes('baseline') && entry.id === ENGINE_BASELINE[a.engine] ? 'baseline' : entry.roles[0],
    score: total,
    why: [...new Set(why)],
    notes: [...new Set(notes)],
    license: entry.license,
    licenseClass: entry.licenseClass,
    stars: entry.stars,
    hubStars: entry.hubStars || null,
    install: entry.install,
    summary: entry.summary,
  };
}

function printHuman(result) {
  const line = '─'.repeat(66);
  console.log(`\nMOTION SKILL SCOUT — recommendation (catalog ${result.snapshot})`);
  console.log(line);
  console.log(`Answers: ${Object.entries(result.answers).map(([k, v]) => `${k}=${v}`).join('  ') || '(none)'}`);
  console.log(line);

  const block = (label, item) => {
    if (!item) return;
    console.log(`\n${label}  ${item.name}`);
    console.log(`  ${item.repo}  ·  ${item.license}  ·  ★ ${item.stars}${item.hubStars ? ` (hub ${item.hubStars})` : ''}`);
    console.log(`  ${item.summary}`);
    if (item.why.length) console.log(`  Why: ${item.why.join('; ')}`);
    if (item.notes.length) console.log(`  Watch: ${item.notes.join('; ')}`);
    console.log(`  Install: ${item.install}`);
  };

  block('BASELINE', result.stack.baseline);
  if (!result.stack.primary && result.stack.baseline) console.log('\nPRIMARY   covered by the baseline install');
  block('PRIMARY ', result.stack.primary);
  block('OPTIONAL', result.stack.utility);

  if (result.alternatives.length) {
    console.log(`\n${line}\nALTERNATIVES`);
    for (const item of result.alternatives) {
      console.log(`  ${item.name} (${item.repo}) · ${item.license} · score ${item.score}`);
      if (item.notes.length) console.log(`    Watch: ${item.notes[0]}`);
    }
  }

  if (result.excluded.length) {
    console.log(`\n${line}\nEXCLUDED BY YOUR ANSWERS`);
    for (const item of result.excluded) console.log(`  ${item.repo} — ${item.reason}`);
  }

  if (result.warnings.length) {
    console.log(`\n${line}\nWARNINGS`);
    for (const warning of result.warnings) console.log(`  ! ${warning}`);
  }

  console.log(`\n${line}`);
  console.log('Nothing was installed. Ask the user for explicit approval, then pin a commit.');
}

function list(catalog) {
  console.log(`Catalog snapshot ${catalog.snapshot}\n`);
  for (const entry of catalog.entries) {
    if (entry.installable === false) continue;
    console.log(`${entry.id.padEnd(22)} ${String(entry.stars).padStart(6)}  ${entry.license.padEnd(26)} ${entry.repo}`);
  }
}

function fail(message) {
  console.error(`motion-skill-scout: ${message}`);
  process.exit(2);
}