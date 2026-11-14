# How the recommendation is scored

`scripts/recommend.mjs` is deterministic: same answers and same catalog produce the same stack. It never edits the catalog and never installs.

## Shape of the result

```json
{
  "stack": {
    "baseline": { "id": "remotion-official", "score": 92, "why": [], "notes": [] },
    "primary":  { "id": "iart-broll", "score": 118, "why": [], "notes": [] },
    "utility":  { "id": "cut-video", "score": 41, "why": [], "notes": [] }
  },
  "alternatives": [],
  "excluded": [],
  "warnings": []
}
```

- **Baseline** — makes the engine behave correctly (frame determinism, captions, render). Chosen by engine, not by score.
- **Primary** — supplies the look and the workflow for the user's job.
- **Utility** — optional cleanup that the primary does not cover.
- **Excluded** — items removed by a hard constraint, with the reason. Show these rather than hiding them.

If `baseline` is `null`, say why (After Effects, or no engine chosen). Never fill the gap with an unrelated pack.

## Input schema

| Key | Values | Effect |
|---|---|---|
| `output` | `talking-head`, `promo`, `explainer`, `shorts`, `data`, `math-3d`, `unsure` | Tag match, up to +36 |
| `engine` | `remotion`, `html`, `after-effects`, `manim`, `none` | +30 exact, +12 engine-agnostic, −28 port |
| `aspect` | `9:16`, `16:9`, `1:1`, `both` | +8 |
| `language` | `fa`, `ar`, `en`, `bilingual`, `other` | +25 for RTL-aware packs |
| `footage` | `talking-head`, `product`, `none` | +20 for footage-native packs |
| `captions` | `burned`, `srt`, `none` | +15 for caption packs |
| `usage` | `commercial`, `personal`, `open-source` | License filter and adjustment |
| `level` | `beginner`, `advanced`, `full-pipeline` | Pipeline vs craft weighting |
| `style` | `paper-dossier`, `clean-tech`, `kinetic`, `news-data`, `cinematic`, `none` | +12 per style-tag hit |

Unknown values are ignored with a warning; the script does not fail on a typo in an optional field.

## Weights in plain language

1. **Hard constraints first.** Noncommercial license + commercial use is excluded, full stop. A catalog entry or a repo without a `SKILL.md` is never recommended.
2. **Engine correctness dominates.** A beautiful pack built for the wrong renderer loses 28 points; an exact engine match gains 30.
3. **The job beats the aesthetic.** Output tags count up to 36 points; style adds up to 36. A paper pack for a data video should not win over a data pack with a plainer look.
4. **Talking-head is a strong signal.** Packs that explicitly handle it gain 20. This is the category where generic “motion” advice fails.
5. **RTL is a bonus, not a filter.** A Persian request with no RTL-aware pack still returns the best motion stack, with an explicit warning.
6. **Stars are capped at 8 points.** A 6-star pack is not buried by an 80k-star engine. Young packs are judged on fit, with a “pin a commit” caveat.
7. **Beginner → pipeline.** First projects benefit from a workspace with a review gate; experts benefit more from a craft pack they can bend.

## Reading and explaining the result

For each item, tell the user:

| Field | What to say |
|---|---|
| `why` | “It handles word-timed B-roll from the transcript you already have.” |
| `notes` | “No RTL guidance, so we test Persian shaping before the full render.” |
| `license` | “MIT, fine for client work.” / “Noncommercial, excluded.” |
| `stars` | Only if it changes trust: “small repo, so we pin and read it first.” |
| `install` | The command, after approval — never before. |

If you override the ranking, state the reason in one sentence and show the item you skipped. A silent override destroys trust in the tool.

## Catalog maintenance

`references/catalog.json` is a snapshot, not a live feed. Before adding or editing an entry:

1. Confirm the repository exists and contains at least one `SKILL.md` at the pinned commit.
2. Read the actual `LICENSE` file; GitHub’s `NOASSERTION` is not a license.
3. Record stars and license with the date you checked them.
4. Tag `output` and `engine` honestly; do not tag a pack for a workflow it only mentions in passing.
5. Keep `installable: false` for catalogs and hubs with no `SKILL.md` (e.g. the iart meta-repo).

Never add an entry to make a particular recommendation win. If the ranking is wrong, fix the tags or the weights, not the outcome.