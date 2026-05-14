const NODE_PACKAGE_COMMANDS = {
  npm: { add: ['npm', 'install'], remove: ['npm', 'uninstall'] },
  pnpm: { add: ['pnpm', 'add'], remove: ['pnpm', 'remove'] },
  yarn: { add: ['yarn', 'add'], remove: ['yarn', 'remove'] },
  bun: { add: ['bun', 'add'], remove: ['bun', 'remove'] }
};

const PYTHON_PACKAGE_COMMANDS = {
  uv: { add: ['uv', 'add'], remove: ['uv', 'remove'] },
  poetry: { add: ['poetry', 'add'], remove: ['poetry', 'remove'] },
  pipenv: { add: ['pipenv', 'install'], remove: ['pipenv', 'uninstall'] },
  pip: { add: ['pip', 'install'], remove: ['pip', 'uninstall', '-y'] }
};

function resolveTemplate(templates, manager, action, pkg) {
  const selected = templates[(manager || '').toLowerCase()] || templates[Object.keys(templates)[0]];
  const template = selected?.[action];
  return template ? [...template, pkg] : null;
}

export function getAddCmd(project, pkg) {
  if (!project || !pkg) return null;
  const type = project.type;
  const manager = project.metadata?.packageManager;

  if (type === 'Node.js') return resolveTemplate(NODE_PACKAGE_COMMANDS, manager || 'npm', 'add', pkg);
  if (type === 'Python') return resolveTemplate(PYTHON_PACKAGE_COMMANDS, manager || 'pip', 'add', pkg);
  if (type === 'Rust') return ['cargo', 'add', pkg];
  if (type === 'Go') return ['go', 'get', pkg];
  if (type === '.NET') return ['dotnet', 'add', 'package', pkg];
  if (type === 'PHP') return ['composer', 'require', pkg];
  if (type === 'Ruby') return ['bundle', 'add', pkg];

  return null;
}

export function getRemoveCmd(project, pkg) {
  if (!project || !pkg) return null;
  const type = project.type;
  const manager = project.metadata?.packageManager;

  if (type === 'Node.js') return resolveTemplate(NODE_PACKAGE_COMMANDS, manager || 'npm', 'remove', pkg);
  if (type === 'Python') return resolveTemplate(PYTHON_PACKAGE_COMMANDS, manager || 'pip', 'remove', pkg);
  if (type === 'Rust') return ['cargo', 'remove', pkg];
  if (type === '.NET') return ['dotnet', 'remove', 'package', pkg];
  if (type === 'PHP') return ['composer', 'remove', pkg];
  if (type === 'Ruby') return ['bundle', 'remove', pkg];

  return null;
}
