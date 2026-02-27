# AGENTS.md - Project Compass Workspace

Welcome to Project Compass. This file provides context for AI agents (Clawdy, Claude, Copilot, etc.) working on this repository.

## Overview
Project Compass is a futuristic project navigator and runner designed for modern polyglot development (Node.js, Python, Rust, Go). It provides a high-fidelity terminal UI (using Ink) to manage complex workspaces.

## Project Structure
- `src/cli.js`: Entry point. Handles argument parsing and the main Ink UI loop.
- `src/projectDetection.js`: Logic for identifying projects and their frameworks.
- `src/components/`: React/Ink components for the TUI.
  - `TaskManager.js`: Orbit Task Manager (background processes).
  - `PackageRegistry.js`: Dependency management interface.
  - `ProjectArchitect.js`: Scaffolding and templates.
  - `Studio.js`: Omni-Studio health audit.
- `assets/`: UI-related assets (screenshots, etc.).

## Tech Stack
- **Runtime:** Node.js (ESM)
- **UI Framework:** [Ink](https://github.com/vadimdemedes/ink) (React for CLI)
- **Styling:** `kleur` (Note: Use `kleur.bold(kleur.magenta('text'))` instead of chained `.magenta.bold`)
- **Execution:** `execa` for robust subprocess management.

## Development Rules
1. **Zero Mock Data:** Always aim for live system/project data.
2. **ESM Only:** The project uses `"type": "module"`. Use `import/export`.
3. **UI Consistency:** Keep the "Futuristic Cockpit" aesthetic (use symbols, borders, and dim colors where appropriate).
4. **Performance:** Heavy operations (like workspace-wide globbing) should be optimized or backgrounded.

## Common Tasks
- `npm start`: Launch the navigator.
- `npm run lint`: Check code style.
- `npm version <patch|minor|major>`: Update version and sync with npm.

---
*Created for the CrimsonDevil333333 Ecosystem.*
