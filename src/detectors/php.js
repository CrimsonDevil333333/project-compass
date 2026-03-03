import path from 'path';
import { checkBinary } from './utils.js';
export default {
  type: 'php', label: 'PHP', icon: '🐘', priority: 65, files: ['composer.json'], binaries: ['php', 'composer'],
  async build(projectPath, manifest) {
    const missingBinaries = this.binaries.filter(b => !checkBinary(b));
    return {
      id: `${projectPath}::php`, path: projectPath, name: path.basename(projectPath), type: 'PHP', icon: '🐘',
      priority: this.priority, commands: { install: { label: 'Composer install', command: ['composer', 'install'] } },
      metadata: {}, manifest: path.basename(manifest), description: '', missingBinaries, extra: {}
    };
  }
};