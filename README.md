# Project Compass

Project Compass is a terminal-first explorer built with [Ink](https://github.com/vadimdemedes/ink) that helps you visualize every recognizable project inside the current directory tree and run the right commands with a single keystroke.

## Features

- 🔍 Scans the current folder and subfolders for Node.js, Python, Rust, Go, Java, and Scala projects.
- 🧭 Displays a modern Ink dashboard with icons, relative paths, and live command logs.
- 🎯 Lets you use arrow keys to pick a project and press `B/T/R` to build, test, or run it.
- ⚙️ Runs sensible defaults per language (scripts for Node.js, `cargo`, `go`, `sbt`, `mvn`, `pytest`, etc.) without memorizing commands.
- 📦 Installs globally via `npm install -g` so you can launch `project-compass` from anywhere.

## Installation

```bash
npm install -g project-compass
```

## Usage

```bash
project-compass [--dir /path/to/workspace]
```

Once the UI shows up:

- Navigate projects with **↑ / ↓**.
- Press **B** to build, **T** to test, **R** to run (if a command is available).
- Tail the log panel on the right for real-time feedback.
- Press **Q** to quit.

## Developer notes

- `npm start` launches the Ink UI in the current directory.
- `npm test` runs the detection routine in `--mode test` so you can assert the scanner output before pushing.
- Add new languages or custom command presets by editing `src/cli.js` and extending the `SCHEMAS` table.

## License

MIT © 2026 Satyaa & Clawdy
