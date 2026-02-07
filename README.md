# Project Compass (v3.5.1)

Project Compass is a futuristic CLI navigator and lifecycle orchestrator built with [Ink](https://github.com/vadimdemedes/ink). It scans your folder tree for code projects and provides a unified interface to install, build, test, and manage them.

## Highlights

- 🔍 **Omni-Scanner**: Deep-scans directories for Node.js, Python, Rust, Go, Java, Scala, PHP, Ruby, and .NET projects.
- 🏗️ **Project Architect (Shift+N)**: Scaffold new projects from industry-standard templates (Next.js, Vite, Rust, Go) into any target path.
- 📦 **Package Registry (Shift+P)**: Interactively add/remove dependencies and manage environments (like Python `.venv`) without leaving the CLI.
- 🛰️ **Orbit Task Manager (Shift+T)**: Run multiple commands in parallel, detach them to the background (**Shift+D**), and manage them (Rename/Kill).
- 💀 **Atomic Kill (Ctrl+C)**: Forcefully wipe out entire process trees and zombie servers using kernel-level signal forwarding.
- 💎 **Omni-Studio (Shift+A)**: Real-time environment intelligence dashboard showing all installed runtimes and versions.
- 💾 **Global Persistence**: Remembers your UI preferences (Art Board, Help, Structure Guide) via `~/.project-compass/config.json`.
- 🎨 **Flicker-Free UI**: Isolated rendering architecture ensures zero UI jitter even during high-velocity log streaming.

## Installation

```bash
npm install -g project-compass
```

## Usage

```bash
project-compass [--dir /path/to/workspace] [--studio] [--version]
```

### Keyboard Master Guide

| Key | Action |
| --- | --- |
| ↑ / ↓ | Move focus between projects |
| **Enter** | Toggle Detail View / Return from Tasks |
| **Shift+N** | Open **Project Architect** (Create new project) |
| **Shift+P** | Open **Package Registry** (Manage dependencies) |
| **Shift+T** | Open **Orbit Task Manager** |
| **Shift+D** | **Detach** active task to background |
| **Shift+A** | Open **Omni-Studio** (Environment intelligence) |
| **Shift+B** | Toggle **Art Board** visibility |
| **Shift+H** | Toggle **Help Cards** visibility |
| **Shift+S** | Toggle **Structure Guide** |
| **Shift+X** | **Clear** log buffer for active task |
| **Shift+E** | **Export** current logs to `.txt` |
| **Shift+L** | **Rerun** last executed command |
| **Shift+Q** | **Quit** (Confirms if tasks are running) |
| **Ctrl+C** | **Force Kill** all background tasks and exit |
| Shift+↑ / ↓ | Scroll output logs (Intuitive direction) |
| **?** | Toggle help overlay |

## Framework Support

Compass provides specialized intelligence for 20+ stacks including **Next.js, React, Vue, NestJS, Spring Boot, ASP.NET Core, Laravel, Rocket, Actix, Prisma, and Tailwind**.

For a full list of framework-specific commands and shortcuts, see [commands.md](./commands.md).

## License

MIT © 2026 Satyaa & Clawdy
