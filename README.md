# Project Compass

Project Compass is a futuristic CLI navigator built with [Ink](https://github.com/vadimdemedes/ink) that scans your current folder tree for familiar code projects and gives you one keystroke access to build, test, or run them.

## Highlights

- 🔍 Scans directories for Node.js, Python, Rust, Go, Java, and Scala projects by looking at their manifest files.
- ✨ Presents a modern Ink dashboard with an interactive project list, icons, and live stdout/stderr logs.
- 🚀 Press **Enter** on any project to open the detail view, where you can inspect the type, manifest, frameworks, commands, and save custom actions.
- 🎯 Built-in shortcuts (B/T/R) run the canonical build/test/run workflow, while numeric hotkeys (1, 2, 3...) execute whichever command is listed in the detail view.
- 🧠 Add bespoke commands via **C** in detail view and store them globally (`~/.project-compass/config.json`) so every workspace remembers your favorite invocations.
- 🎨 The top art board layers glyphs, neon-like tiles, and highlighted metrics (Pulse, Focus, Rhythm) so the CLI feels like a curated gallery instead of a bland table.
- 🔌 Extend detection via plugins (JSON specs under `~/.project-compass/plugins.json`) to teach Project Compass about extra frameworks or command sets.
- 📦 Install globally and invoke `project-compass` from any folder to activate the UI instantly.

## Installation

```bash
npm install -g project-compass
```

## Usage

```bash
project-compass [--dir /path/to/workspace]
```

### Keyboard guide

| Key | Action |
| --- | --- |
| ↑ / ↓ | Navigate the project list |
| Enter | Toggle the detail view with icons, commands, frameworks, and info |
| B / T / R | Quick build / test / run actions (when available) |
| 1‑9 | Execute the numbered command inside the detail view |
| C | Add a custom command (`label|cmd`) that saves to `~/.project-compass/config.json` |
| Q | Quit |

## Framework & plugin support

Project Compass detects a wide range of modern stacks—**Next.js**, **React**, **Vue**, **NestJS**, **Angular**, **SvelteKit**, **Nuxt**, **Astro**, **Django**, **Flask**, **FastAPI**, and **Spring Boot**—and shows their badges in the detail view. When a framework is recognized, it injects framework-specific build/run/test commands (e.g., Next dev/build, Django runserver/test, Spring Boot run/test).

You can teach it new frameworks by adding a `plugins.json` file in your config directory (`~/.project-compass/plugins.json`). Each entry can declare the languages, files, dependencies, and commands that identify the framework. A sample plugin entry looks like this:

```json
{
  "plugins": [
    {
      "name": "Remix",
      "languages": ["Node.js"],
      "files": ["remix.config.js"],
      "dependencies": ["@remix-run/node"],
      "commands": {
        "run": "npm run dev",
        "build": "npm run build"
      }
    }
  ]
}
```

Each command value can be a string or an array of tokens. When a plugin matches a project, its commands appear in the detail view with a `framework` badge, and the shortcut keys (B/T/R or numeric) can execute them.


## Art board & detail view

Project Compass now opens with a rounded art board that shuffles your glyph row (▁▃▄▅▇ with neon accents) and three branded tiles showing workspace pulse, the selected project focus, and the rhythm of commands. The detail view sits beside the project list as a gallery; border colors, badges, and the ambient header hint keep it feeling like a living installation rather than a vanilla CLI.

## Developer notes

- `npm start` launches the Ink UI in the current directory.
- `npm test` runs `node src/cli.js --mode test` to verify the scanner output.
- Extend support for more languages by editing `SCHEMAS` or add plugin definitions under `~/.project-compass/plugins.json`.
- Config lives at `~/.project-compass/config.json`. Drop custom commands there if you want to preseed them or share with teammates.

## License

MIT © 2026 Satyaa & Clawdy
## Release & packaging

- Bump `package.json`/`package-lock.json` versions (e.g., `npm version 1.0.1 --no-git-tag-version`).
- Run `npm run lint` and `npm run test` to validate the workspace before publishing.
- Create the release artifact with `npm pack` (produces `project-compass-<version>.tgz` for uploading to GitHub Releases or npm).
- Tag the repo `git tag v<version>` and push both commits and tags to publish the release.
