import path from 'path';
import { checkBinary } from './utils.js';
export default {
  type: 'dotnet', label: '.NET', icon: '🎯', priority: 65, files: ['*.csproj', '*.sln'], binaries: ['dotnet'],
  async build(projectPath, manifest) {
    const missingBinaries = this.binaries.filter(b => !checkBinary(b));
    return {
      id: `${projectPath}::dotnet`, path: projectPath, name: path.basename(projectPath), type: '.NET', icon: '🎯',
      priority: this.priority, commands: { install: { label: 'dotnet restore', command: ['dotnet', 'restore'] } },
      metadata: {}, manifest: path.basename(manifest), description: '', missingBinaries, extra: {}
    };
  }
};