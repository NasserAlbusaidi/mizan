# Release Checklist

Mizan is intentionally small: zero runtime dependencies, local-only data access,
and a package that should stay easy to inspect. Use this checklist before any
publish.

## Local Gate

```bash
npm run release:check
```

This runs:

- `npm test`
- `npm run smoke`
- `npm run pack:check`
- `npm run install:check`

## Manual Checks

```bash
node bin/mizan.js --help
node bin/mizan.js --version
node bin/mizan.js --doctor
node bin/mizan.js --try
node bin/mizan.js --share
node bin/mizan.js --pricing
node bin/mizan.js --summary --demo --window 7
node bin/mizan.js --report --demo --window 7
node bin/mizan.js --report --check --demo --window 7
node bin/mizan.js --check --demo --window 7
tmpdir="$(mktemp -d)" && mkdir -p "$tmpdir/personal/project-a" "$tmpdir/work/project-b" && touch "$tmpdir/personal/project-a/usage.jsonl" "$tmpdir/work/project-b/usage.jsonl" && MIZAN_CONFIG="$tmpdir/config.json" MIZAN_PERSONAL_DIR="$tmpdir/personal" MIZAN_WORK_DIR="$tmpdir/work" node bin/mizan.js --setup
tmpdir="$(mktemp -d)" && MIZAN_CONFIG="$tmpdir/config.json" node bin/mizan.js --set-budget daily=20 monthly=250
tmpdir="$(mktemp -d)" && MIZAN_CONFIG="$tmpdir/config.json" node bin/mizan.js --add-work-marker /Clients/
tmpdir="$(mktemp -d)" && MIZAN_CONFIG="$tmpdir/config.json" node bin/mizan.js --set-transcripts personal="$tmpdir/personal" work="$tmpdir/work"
```

Expected:

- `--doctor` should print transcript directories, config, cache, host, budgets, and
  pricing metadata.
- `--version` should print the package name and version.
- `--try` should print a demo summary and next setup commands without opening a
  browser.
- `--share` should print safe public launch copy and current install commands.
- `--summary --demo` should print a compact report without opening a browser.
- `--report --demo` should print Markdown with redacted local paths.
- `--report --check --demo` should print Markdown and exit with code `2`.
- `--check --demo` should exit with code `2` because demo data includes leaks.
- `--setup` should create the selected config file, print diagnostics, and exit
  `0` when the selected transcript folders contain `.jsonl` files.
- `--set-budget` should create/update only the selected config file.
- `--add-work-marker` should create/update only the selected config file.
- `--set-transcripts` should create/update only the selected config file.

## Package Inspection

```bash
npm pack --dry-run --json
```

Check that the package contains only intended files:

- `assets/`
- `bin/`
- `docs/`
- `public/`
- `src/`
- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `README.md`
- `SECURITY.md`
- `SUPPORT.md`
- `LICENSE`

## Clean Install Check

```bash
npm run install:check
```

This packs the current checkout, installs the tarball into a temporary empty npm
project, and runs the installed `mizan` binary through help, setup, pricing,
summary, check, and config-init flows.

## Publish

Rehearse the full publish lifecycle without uploading:

```bash
npm publish --dry-run --access public
```

This catches npm lifecycle behavior that `npm pack --dry-run` cannot cover. In
particular, `prepublishOnly` runs under npm's dry-run configuration, while
`npm run install:check` must still create and install a real temporary tarball.

After the dry-run passes, publish:

```bash
npm publish --access public
```

`prepublishOnly` runs `npm run release:check`, so publish should fail before
uploading if tests, smoke, or package dry-run fail.
