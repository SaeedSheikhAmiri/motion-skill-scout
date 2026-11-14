# Update policy

Updates are **manual, explicit, reviewed and pinned**. This is a design decision, not a missing feature.

## Three layers of protection

1. **License.** The Motion Skill Scout Community License permits free use, copying, modification and redistribution, but forbids automatic updates of installed copies and automatic pushes to the original repository without written permission. See `LICENSE`.
2. **Tooling.** `skills.lock.json` stores the repo, full commit, license, file count and a manifest hash. `verify-lock.mjs` fails when a file changes, disappears, or a new file appears.
3. **Behavior.** `SKILL.md` forbids updating a skill because a newer commit exists. No cron job, no git hook, no `npx skills update` on the user's behalf.

A pin without a hash is a promise. A pin with a hash is evidence.

## What never happens automatically

- This skill does not update itself.
- This skill does not check for updates in the background.
- This skill does not run `git pull`, `npm update` or `npx skills update` on installed packs.
- This skill does not modify `skills.lock.json` during a normal recommendation.
- This skill does not install anything during the interview.

## How to update one installed skill

Only after the user asks, and only after a new approval.

### 1. See what changed

```bash
git -C <destination> fetch origin
git -C <destination> log --oneline HEAD..FETCH_HEAD
git -C <destination> diff --stat HEAD FETCH_HEAD
git -C <destination> diff HEAD FETCH_HEAD -- SKILL.md
```

Summarize the change in plain language: new behavior, changed install steps, new permissions, license change.

### 2. Decide with the user

Show the commit range, the files touched and the license status. Ask once:

- **Update now** — proceed.
- **Keep the pinned version** — stop; the lock stays as evidence.
- **Switch packs** — go back to the recommendation step.

### 3. Install beside the old copy, then replace

```bash
NEW_SHA=$(git -C <destination> rev-parse FETCH_HEAD)
bash scripts/vendor.sh <owner>/<repo> "$NEW_SHA" "<destination>.next"
node scripts/scan-skills.mjs "<destination>.next"
```

Compare the new `SKILL.md` before swapping:

```bash
diff -u <destination>/SKILL.md <destination>.next/SKILL.md
```

If approved:

```bash
mv <destination> "<destination>.previous"
mv "<destination>.next" <destination>
node scripts/lock.mjs --path <destination> --repo <owner>/<repo> \
  --commit "$NEW_SHA" --license "<license>" --file skills.lock.json
node scripts/verify-lock.mjs --file skills.lock.json
```

Keep `.previous` until the first successful render. Then delete it.

### 4. Roll back

```bash
rm -rf <destination>
mv "<destination>.previous" <destination>
node scripts/lock.mjs --path <destination> --repo <owner>/<repo> \
  --commit <OLD_SHA> --license "<license>" --file skills.lock.json
```

A rollback is a new approved state, not a silent restoration.

## For maintainers of forks

You may fork, modify and share this skill. Under the license:

- change the `name` in `SKILL.md` so two versions cannot be confused;
- do not push to the original repository;
- do not present your fork as the official version;
- keep the copyright notice and the no-automatic-update clause.

Pull requests to the original repository are welcome, but they are reviewed and merged by the copyright holder. They are not an update channel for installed copies.

## Why so strict

Video work is expensive to re-run: a client review, a render farm job, a published reel. Silent changes to a skill can alter timing, fonts, subtitle geometry or the render path without touching a single line of the user's project. Pinning plus a manifest hash turns “it worked last week” into a reproducible fact.