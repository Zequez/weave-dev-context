# Weave Dev Context

What if defining a Holochain's Weave tool could be as simple as having a single `index.html` file in a directory and running a command?
What if we collaborated on maintaining a repository responsible for holding *the whole* development context behind a single CLI tool?

Introducing *Weave* Dev Context

### Ethos

- Convention over configuration
- Code sharing and collaboration on the deepest possible level
- No Rust knowledge by default
- Pre-packed with useful libraries
- A single configuration file

(**Disclaimer:** this is very early in development and not all these features are actually real yet)

### What's in the package right now?
- Useful DNAs
 - Profiles zome
 - Syn zome
 - Generic DNA zome
- Holonix development environment
- Vite
 - Multiple UI frameworks to pick from
 - UnoCSS preloaded
 - Iconify unplugin icons
- Single build and dev commands with options
- TypeScript pre-configured
- Bun TS runtime
- Make Github release automatically with new versions and changelogs, and upload the .webhapp file to it
- Deploy to curation list automatically and pre-fill a PR to the upstream repo
- Svelte UI framework support

### What's in the thinking-oven?

- Possibility to work without Github, using IPFS and pinning services for uploading the .webhapp file; and alternatives to the curations list repos
- Website for the happ project with a configurable landing page, changelog and releases.
- Add support for more UI frameworks. Lit, React, Vue, Preact
- Integrate quality of life store into WDC that can work with Syn or Generic DNA


## Prerequisites

- You need Bun installed https://bun.sh/
- You need Nix installed with Holochain cache goodies https://developer.holochain.org/get-started

(maybe WDC can take care of doing this for you later if you don't have those prerequisites already)

## How to use

The package is not published on NPM yet so you gotta clone it and then run `bun install` and `bun link` which registers the `wdc` command globally.

## Commands

```bash
wdc v0.1.1 Set of commands to use the Weave Dev Context

Usage:

  wdc <command> [options] [<arguments>]

Global Options:

  -h, --help     Display help message
  -q, --quiet    Do not output any message

Available commands:

  build     Build UI, Happ and package the happ
  deploy    Deploy built happ to Weave tool curation list
  dev       Start the Vite UI dev server, and the Weave dev server. It uses the compiled happ files, so make sure you run the build command at least once.
  help      Print help information
  init      Initializes a directory with links and some configuration files
  shell     Enters a Nix development shell with Rust and Holochain installed
  test      Start Vitest to test the UI code
```

### How to use

- Go to any directory with at least an index.html file.
- Run `wdc shell` to start a Nix shell
- Run `wdc init` to copy some files
- Run `wdc build` to compile the Rust-based DNA to web assembly libraries
- Run `wdc dev` to start the Vite and Weave dev server with any number of agents
- If you want to deploy it to a curation list create a wdc.config.ts file
- Run `wdc deploy`