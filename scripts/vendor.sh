#!/usr/bin/env bash
# © 2026 Saeed SheikhAmiri — Motion Skill Scout Community License v1.0
# Pinned install: clone one exact commit. Refuses branches and tags on purpose.
set -euo pipefail

usage() {
  echo "usage: vendor.sh <owner/repo> <40-char-commit-sha> <destination>" >&2
  exit 2
}

[ "$#" -eq 3 ] || usage
repo="$1"
commit="$2"
dest="$3"

if ! [[ "$repo" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
  echo "vendor: invalid repo '$repo' (expected owner/repo)" >&2
  exit 2
fi
if ! [[ "$commit" =~ ^[0-9a-f]{40}$ ]]; then
  echo "vendor: commit must be a full 40-character SHA, got '$commit'" >&2
  echo "        resolve it first: git ls-remote https://github.com/$repo.git HEAD" >&2
  exit 2
fi
if [ -e "$dest" ] && [ -n "$(ls -A "$dest" 2>/dev/null || true)" ]; then
  echo "vendor: destination '$dest' already exists and is not empty" >&2
  exit 2
fi

mkdir -p "$dest"
git init -q "$dest"
git -C "$dest" remote add origin "https://github.com/$repo.git"
git -C "$dest" fetch -q --depth 1 origin "$commit"
git -C "$dest" checkout -q FETCH_HEAD

actual="$(git -C "$dest" rev-parse HEAD)"
if [ "$actual" != "$commit" ]; then
  echo "vendor: checkout mismatch (wanted $commit, got $actual)" >&2
  exit 3
fi

# No tracking branch is created: nothing can fast-forward this copy by accident.
git -C "$dest" config --unset-all branch.main.remote 2>/dev/null || true
git -C "$dest" config --unset-all branch.main.merge 2>/dev/null || true

echo "installed $repo @ $commit"
echo "path: $dest"
echo "review: $dest/SKILL.md (and any nested SKILL.md files)"