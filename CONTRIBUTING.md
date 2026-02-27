# Contributing to Project Compass

Thank you for your interest in helping to navigate the project universe! 🚀

## Core Principles
1.  **High Fidelity:** The UI should feel like a cockpit, not just a text list.
2.  **Safety First:** Commands should be executed safely, and critical actions (like `rm` or `kill`) should have a confirmation gate.
3.  **Speed:** Operations must be non-blocking. Use Ink's async components or background processes via `execa`.

## Working with AI Agents
This repository is "AI-First." Always update `AGENTS.md` after making structural changes to the code or adding new core components. This helps subsequent agents (and humans!) maintain high-velocity context.

## Workflow
1.  **Fork and Branch:** Create a branch for your feature or fix.
2.  **Code Style:** Follow the existing ESM pattern.
3.  **Testing:** Run `npm start` in a large workspace (like a multi-repo folder) to ensure the UI remains performant.
4.  **Commits:** Use conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`).

## Deployment
All production versions are managed by Satyaa and the primary agent, Clawdy. Any `npm version` bump must include an update to `package-lock.json`.

---
*Navigate the future.*
