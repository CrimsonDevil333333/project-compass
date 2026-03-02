import path from 'path';
import { checkBinary } from './utils.js';

export default {
  type: 'go',
  label: 'Go',
  icon: '🐹',
  priority: 85,
  files: ['go.mod'],
  binaries: ['go'],
  async build(projectPath, manifest) {
    const missingBinaries = this.binaries.filter(b => !checkBinary(b));
    return {
      id: `${projectPath}::go`,
      path: projectPath,
      name: path.basename(projectPath),
      type: 'Go',
      icon: '🐹',
      priority: this.priority,
      commands: {
        install: { label: 'Go tidy', command: ['go', 'mod', 'tidy'] },
        build: { label: 'Go build', command: ['go', 'build', './...'] },
        test: { label: 'Go test', command: ['go', 'test', './...'] },
        run: { label: 'Go run', command: ['go', 'run', '.'] }
      },
      metadata: {},
      manifest: path.basename(manifest),
      description: '',
      missingBinaries,
      extra: {
        setupHints: ['go mod tidy', 'Ensure Go toolchain is installed']
      }
    };
  }
};
