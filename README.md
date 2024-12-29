# Weave Dev Context

What if defining a Holochain's Weave tool could be as simple as having a single `index.html` file in a directory and running a command?
What if we collaborated on maintaining a repository responsible for holding *the whole* development context behind a single CLI tool?

Introducing *Weave* Dev Context

(**Disclaimer:** this is very early in development and not all these features are actually real yet)

- Convention over configuration
- All batteries included
 - Profiles zome
 - Syn zome
 - Generic DNA zome
- Holonix development environment
- Vite
 - Multiple UI frameworks to pick from
 - UnoCSS preloaded
- No Rust knowledge needed by default
- Add custom DNA if you want to
- Collaboration on the deepest possible level
- Pack, deploy to Github or IPFS, and add to Weave curation lists

Don't like the convention? Fork it damn it! Use it for all your projects! Share back new commands!

## How to use

The package is not published on NPM yet so you gotta clone it and then run `bun install` and `bun link` which registers the `wdc` command globally.

## Commands

```bash
wdc --help

wdc v0.1.0 Set of commands to use the Weave Dev Context

Usage:

  wdc <command> [options] [<arguments>]

Global Options:

  -h, --help     Display help message
  -q, --quiet    Do not output any message

Available commands:

  build    Build UI, Happ and package the happ
  dev      Start the Vite UI dev server, and the Weave dev server
  help     Print help information
  nix      Enters the Nix shell
```

### Happs Commands

- Go to any directory with at least an index.html file.
- In order for code editors to pick up the TypeScript, Prettier, node_modules and other stuff, you can create projects inside the happs/* directory; that way the code editor will pick up the parent directory configurations. In the future a command to seed or symlink the directory with these files might be added.


```bash
 wdc dev --help

Description:

  Start the Vite UI dev server, and the Weave dev server. It uses the compiled happ files, so make sure you run the build command at least once.

Usage:

  dev [options]

Options:

  -s, --standalone    Run as a standalone Holochain app (not working yet)
  -a, --agents        Number of agents
```