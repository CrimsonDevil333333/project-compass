# Project Compass (v2.2.0)

Project Compass is a futuristic CLI navigator built with [Ink](https://github.com/vadimdemedes/ink) that scans your current folder tree for familiar code projects and gives you one-keystroke access to build, test, or run them.

## Highlights

- 🔍 Scans directories for Node.js, Python, Rust, Go, Java, and Scala projects.
- 🎨 Futuristic layout with glyph-based art board and split Projects/Details rows.
- 🚀 **New Keyboard-Centric UX**: Shortcuts now use **Shift** instead of Ctrl to avoid terminal interference.
- 💡 **Refined Output**: Improved stdin buffer with proper spacing and reliable scrolling (Shift+↑/↓).
- 🧠 **Smart Detection**: Support for 15+ frameworks (Vite, Prisma, Tailwind, etc.) with specialized build/run commands and setup hints.
- 🔌 **Extensible**: Add custom commands with **Shift+C** and frameworks via `plugins.json`.

## Installation

```bash
npm install -g project-compass
```

## Usage

```bash
project-compass [--dir /path/to/workspace]
```

### Keyboard Guide

| Key | Action |
| --- | --- |
| ↑ / ↓ | Move focus, **Enter**: toggle details |
| B / T / R | Build / Test / Run |
| 1‑9 | Execute numbered detail commands |
| **Shift+C** | Add a custom command (`label|cmd`) |
| **Shift ↑ / ↓** | Scroll output buffer |
| **Shift+L** | Rerun last command |
| **Shift+H** | Toggle help cards |
| **Shift+S** | Toggle structure guide |
| **Shift+Q** | Quit app |
| ? | Toggle help overlay |
| Ctrl+C | Interrupt running command |

## Layout & UX

Project Compass features a split layout where Projects and Details stay paired while Output takes a full-width band. The stdin buffer (at the bottom) now has a clear distinction between the label and your input for better readability. The help cards (Shift+H) have been refactored for a cleaner, more readable look.

## Frameworks

Detects **Next.js**, **React**, **Vue**, **NestJS**, **FastAPI**, **Django**, **Vite**, **Prisma**, **Tailwind**, and more. Recognizes frameworks and injects specialized commands automatically.

## License

MIT © 2026 Satyaa & Clawdy
