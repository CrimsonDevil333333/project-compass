# Project Compass Architecture

This document describes the high-level architecture of Project Compass.

## Data Flow
1.  **Initialization:** `cli.js` resolves the working directory (defaults to current folder).
2.  **Discovery:** `projectDetection.js` performs a high-speed glob search for common manifest files (`package.json`, `cargo.toml`, `go.mod`, etc.).
3.  **State Management:** The discovered projects and their metadata (frameworks, scripts, dependencies) are passed into an Ink React tree.
4.  **Rendering:** Components in `src/components` handle specific views (Task Manager, Architect, etc.) based on user keypresses.
5.  **Execution:** User-triggered scripts (like running `npm test`) are managed by `TaskManager.js` using `execa` with streaming logs.

## Design Patterns
- **React-for-CLI:** Leveraging React's lifecycle and state management for a terminal environment.
- **Component-Driven:** Each view is an isolated component in `src/components`.
- **Async Execution:** Heavy lifting (globbing, command execution) is offloaded from the main render loop to prevent UI lag.

## Security
Project Compass respects workspace boundaries and does not execute arbitrary code unless explicitly requested by the user.

---
*Built for scale and precision.*
