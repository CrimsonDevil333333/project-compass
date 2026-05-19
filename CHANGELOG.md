# Changelog

All notable changes to Project Compass will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.0.0] - 2026-05-20

### Added
- **Neural Convergence Architecture**: Single-Brain core (`Orchestrator`) powering CLI, TUI, and Web.
- **Synchronized Web Dashboard**: Real-time web interface with 1:1 parity with the TUI.
- **Zero-Mock Scaffolding**: Real-world project creation for Next.js, Rust, Django, and more.
- **Omni-Updater**: Self-updating capability via `project-compass --update`.
- **High-Fidelity AI DNA**: Manifest-driven project analysis with deep context awareness.
- **Unified Audit Engine**: Shared diagnostic logic for CLI `--studio` and Web Studio view.

### Changed
- **Unified Task Engine**: All processes across all interfaces are now tracked in a single, trusted task pool.
- **Deterministic Identity**: Projects are now tracked via stable, path-based IDs for reliable cross-interface state.
- **Production-Build Server**: The web server now serves a compiled production bundle for maximum performance.

## [4.5.0] - 2026-05-20


### Added
- **Agentic AI Horizon**: State-of-the-art AI integration with Context Chat and Error Analysis.
- **Dynamic Search/Filter**: Press `/` in the Navigator to filter projects by name or type in real-time.
- **Animated Splash Screen**: Premium high-fidelity startup experience with ASCII branding.
- **Deep Scan Mode**: Use `--deep` flag for unlimited discovery depth in massive workspaces.
- **Git Visibility**: Real-time branch and status indicators integrated into the Navigator rows.
- **Orbit Cleanup**: Robust SIGINT/SIGTERM handlers to ensure all background processes are terminated on exit.
- **Verification Suite**: `test_projects/` directory with 7 language samples for engine validation.

### Changed
- **Enhanced Header UI**: New structured layout with borders and high-visibility status indicators.
- **Navigator Aesthetics**: Rounded borders and improved typography for a "production-grade" look.
- **CLI Help Revamp**: Professional, high-fidelity help documentation.
- **Detection Depth**: Increased default discovery depth to 7 for better out-of-the-box coverage.

### Fixed
- **Duplicate State Declarations**: Fixed syntax errors in `cli.js` that caused TUI boot failures.
- **Reference Errors**: Fixed `getGitInfo` reference error in the detection orchestrator.
- **Boundary Guards**: Fixed pagination and selection logic to respect filtered search results.

## [4.3.8] - 2026-05-10

### Added
- Initial v4.3 features including Framework Plugins and TUI core.
- Multi-language detection for 8 core languages.
- Orbit Task Manager for background process orchestration.
