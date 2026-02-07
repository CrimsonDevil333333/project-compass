# Project Compass

Project Compass is a futuristic CLI navigator built with [Ink](https://github.com/vadimdemedes/ink) that scans your current folder tree for familiar code projects and gives you one keystroke access to build, test, or run them.

## Highlights

- 🔍 Scans directories for Node.js, Python, Rust, Go, Java, and Scala projects by looking at their manifest files.
- ✨ Presents a modern Ink dashboard with an interactive project list, icons, and live stdout/stderr logs.
- 🚀 Press **Enter** on any project to open the detail view, where you can inspect the type, manifest, description, commands, and save custom actions.
- 🎯 Built-in shortcuts (B/T/R) run the canonical build/test/run workflow, while numeric hotkeys (1, 2, 3...) execute whichever command is listed in the detail view.
- 🧠 Add bespoke commands via `C` in detail view and store them globally (`~/.project-compass/config.json`) so every workspace remembers your custom invocations.
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
| Enter | Toggle the detail view with icons, commands, and info |
| B / T / R | Quick build / test / run actions (when available) |
| 1‑9 | Execute the numbered command inside the detail view |
| C | Add a custom command (`label|cmd`) that saves to `~/.project-compass/config.json` |
| Q | Quit |

## Developer notes

- `npm start` launches the Ink UI in the current directory.
- `npm test` runs `node src/cli.js --mode test` to verify the scanner output.
- Extend support for more languages by editing `SCHEMAS` in `src/cli.js`.
- Config lives at `~/.project-compass/config.json`. Drop custom commands there if you want to preseed them or share with teammates.

## License

MIT © 2026 Satyaa & Clawdy
