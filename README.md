# Project Compass (v2.8.0)

Project Compass is a futuristic CLI navigator built with [Ink](https://github.com/vadimdemedes/ink) that scans your current folder tree for familiar code projects and gives you one-keystroke access to build, test, or run them.

## Highlights

- 🔍 Scans directories for Node.js, Python, Rust, Go, Java, Scala, PHP, Ruby, and .NET projects.
- 🎨 Futuristic layout with glyph-based art board and split Projects/Details rows.
- 🚀 **New Keyboard-Centric UX**: Shortcuts now use **Shift** instead of Ctrl to avoid terminal interference.
- 💡 **Refined Output**: Improved stdin buffer with proper spacing and reliable scrolling (Shift+↑/↓).
- 🧠 **Smart Detection**: Support for 20+ frameworks including **Spring Boot** (Maven/Gradle), **ASP.NET Core**, **Rocket/Actix** (Rust), **Laravel** (PHP), **Vite**, **Prisma**, and more.
- 🛰️ **Orbit Task Manager**: Run commands and **Detach** (**Shift+D**) them to the background. Manage multiple processes via **Shift+T**.
- ⚠️ **Runtime Health**: Automatically checks if the required language/runtime (e.g., `node`, `python`, `cargo`) is installed and warns you if it's missing.
- 💎 **Omni-Studio**: A new interactive environment intelligence mode to see all installed runtimes and versions.
- 📂 **Log Management**: Clear output with **Shift+X** or export logs to a text file with **Shift+E**.
- 🔌 **Extensible**: Add custom commands with **Shift+C** and frameworks via `plugins.json`.

## Installation

```bash
npm install -g project-compass
```

## Usage

```bash
project-compass [--dir /path/to/workspace] [--studio]
```

### Keyboard Guide

| Key | Action |
| --- | --- |
| ↑ / ↓ | Move focus, **Enter**: toggle details |
| B / T / R | Build / Test / Run |
| 1‑9 | Execute numbered detail commands |
| **Shift+T** | Open **Orbit Task Manager** |
| **Shift+D** | **Detach** from active task (runs in background) |
| **Shift+A** | Open **Omni-Studio** (Environment View) |
| **Shift+C** | Add a custom command (`label|cmd`) |
| **Shift+X** | **Clear output logs** |
| **Shift+E** | **Export logs to .txt** |
| **Shift ↑ / ↓** | Scroll output buffer |
| **Shift+L** | Rerun last command |
| **Shift+H** | Toggle help cards |
| **Shift+S** | Toggle structure guide |
| **Shift+Q** | Quit app |
| ? | Toggle help overlay |
| Ctrl+C | Interrupt running command |

## Orbit Task Manager

Project Compass v2.8 introduces background task management. You can start a build, press **Shift+D** to detach and return to the navigator, then start another task. Switch between them or view logs via the Task Manager (**Shift+T**).

## Omni-Studio

Launch with `project-compass --studio` or press **Shift+A** inside the app. Omni-Studio provides real-time intelligence on your installed development environments, checking versions for Node, Python, Rust, Go, Java, and more. 

## License

MIT © 2026 Satyaa & Clawdy
