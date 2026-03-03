# AGENTS.md - Project Compass Workspace

Welcome to Project Compass. This file provides context for AI agents (Clawdy, Claude, Copilot, etc.) working on this repository.

## Overview
Project Compass is a futuristic project navigator and runner designed for modern polyglot development. It provides a high-fidelity terminal UI (using Ink) to manage complex workspaces with integrated Agentic AI intelligence.

## Project Structure
- `src/cli.js`: Entry point. Handles argument parsing, global input, and the main Ink UI loop.
- `src/projectDetection.js`: Orchestrator for identifying projects.
- `src/detectors/`: Modular detection logic for Node, Python, Rust, Go, Java, PHP, Ruby, and .NET.
- `src/components/`: React/Ink components for the TUI.
  - `AIHorizon.js`: [NEW] Agentic AI intelligence suite (OpenRouter, Gemini, Claude, Ollama).
  - `Navigator.js`: Paginated project navigator with strict boundary guards.
  - `TaskManager.js`: Orbit Task Manager (background processes).
  - `PackageRegistry.js`: Native dependency management interface.
  - `ProjectArchitect.js`: Scaffolding and templates.
- `assets/`: UI-related screenshots and branding.

## Tech Stack
- **Runtime:** Node.js (ESM)
- **UI Framework:** [Ink](https://github.com/vadimdemedes/ink) (React for CLI)
- **Styling:** `kleur`
- **Execution:** `execa` for robust subprocess management.
- **Intelligence:** Native `fetch` for agentic API handshakes.

## Development Rules
1. **Zero Mock Data:** Always aim for live system/project data.
2. **ESM Only:** Use `import/export`.
3. **Paging Rules:** Use the hard-coded `maxVisibleProjects` (current default: 3) for navigation logic.
4. **Port Logic:** Respect `projectMeta` in `config.json` for manual port assignments.

---
*Created for the CrimsonDevil333333 Ecosystem.*
