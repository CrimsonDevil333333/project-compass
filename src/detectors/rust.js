import path from 'path';
import { checkBinary } from './utils.js';

export default {
  type: 'rust',
  label: 'Rust',
  icon: '🦀',
  priority: 90,
  files: ['Cargo.toml'],
  binaries: ['cargo', 'rustc'],
  async build(projectPath, manifest) {
    const missingBinaries = this.binaries.filter(b => !checkBinary(b));
    return {
      id: `${projectPath}::rust`,
      path: projectPath,
      name: path.basename(projectPath),
      type: 'Rust',
      icon: '🦀',
      priority: this.priority,
      commands: {
        install: { label: 'Cargo fetch', command: ['cargo', 'fetch'] },
        build: { label: 'Cargo build', command: ['cargo', 'build'] },
        test: { label: 'Cargo test', command: ['cargo', 'test'] },
        run: { label: 'Cargo run', command: ['cargo', 'run'] }
      },
      metadata: {},
      manifest: path.basename(manifest),
      description: '',
      missingBinaries,
      extra: {
        setupHints: ['cargo fetch', 'Run cargo build before releasing']
      }
    };
  }
};
