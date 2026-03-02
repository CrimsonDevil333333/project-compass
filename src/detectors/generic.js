import path from 'path';

export default {
  type: 'generic',
  label: 'Custom project',
  icon: '🧰',
  priority: 10,
  files: ['README.md', 'Makefile', 'build.sh'],
  binaries: [],
  async build(projectPath, manifest) {
    return {
      id: `${projectPath}::generic`,
      path: projectPath,
      name: path.basename(projectPath),
      type: 'Custom',
      icon: '🧰',
      priority: this.priority,
      commands: {},
      metadata: {},
      manifest: path.basename(manifest),
      description: 'Detected via README or Makefile layout.',
      missingBinaries: [],
      extra: {
        setupHints: ['Read the README for custom build instructions']
      }
    };
  }
};
