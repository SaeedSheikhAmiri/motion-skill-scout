---
name: motion-skill-scout
description: Interview a user about the video or motion project they want to make, recommend matching Agent Skills from a verified catalog, and install only the stack they explicitly approve, pinned to a commit. Use when someone wants to create motion graphics, add motion to talking-head footage, edit video with AI, choose video Agent Skills, or asks which Remotion, HyperFrames, FFmpeg or Manim skills to install.
license: Motion Skill Scout Community License v1.0
---

# Motion Skill Scout

Turn “I want motion in my video” into an approved, pinned, verified install — in six steps. The interview and the approval gate are the product. Do not skip either.

## Non-negotiables

1. **Ask before installing.** Nothing is downloaded, cloned or executed from a third-party repo until the user answers the plan with an explicit yes.
2. **Pin every commit.** Resolve `HEAD` to a SHA and install that SHA. Never install a moving branch for client work.
3. **One stack, not a shopping list.** Recommend a *baseline* (engine correctness), a *primary* (look and workflow), and at most one *utility*. More than three new packs in one project creates conflicting defaults.
4. **Respect licenses.** Never install a noncommercial pack for commercial work. Treat `NOASSERTION` or a missing license as all rights reserved and say so.
5. **Never auto-update.** This skill does not update itself, and installed skills are only updated after a new, explicit approval. See `references/update-policy.md`.
6. **Protect the footage.** Do not upload source video, transcripts or client assets to a third-party service without asking.

## Paths

`SKILL_DIR` is the folder containing this `SKILL.md`. Run every script with that absolute path:

```bash
node "$SKILL_DIR/scripts/recommend.mjs" ...
```

Keep user artifacts in the **user's project**, not in the skill folder: `.motion-scout/answers.json`, `skills.lock.json`, and the chosen install destination (for example `.claude/skills/<id>`). Never write the user's lockfile inside `SKILL_DIR`.

## Step 0 — Preflight (10 seconds)

Run:

```bash
node "$SKILL_DIR/scripts/preflight.mjs"
```

Tell the user in one line what is missing. `ffmpeg` is required for any editing or muxing stack; Node 18+ is required for Remotion. Missing tools are a warning, not a blocker for the interview.

## Step 1 — Interview

Ask in **two short rounds**, at most **four questions per round**. Use the user's language. Offer concrete options and always allow a free-form answer. Do not ask for information the user already gave you.

**Round A — the project**

1. What are you making?
   `talking-head reel` · `product or brand promo` · `explainer` · `social shorts` · `data or map video` · `math or 3D` · `not sure yet`
2. Which engine or tool do you want to use?
   `Remotion + React` · `HTML/CSS/GSAP` · `After Effects or Premiere only` · `no preference`
3. Delivery format?
   `9:16 vertical` · `16:9 landscape` · `both` · `1:1`
4. Language and direction?
   `Persian/Arabic (RTL)` · `English/Latin` · `bilingual` · `other`

**Round B — only the questions that change the answer**

5. Do you have footage? `raw talking head` · `product shots` · `no footage, motion only`
6. Captions? `burned-in, word-timed` · `SRT only` · `none`
7. Usage? `commercial client work` · `personal` · `open source`
8. Experience? `first project` · `comfortable with code` · `I want a full pipeline`

Add one optional question if the user has not hinted at a look:

> Pick a visual direction: `paper / dossier / collage` · `clean tech` · `bold kinetic type` · `news / data` · `cinematic` · `no preference`

Full wording, Persian translations and branch rules live in `references/questionnaire.md`.

Write the answers to `.motion-scout/answers.json` (create the folder). Use this schema:

```json
{
  "output": "talking-head",
  "engine": "remotion",
  "aspect": "9:16",
  "language": "fa",
  "footage": "talking-head",
  "captions": "burned",
  "usage": "commercial",
  "level": "beginner",
  "style": "paper-dossier"
}
```

Allowed values are listed in `references/scoring.md`. If an answer is unknown, omit the key; the scorer treats it as neutral.

## Step 2 — Score, do not guess

```bash
node "$SKILL_DIR/scripts/recommend.mjs" --answers .motion-scout/answers.json --json
```

The script returns a stack (`baseline`, `primary`, `utility`), alternatives, reasons, caveats and a license flag per item. Trust the ranking for *shortlisting*, not for the final decision: you still have to explain the trade-off in one sentence per item.

Read `references/scoring.md` if the result looks wrong. Do not edit the catalog to make a favourite win.

## Step 3 — Present the stack and ask for a decision

Show a compact table, then one question:

```text
Baseline  remotion-dev/skills        official · keeps the renderer correct
Primary   iart-ai/motion-skills     MIT · word-timed B-roll and lower thirds
Optional  louisedesadeleer/cut-video silence and filler removal

Why this stack: <two sentences tied to their answers>
Watch-outs: <RTL caveat, commercial license caveat, setup cost>
```

Then ask exactly one question with these options:

- **Install this stack** — proceed to Step 4.
- **Swap the primary** — show the next three alternatives and ask again.
- **Show alternatives** — list the ranked shortlist with licenses.
- **Stop here** — give them the plan as text and install nothing.

An explicit yes is required. “Sounds good”, “ok” and silence are not approval to install; ask once more with the exact commands and destination.

## Step 4 — Confirm destination and show the exact commands

Ask where the skills should live. Detect the agent if you can; otherwise offer:

| Agent | Project-local | User-wide |
|---|---|---|
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| Codex | `.codex/skills/` | `~/.codex/skills/` |
| Cursor | `.cursor/skills/` | `~/.cursor/skills/` |
| Other / portable | `.agents/skills/` | `~/.agents/skills/` |

Prefer project-local: it is easy to review, commit and remove.

Before running anything, print the resolved plan:

```text
owner/repo            commit (short)   license        destination
remotion-dev/skills   a1b2c3d          Remotion terms .claude/skills/remotion-official
iart-ai/motion-skills 9f8e7d6          MIT            .claude/skills/iart-motion
```

Resolve the commits first:

```bash
git ls-remote https://github.com/<owner>/<repo>.git HEAD
```

Then install each item **pinned**:

```bash
bash "$SKILL_DIR/scripts/vendor.sh" <owner>/<repo> <full-sha> ".claude/skills/<id>"
node "$SKILL_DIR/scripts/scan-skills.mjs" ".claude/skills/<id>"
node "$SKILL_DIR/scripts/lock.mjs" --path ".claude/skills/<id>" --repo <owner>/<repo> \
  --commit <full-sha> --license "<license>" --file skills.lock.json
```

If the user explicitly asks for the vendor CLI instead, `npx skills add <owner>/<repo>` is acceptable — but still record the commit you resolved in `skills.lock.json`, and tell them the install is a snapshot, not a tracked channel.

Run the commands one at a time and report the result of each. If a clone fails, stop and report; do not silently retry with a branch.

## Step 5 — Verify

```bash
node "$SKILL_DIR/scripts/scan-skills.mjs" "<destination>"     # SKILL.md files and descriptions
node "$SKILL_DIR/scripts/verify-lock.mjs" --file skills.lock.json
node "$SKILL_DIR/scripts/preflight.mjs"                       # re-check ffmpeg/node for this stack
```

Confirm three things out loud:

1. every installed folder contains a `SKILL.md` with a `name` and `description`;
2. `skills.lock.json` has a commit and a manifest hash for each item;
3. the tools the stack needs are present (Remotion → Node; editing → FFmpeg).

Then give the user a five-line handoff:

```text
Start with: <one prompt that uses the baseline + primary together>
First check: render one still before the full render
Watch: <the single most likely failure for their answers>
Update later: ask me to check; updates are explicit and re-approved
Remove: delete <destination> and its skills.lock entry
```

## What you must refuse

- Installing a `noncommercial` pack when usage is commercial.
- Installing an `unclear` license for client work without a written warning and a confirmed yes.
- Installing five packs “to try them”. Offer the three-item stack and one alternative.
- Updating an installed skill because a newer commit exists. Updates require a new request and a new approval.
- Running `skills update`, `git pull`, `npm update` or any updater on an installed pack on the user's behalf.
- Running `postinstall` scripts, credential prompts or network setup you have not read.
- Sending footage, transcripts or brand assets to any external service as part of scouting.

## Files

| Path | Purpose |
|---|---|
| `references/questionnaire.md` | Bilingual question bank, branch rules, tone |
| `references/scoring.md` | Answer schema, weights, how to read the result |
| `references/catalog.json` | Verified catalog snapshot (source of truth for scoring) |
| `references/install-safety.md` | What to read before installing a third-party skill |
| `references/update-policy.md` | Why updates are manual, and how to do one |
| `scripts/preflight.mjs` | Environment check |
| `scripts/recommend.mjs` | Deterministic stack ranking |
| `scripts/vendor.sh` | Pinned clone by commit |
| `scripts/scan-skills.mjs` | Find and describe `SKILL.md` files |
| `scripts/lock.mjs` | Write `skills.lock.json` with manifest hash |
| `scripts/verify-lock.mjs` | Detect drift, missing files, changed commits |

Catalog snapshot: **14 November 2026**. Star counts and licenses move; re-check before a paid engagement.