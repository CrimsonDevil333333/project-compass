import path from 'path';
import { checkBinary } from './utils.js';
export default {
  type: 'ruby', label: 'Ruby', icon: '💎', priority: 65, files: ['Gemfile'], binaries: ['ruby', 'bundle'],
  async build(projectPath, manifest) {
    const missingBinaries = this.binaries.filter(b => !checkBinary(b));
    return {
      id: `${projectPath}::ruby`, path: projectPath, name: path.basename(projectPath), type: 'Ruby', icon: '💎',
      priority: this.priority, commands: { install: { label: 'Bundle install', command: ['bundle', 'install'] } },
      metadata: {}, manifest: path.basename(manifest), description: '', missingBinaries, extra: {}
    };
  }
};