# Installing Mizan

The recommended path is npm:

```bash
npx @nasseralbusaidi/mizan --demo      # try without installing
npm install -g @nasseralbusaidi/mizan  # keep it
```

(npm listing pending — until it appears, the tarball paths below install
identical bits.) This page covers pinned versions, registry-free fallbacks,
and running from source.

Requirements: Node.js >= 20 with npm.

## Latest release (stable URL)

Every release publishes a `mizan-latest.tgz` asset, and GitHub's
`releases/latest/download/` path always redirects to the newest one:

```bash
npm install -g https://github.com/NasserAlbusaidi/mizan/releases/latest/download/mizan-latest.tgz
```

> Note: npm caches package tarballs by URL. Because this URL is stable across
> releases, a machine that installed from it before may reuse a cached older
> tarball. Run `npm cache clean --force` first, or use a versioned tarball
> below, to guarantee a specific version.

## Pinned version (versioned tarball)

Each release also ships a versioned tarball whose URL never changes meaning:

```bash
npm install -g https://github.com/NasserAlbusaidi/mizan/releases/download/v0.2.0/nasseralbusaidi-mizan-0.2.0.tgz
```

Try without installing:

```bash
npm exec --yes --package https://github.com/NasserAlbusaidi/mizan/releases/download/v0.2.0/nasseralbusaidi-mizan-0.2.0.tgz -- mizan --try
```

Browse all versions on the [releases page](https://github.com/NasserAlbusaidi/mizan/releases).

## Installer script

`scripts/install.sh` discovers the latest release and installs its tarball:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/NasserAlbusaidi/mizan/main/scripts/install.sh)"
```

Pin a version with `MIZAN_INSTALL_VERSION`:

```bash
MIZAN_INSTALL_VERSION=0.2.0 bash -c "$(curl -fsSL https://raw.githubusercontent.com/NasserAlbusaidi/mizan/v0.2.0/scripts/install.sh)"
```

## GitHub tag fallback

If release-asset downloads are blocked on your network, npm can install
straight from a git tag:

```bash
npm install -g github:NasserAlbusaidi/mizan#v0.2.0
```

Or run the demo without installing:

```bash
npm exec --yes --package github:NasserAlbusaidi/mizan#v0.2.0 -- mizan --try
```

## From source

```bash
git clone https://github.com/NasserAlbusaidi/mizan.git
cd mizan
node bin/mizan.js --setup
npm start
```

`npm run smoke` checks setup diagnostics and the demo JSON path without opening
a browser. See [CONTRIBUTING.md](../CONTRIBUTING.md) for the full local
development loop.

## After installing

```bash
mizan --setup          # create config if needed, diagnose transcript folders
mizan                  # start the local dashboard
mizan --update-check   # compare your installed version to the latest release
```

If setup finds no transcripts, preview with `mizan --demo` or save folders with
`mizan --set-transcripts personal=/path work=/path`. See
[CLI.md](CLI.md) for every flag.
