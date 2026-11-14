# Motion Skill Scout

**An interactive Agent Skill that interviews you about the motion video you want to make, recommends a matching stack of video/motion Agent Skills, and installs only what you explicitly approve — pinned to a commit.**

English · [فارسی](README.fa.md)

Most “awesome video skills” lists answer *what exists*. This skill answers *what should I install, for this project, with this footage, in this language, under this license* — and then stops before touching your machine until you say yes.

```text
You   I have a raw Persian talking-head clip. I want a paper-dossier look.
Scout Four quick questions, then:
      BASELINE  remotion-dev/skills        official · keeps the renderer frame-correct
      PRIMARY   iart-ai/b-roll-skills      MIT · word-timed B-roll, keeps original audio
      OPTIONAL  louisedesadeleer/cut-video MIT · silence and filler cleanup
      Watch: no explicit RTL guidance; test Persian shaping before the full render.
      Install this stack?  [install] [swap primary] [alternatives] [stop]
You   Install it.
Scout Resolves commits, clones pinned copies to .claude/skills/, writes skills.lock.json,
      verifies every SKILL.md, checks ffmpeg/Node, and hands you a starter prompt.
```

Nothing is downloaded, cloned or executed before the approval question.

## Why it exists

Choosing a motion skill is not a search problem. It is a constraint problem:

- **Engine** — Remotion, HyperFrames, After Effects, Manim, or none yet.
- **Footage** — talking head, product shots, or motion only.
- **Language** — Persian/Arabic RTL changes typography, joining and caption geometry.
- **License** — a noncommercial pack is not an option for client work.
- **Experience** — a first project needs a pipeline; an expert needs a craft pack.

The skill asks two short rounds of questions, scores a verified catalog deterministically, and explains the trade-off in one sentence per item.

## Install

With the skills CLI:

```bash
npx skills add SaeedSheikhAmiri/motion-skill-scout
```

The CLI tracks the repository and also ships a `skills update` command. For client work, prefer the pinned manual install below: an update then requires a new approval instead of a single `skills update`.

Or manually, pinned:

```bash
SHA=$(git ls-remote https://github.com/SaeedSheikhAmiri/motion-skill-scout.git HEAD | cut -f1)
git init .claude/skills/motion-skill-scout
git -C .claude/skills/motion-skill-scout remote add origin https://github.com/SaeedSheikhAmiri/motion-skill-scout.git
git -C .claude/skills/motion-skill-scout fetch --depth 1 origin "$SHA"
git -C .claude/skills/motion-skill-scout checkout FETCH_HEAD
```

Use `.codex/skills/`, `.cursor/skills/` or `.agents/skills/` if that is what your agent reads. The folder must contain this `SKILL.md`.

Then ask your agent:

> I want to make a motion video. Use motion-skill-scout.

## How it works

| Step | What happens | Network |
|---|---|---|
| 0. Preflight | Checks Node, git, ffmpeg, ffprobe, npx, disk | none |
| 1. Interview | Two rounds, max four questions each | none |
| 2. Score | `scripts/recommend.mjs` ranks the catalog | none |
| 3. Decide | One question: install, swap, alternatives, stop | none |
| 4. Approve | Shows the exact commits and destination | `git ls-remote` only |
| 5. Install | `scripts/vendor.sh` clones each SHA, then `lock.mjs` | GitHub clone |
| 6. Verify | `scan-skills.mjs`, `verify-lock.mjs`, preflight | none |

The stack has three roles:

- **Baseline** — makes the engine behave (frame determinism, captions, render path).
- **Primary** — supplies the look and workflow for your job.
- **Utility** — optional cleanup the primary does not cover, such as silence removal.

Three installs is the cap. Five new packs with conflicting defaults is how a project stalls.

## Safety model

- `scripts/recommend.mjs` is offline and deterministic. Same answers, same catalog, same result.
- `scripts/vendor.sh` accepts only a **full 40-character commit SHA**. Branches and tags are refused, so nothing can fast-forward later.
- `scripts/lock.mjs` records repo, commit, license, file count and a SHA-256 manifest of the installed tree in `skills.lock.json`.
- `scripts/verify-lock.mjs` fails on changed, added or removed files — the evidence that an installed skill has not silently changed.
- Before installing anything, read the target `SKILL.md`, its scripts and its `LICENSE`. The skill will not do that reading for you, and it will not install when the license forbids the use you described.

### Updates are manual by design

This skill never updates itself, never checks for updates in the background, and never runs `git pull`, `npm update` or `npx skills update` on installed packs. Updates require a new request, a new approval, a reviewed diff and a new lock entry. The license says the same thing in legal terms.

## Catalog

`references/catalog.json` is a snapshot of **41 repositories** checked on **14 November 2026**: stars and licenses from the GitHub API, and the presence of `SKILL.md` verified in each repository tree. It covers official engine skills, paper/collage aesthetics, word-timed motion, full pipelines, editing agents, utilities and engines.

The catalog is curated, not exhaustive. For roughly 500 security-graded repositories, see [zhuyansen/awesome-claude-video-skills](https://github.com/zhuyansen/awesome-claude-video-skills).

Star counts and licenses move. Re-check before a paid engagement; the snapshot date is printed in every recommendation.

## Requirements

- An agent that supports `SKILL.md` (Claude Code, Codex, Cursor, and others).
- Node.js 18+ for the scripts.
- `git` for pinned installs.
- `ffmpeg`/`ffprobe` for any editing, muxing or QA step.
- `npx` only if you prefer the skills CLI over vendoring.

## Repository layout

```text
SKILL.md                  the contract the agent follows
references/
  questionnaire.md        bilingual question bank and branch rules
  scoring.md              answer schema, weights, catalog maintenance
  catalog.json            verified snapshot used by the scorer
  install-safety.md       what to read before installing a skill
  update-policy.md        manual update and rollback procedure
scripts/
  preflight.mjs           environment check
  recommend.mjs           deterministic stack ranking
  vendor.sh               pinned clone by SHA
  scan-skills.mjs         find and describe SKILL.md files
  lock.mjs                write skills.lock.json
  verify-lock.mjs         detect drift
examples/
  answers-persian-talking-head.json
  answers-english-html-explainer.json
LICENSE
```

## Try the scorer without installing anything

```bash
node scripts/recommend.mjs --answers examples/answers-persian-talking-head.json
```

It prints a stack and a warning list, and exits without touching the network.

## License

**Motion Skill Scout Community License v1.0.** Free to use, copy, modify, fork and redistribute, including commercially, with attribution. Forks must use a different `name` in `SKILL.md`. **Automatic updates of installed copies — or automatic pushes to the original repository — require prior written permission.** See [LICENSE](LICENSE).

In short: take it, change it, ship it; do not wire it to update itself or other people's copies without asking.

## Author

[Saeed SheikhAmiri](https://github.com/SaeedSheikhAmiri) · [Persian edition](README.fa.md)