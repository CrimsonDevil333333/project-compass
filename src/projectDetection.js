import fs from 'fs';
import path from 'path';
import {execSync} from 'child_process';
import fastGlob from 'fast-glob';
import {ensureConfigDir, PLUGIN_FILE} from './configPaths.js';

const IGNORE_PATTERNS = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/target/**'];

const PYTHON_ENTRY_FILES = ['main.py', 'app.py', 'src/main.py', 'src/app.py'];

function checkBinary(name) {
  try {
    const cmd = process.platform === 'win32' ? `where ${name}` : `which ${name}`;
    execSync(cmd, {stdio: 'ignore'});
    return true;
  } catch {
    return false;
  }
}

function getPackageManager(projectPath) {
  if (hasProjectFile(projectPath, 'bun.lockb') || hasProjectFile(projectPath, 'bun.lock')) return 'bun';
  if (hasProjectFile(projectPath, 'pnpm-lock.yaml')) return 'pnpm';
  if (hasProjectFile(projectPath, 'yarn.lock')) return 'yarn';
  return 'npm';
}

function findPythonEntry(projectPath) {
  return PYTHON_ENTRY_FILES.find((file) => hasProjectFile(projectPath, file)) || null;
}

function hasProjectFile(projectPath, file) {
  return fs.existsSync(path.join(projectPath, file));
}

function resolveScriptCommand(project, scriptName, fallback = null) {
  const scripts = project.metadata?.scripts || {};
  const pm = project.metadata?.packageManager || 'npm';
  if (Object.prototype.hasOwnProperty.call(scripts, scriptName)) {
    return [pm, 'run', scriptName];
  }
  if (typeof fallback === 'function') {
    return fallback(pm);
  }
  return fallback;
}

function gatherNodeDependencies(pkg) {
  const deps = new Set();
  ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'].forEach((key) => {
    if (pkg[key]) {
      Object.keys(pkg[key]).forEach((name) => deps.add(name));
    }
  });
  return Array.from(deps);
}

function gatherPythonDependencies(projectPath) {
  const set = new Set();
  const addFromFile = (filePath) => {
    if (!fs.existsSync(filePath)) {
      return;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    raw.split(/\r?\n/).forEach((line) => {
      const clean = line.trim().split('#')[0].trim();
      if (clean) {
        const token = clean.split(/[>=<=~!]/)[0].trim().toLowerCase();
        if (token) {
          set.add(token);
        }
      }
    });
  };
  addFromFile(path.join(projectPath, 'requirements.txt'));
  addFromFile(path.join(projectPath, 'Pipfile'));
  const pyproject = path.join(projectPath, 'pyproject.toml');
  if (fs.existsSync(pyproject)) {
    const content = fs.readFileSync(pyproject, 'utf-8').toLowerCase();
    const matches = content.match(/\b[a-z0-9-_/.]+\b/g);
    (matches || []).forEach((match) => {
      if (match) {
        set.add(match);
      }
    });
  }
  return Array.from(set);
}

function dependencyMatches(project, needle) {
  const dependencies = (project.metadata?.dependencies || []).map((dep) => dep.toLowerCase());
  const target = needle.toLowerCase();
  return dependencies.some((value) => value === target || value.startsWith(`${target}@`) || value.includes(`/${target}`));
}

function parseCommandTokens(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === 'object') {
    if (Array.isArray(value.command)) {
      return value.command;
    }
    if (typeof value.command === 'string') {
      return value.command.trim().split(/\s+/).filter(Boolean);
    }
  }
  if (typeof value === 'string') {
    return value.trim().split(/\s+/).filter(Boolean);
  }
  return [];
}

const builtInFrameworks = [
  {
    id: 'next',
    name: 'Next.js',
    icon: '🧭',
    description: 'React + Next.js (SSR/SSG) apps',
    languages: ['Node.js'],
    priority: 115,
    match(project) {
      const hasNextConfig = ['next.config.js', 'next.config.mjs', 'next.config.ts'].some(f => hasProjectFile(project.path, f));
      return dependencyMatches(project, 'next') || hasNextConfig;
    },
    commands(project) {
      const commands = {};
      const add = (key, label, fallback) => {
        const tokens = resolveScriptCommand(project, key, fallback);
        if (tokens) {
          commands[key] = {label, command: tokens, source: 'framework'};
        }
      };
      add('install', 'Next install', (pm) => [pm, 'install']);
      add('run', 'Next dev', (pm) => pm === 'npm' ? ['npx', 'next', 'dev'] : [pm, 'next', 'dev']);
      add('build', 'Next build', (pm) => pm === 'npm' ? ['npx', 'next', 'build'] : [pm, 'next', 'build']);
      add('test', 'Next test', (pm) => [pm, 'run', 'test']);
      add('start', 'Next start', (pm) => pm === 'npm' ? ['npx', 'next', 'start'] : [pm, 'next', 'start']);
      return commands;
    }
  },
  {
    id: 'react',
    name: 'React',
    icon: '⚛️',
    description: 'React apps (CRA, Vite React)',
    languages: ['Node.js'],
    priority: 112,
    match(project) {
      return dependencyMatches(project, 'react') && (dependencyMatches(project, 'react-scripts') || dependencyMatches(project, 'vite') || hasProjectFile(project.path, 'vite.config.js') || hasProjectFile(project.path, 'vite.config.ts'));
    },
    commands(project) {
      const commands = {};
      const add = (key, label, fallback) => {
        const tokens = resolveScriptCommand(project, key, fallback);
        if (tokens) {
          commands[key] = {label, command: tokens, source: 'framework'};
        }
      };
      add('install', 'React install', (pm) => [pm, 'install']);
      add('run', 'React dev', (pm) => [pm, 'run', 'dev']);
      add('build', 'React build', (pm) => [pm, 'run', 'build']);
      add('test', 'React test', (pm) => [pm, 'run', 'test']);
      return commands;
    }
  },
  {
    id: 'vue',
    name: 'Vue.js',
    icon: '🟩',
    description: 'Vue CLI or Vite + Vue apps',
    languages: ['Node.js'],
    priority: 111,
    match(project) {
      return dependencyMatches(project, 'vue') && (hasProjectFile(project.path, 'vue.config.js') || hasProjectFile(project.path, 'vue.config.ts') || dependencyMatches(project, '@vue/cli-service') || dependencyMatches(project, 'vite'));
    },
    commands(project) {
      const commands = {};
      const add = (key, label, fallback) => {
        const tokens = resolveScriptCommand(project, key, fallback);
        if (tokens) {
          commands[key] = {label, command: tokens, source: 'framework'};
        }
      };
      add('install', 'Vue install', (pm) => [pm, 'install']);
      add('run', 'Vue dev', (pm) => [pm, 'run', 'dev']);
      add('build', 'Vue build', (pm) => [pm, 'run', 'build']);
      add('test', 'Vue test', (pm) => [pm, 'run', 'test']);
      return commands;
    }
  },
  {
    id: 'nest',
    name: 'NestJS',
    icon: '🛡️',
    description: 'NestJS backend',
    languages: ['Node.js'],
    priority: 110,
    match(project) {
      return dependencyMatches(project, '@nestjs/cli') || dependencyMatches(project, '@nestjs/core') || hasProjectFile(project.path, 'nest-cli.json');
    },
    commands(project) {
      const commands = {};
      const add = (key, label, fallback) => {
        const tokens = resolveScriptCommand(project, key, fallback);
        if (tokens) {
          commands[key] = {label, command: tokens, source: 'framework'};
        }
      };
      add('install', 'Nest install', (pm) => [pm, 'install']);
      add('run', 'Nest dev', (pm) => [pm, 'run', 'start:dev']);
      add('build', 'Nest build', (pm) => [pm, 'run', 'build']);
      add('test', 'Nest test', (pm) => [pm, 'run', 'test']);
      return commands;
    }
  },
  {
    id: 'angular',
    name: 'Angular',
    icon: '🅰️',
    description: 'Angular CLI projects',
    languages: ['Node.js'],
    priority: 109,
    match(project) {
      return hasProjectFile(project.path, 'angular.json') || dependencyMatches(project, '@angular/cli');
    },
    commands(project) {
      const commands = {};
      const add = (key, label, fallback) => {
        const tokens = resolveScriptCommand(project, key, fallback);
        if (tokens) {
          commands[key] = {label, command: tokens, source: 'framework'};
        }
      };
      add('install', 'Angular install', (pm) => [pm, 'install']);
      add('run', 'Angular serve', (pm) => [pm, 'run', 'start']);
      add('build', 'Angular build', (pm) => [pm, 'run', 'build']);
      add('test', 'Angular test', (pm) => [pm, 'run', 'test']);
      return commands;
    }
  },
  {
    id: 'sveltekit',
    name: 'SvelteKit',
    icon: '🌀',
    description: 'SvelteKit apps',
    languages: ['Node.js'],
    priority: 108,
    match(project) {
      return hasProjectFile(project.path, 'svelte.config.js') || hasProjectFile(project.path, 'svelte.config.ts') || dependencyMatches(project, '@sveltejs/kit');
    },
    commands(project) {
      const commands = {};
      const add = (key, label, fallback) => {
        const tokens = resolveScriptCommand(project, key, fallback);
        if (tokens) {
          commands[key] = {label, command: tokens, source: 'framework'};
        }
      };
      add('install', 'SvelteKit install', (pm) => [pm, 'install']);
      add('run', 'SvelteKit dev', (pm) => [pm, 'run', 'dev']);
      add('build', 'SvelteKit build', (pm) => [pm, 'run', 'build']);
      add('test', 'SvelteKit test', (pm) => [pm, 'run', 'test']);
      add('preview', 'SvelteKit preview', (pm) => [pm, 'run', 'preview']);
      return commands;
    }
  },
  {
    id: 'nuxt',
    name: 'Nuxt',
    icon: '🪄',
    description: 'Nuxt.js / Vue SSR',
    languages: ['Node.js'],
    priority: 107,
    match(project) {
      return hasProjectFile(project.path, 'nuxt.config.js') || hasProjectFile(project.path, 'nuxt.config.ts') || dependencyMatches(project, 'nuxt');
    },
    commands(project) {
      const commands = {};
      const add = (key, label, fallback) => {
        const tokens = resolveScriptCommand(project, key, fallback);
        if (tokens) {
          commands[key] = {label, command: tokens, source: 'framework'};
        }
      };
      add('install', 'Nuxt install', (pm) => [pm, 'install']);
      add('run', 'Nuxt dev', (pm) => [pm, 'run', 'dev']);
      add('build', 'Nuxt build', (pm) => [pm, 'run', 'build']);
      add('start', 'Nuxt start', (pm) => [pm, 'run', 'start']);
      return commands;
    }
  },
  {
    id: 'astro',
    name: 'Astro',
    icon: '✨',
    description: 'Astro static sites',
    languages: ['Node.js'],
    priority: 106,
    match(project) {
      const matches = ['astro.config.mjs', 'astro.config.ts', 'astro.config.js', 'astro.config.cjs'].some((file) => hasProjectFile(project.path, file));
      return matches || dependencyMatches(project, 'astro');
    },
    commands(project) {
      const commands = {};
      const add = (key, label, fallback) => {
        const tokens = resolveScriptCommand(project, key, fallback);
        if (tokens) {
          commands[key] = {label, command: tokens, source: 'framework'};
        }
      };
      add('install', 'Astro install', (pm) => [pm, 'install']);
      add('run', 'Astro dev', (pm) => [pm, 'run', 'dev']);
      add('build', 'Astro build', (pm) => [pm, 'run', 'build']);
      add('preview', 'Astro preview', (pm) => [pm, 'run', 'preview']);
      return commands;
    }
  },
  {
    id: 'django',
    name: 'Django',
    icon: '🌿',
    description: 'Django web application',
    languages: ['Python'],
    priority: 110,
    match(project) {
      return dependencyMatches(project, 'django') || hasProjectFile(project.path, 'manage.py');
    },
    commands(project) {
      const managePath = path.join(project.path, 'manage.py');
      const commands = {};
      if (hasProjectFile(project.path, 'requirements.txt')) {
        commands.install = {label: 'Pip install', command: ['pip', 'install', '-r', 'requirements.txt'], source: 'framework'};
      }
      if (fs.existsSync(managePath)) {
        commands.run = {label: 'Django runserver', command: ['python', 'manage.py', 'runserver'], source: 'framework'};
        commands.test = {label: 'Django test', command: ['python', 'manage.py', 'test'], source: 'framework'};
        commands.migrate = {label: 'Django migrate', command: ['python', 'manage.py', 'migrate'], source: 'framework'};
      }
      return commands;
    }
  },
  {
    id: 'flask',
    name: 'Flask',
    icon: '🍶',
    description: 'Flask microservices',
    languages: ['Python'],
    priority: 105,
    match(project) {
      const entry = findPythonEntry(project.path);
      return Boolean(entry && (dependencyMatches(project, 'flask') || dependencyMatches(project, 'flask-restful') || dependencyMatches(project, 'flask-cors')));
    },
    commands(project) {
      const entry = findPythonEntry(project.path);
      const commands = {};
      if (hasProjectFile(project.path, 'requirements.txt')) {
        commands.install = {label: 'Pip install', command: ['pip', 'install', '-r', 'requirements.txt'], source: 'framework'};
      }
      if (entry) {
        commands.run = {label: 'Flask app', command: ['python', entry], source: 'framework'};
        commands.test = {label: 'Pytest', command: ['pytest'], source: 'framework'};
      }
      return commands;
    }
  },
  {
    id: 'fastapi',
    name: 'FastAPI',
    icon: '⚡',
    description: 'FastAPI + Uvicorn',
    languages: ['Python'],
    priority: 105,
    match(project) {
      const entry = findPythonEntry(project.path);
      return Boolean(entry && (dependencyMatches(project, 'fastapi') || dependencyMatches(project, 'pydantic') || dependencyMatches(project, 'uvicorn')));
    },
    commands(project) {
      const entry = findPythonEntry(project.path);
      const commands = {};
      if (hasProjectFile(project.path, 'requirements.txt')) {
        commands.install = {label: 'Pip install', command: ['pip', 'install', '-r', 'requirements.txt'], source: 'framework'};
      }
      if (entry) {
        const moduleName = entry.split('.').slice(0, -1).join('.') || entry;
        commands.run = {label: 'Uvicorn reload', command: ['uvicorn', `${moduleName}:app`, '--reload'], source: 'framework'};
        commands.test = {label: 'Pytest', command: ['pytest'], source: 'framework'};
      }
      return commands;
    }
  },
  {
    id: 'vite',
    name: 'Vite',
    icon: '⚡',
    description: 'Vite-powered frontend',
    languages: ['Node.js'],
    priority: 100,
    match(project) {
      return hasProjectFile(project.path, 'vite.config.js') || hasProjectFile(project.path, 'vite.config.ts') || dependencyMatches(project, 'vite');
    },
    commands(project) {
      const commands = {};
      const add = (key, label, fallback) => {
        const tokens = resolveScriptCommand(project, key, fallback);
        if (tokens) {
          commands[key] = {label, command: tokens, source: 'framework'};
        }
      };
      add('install', 'Vite install', (pm) => [pm, 'install']);
      add('run', 'Vite dev', (pm) => pm === 'npm' ? ['npx', 'vite'] : [pm, 'vite']);
      add('build', 'Vite build', (pm) => pm === 'npm' ? ['npx', 'vite', 'build'] : [pm, 'vite', 'build']);
      add('preview', 'Vite preview', (pm) => pm === 'npm' ? ['npx', 'vite', 'preview'] : [pm, 'vite', 'preview']);
      return commands;
    }
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    icon: '🎨',
    description: 'Tailwind utility-first CSS',
    languages: ['Node.js'],
    priority: 50,
    match(project) {
      return hasProjectFile(project.path, 'tailwind.config.js') || hasProjectFile(project.path, 'tailwind.config.ts') || dependencyMatches(project, 'tailwindcss');
    },
    commands(project) { 
      const pm = project.metadata?.packageManager || 'npm';
      return { install: {label: 'Tailwind install', command: [pm, 'install', '-D', 'tailwindcss'], source: 'framework'} }; 
    }
  },
  {
    id: 'prisma',
    name: 'Prisma',
    icon: '◮',
    description: 'Prisma ORM',
    languages: ['Node.js'],
    priority: 50,
    match(project) {
      return hasProjectFile(project.path, 'prisma/schema.prisma') || dependencyMatches(project, '@prisma/client');
    },
    commands(project) {
      const pm = project.metadata?.packageManager || 'npm';
      const npxLike = pm === 'npm' ? 'npx' : pm;
      return {
        install: {label: 'Prisma install', command: [pm, 'install', '@prisma/client'], source: 'framework'},
        generate: {label: 'Prisma generate', command: [npxLike, 'prisma', 'generate'], source: 'framework'},
        studio: {label: 'Prisma studio', command: [npxLike, 'prisma', 'studio'], source: 'framework'}
      };
    }
  },
  {
    id: 'spring',
    name: 'Spring Boot',
    icon: '🌱',
    description: 'Spring Boot apps',
    languages: ['Java', 'Kotlin'],
    priority: 105,
    match(project) {
      return dependencyMatches(project, 'spring-boot-starter') || 
             dependencyMatches(project, 'spring-boot-autoconfigure') ||
             hasProjectFile(project.path, 'src/main/resources/application.properties') ||
             hasProjectFile(project.path, 'src/main/resources/application.yml');
    },
    commands(project) {
      const hasMvnw = hasProjectFile(project.path, 'mvnw');
      const hasGradlew = hasProjectFile(project.path, 'gradlew');
      if (hasGradlew) {
        return {
          install: {label: 'Gradle Resolve', command: ['./gradlew', 'dependencies'], source: 'framework'},
          run: {label: 'Gradle BootRun', command: ['./gradlew', 'bootRun'], source: 'framework'},
          build: {label: 'Gradle Build', command: ['./gradlew', 'build'], source: 'framework'},
          test: {label: 'Gradle Test', command: ['./gradlew', 'test'], source: 'framework'}
        };
      }
      const base = hasMvnw ? './mvnw' : 'mvn';
      return {
        install: {label: 'Maven Install', command: [base, 'install'], source: 'framework'},
        run: {label: 'Spring Boot run', command: [base, 'spring-boot:run'], source: 'framework'},
        build: {label: 'Maven package', command: [base, 'package'], source: 'framework'},
        test: {label: 'Maven test', command: [base, 'test'], source: 'framework'}
      };
    }
  },
  {
    id: 'rocket',
    name: 'Rocket',
    icon: '🚀',
    description: 'Rocket Rust Web',
    languages: ['Rust'],
    priority: 105,
    match(project) {
      return dependencyMatches(project, 'rocket');
    },
    commands() {
      return {
        install: {label: 'Cargo Fetch', command: ['cargo', 'fetch'], source: 'framework'},
        run: {label: 'Rocket Run', command: ['cargo', 'run'], source: 'framework'},
        test: {label: 'Rocket Test', command: ['cargo', 'test'], source: 'framework'}
      };
    }
  },
  {
    id: 'actix',
    name: 'Actix Web',
    icon: '🦀',
    description: 'Actix Rust Web',
    languages: ['Rust'],
    priority: 105,
    match(project) {
      return dependencyMatches(project, 'actix-web');
    },
    commands() {
      return {
        install: {label: 'Cargo Fetch', command: ['cargo', 'fetch'], source: 'framework'},
        run: {label: 'Actix Run', command: ['cargo', 'run'], source: 'framework'},
        test: {label: 'Actix Test', command: ['cargo', 'test'], source: 'framework'}
      };
    }
  },
  {
    id: 'aspnet',
    name: 'ASP.NET Core',
    icon: '🌐',
    description: 'ASP.NET Core Web App',
    languages: ['.NET'],
    priority: 105,
    match(project) {
      return hasProjectFile(project.path, 'Program.cs') && 
             (hasProjectFile(project.path, 'appsettings.json') || hasProjectFile(project.path, 'web.config'));
    },
    commands() {
      return {
        install: {label: 'dotnet restore', command: ['dotnet', 'restore'], source: 'framework'},
        run: {label: 'dotnet run', command: ['dotnet', 'run'], source: 'framework'},
        watch: {label: 'dotnet watch', command: ['dotnet', 'watch', 'run'], source: 'framework'},
        test: {label: 'dotnet test', command: ['dotnet', 'test'], source: 'framework'}
      };
    }
  },
  {
    id: 'laravel',
    name: 'Laravel',
    icon: '🧡',
    description: 'Laravel PHP Framework',
    languages: ['PHP'],
    priority: 105,
    match(project) {
      return hasProjectFile(project.path, 'artisan') || dependencyMatches(project, 'laravel/framework');
    },
    commands() {
      return {
        install: {label: 'Composer install', command: ['composer', 'install'], source: 'framework'},
        run: {label: 'Artisan Serve', command: ['php', 'artisan', 'serve'], source: 'framework'},
        test: {label: 'Artisan Test', command: ['php', 'artisan', 'test'], source: 'framework'},
        migrate: {label: 'Artisan Migrate', command: ['php', 'artisan', 'migrate'], source: 'framework'}
      };
    }
  }
];

class SchemaRegistry {
  constructor() {
    this.cache = null;
  }

  getSchemas() {
    if (this.cache) {
      return this.cache;
    }
    const schemas = this.buildSchemas();
    this.cache = schemas;
    return schemas;
  }

  buildSchemas() {
    const schemas = [
      {
        type: 'node',
        label: 'Node.js',
        icon: '🟢',
        priority: 100,
        files: ['package.json'],
        binaries: ['node', 'npm'],
        async build(projectPath, manifest) {
          const missingBinaries = this.binaries.filter(b => !checkBinary(b));
          const pkgPath = path.join(projectPath, 'package.json');
          if (!fs.existsSync(pkgPath)) {
            return null;
          }
          const content = await fs.promises.readFile(pkgPath, 'utf-8');
          const pkg = JSON.parse(content);
          const pm = getPackageManager(projectPath);
          const scripts = pkg.scripts || {};
          const commands = {};
          const preferScript = (targetKey, names, labelText) => {
            for (const name of names) {
              if (Object.prototype.hasOwnProperty.call(scripts, name)) {
                commands[targetKey] = {label: labelText, command: [pm, 'run', name]};
                break;
              }
            }
          };
          commands.install = {label: 'Install', command: [pm, 'install']};
          preferScript('build', ['build', 'compile', 'dist'], 'Build');
          preferScript('test', ['test', 'check', 'spec'], 'Test');
          preferScript('run', ['start', 'dev', 'serve', 'run'], 'Start');
          if (Object.prototype.hasOwnProperty.call(scripts, 'lint')) {
            commands.lint = {label: 'Lint', command: [pm, 'run', 'lint']};
          }

          const metadata = {
            dependencies: gatherNodeDependencies(pkg),
            scripts,
            packageJson: pkg,
            packageManager: getPackageManager(projectPath)
          };

          const setupHints = [];
          if (metadata.dependencies.length) {
            setupHints.push('Run npm install to fetch dependencies.');
            if (hasProjectFile(projectPath, 'yarn.lock')) {
              setupHints.push('Or run yarn install if you prefer Yarn.');
            }
          }

          return {
            id: `${projectPath}::node`,
            path: projectPath,
            name: pkg.name || path.basename(projectPath),
            type: 'Node.js',
            icon: '🟢',
            priority: this.priority,
            commands,
            metadata,
            manifest: path.basename(manifest),
            description: pkg.description || '',
            missingBinaries,
            extra: {
              scripts: Object.keys(scripts),
              setupHints
            }
          };
        }
      },
      {
        type: 'python',
        label: 'Python',
        icon: '🐍',
        priority: 95,
        files: ['pyproject.toml', 'requirements.txt', 'setup.py', 'Pipfile'],
        binaries: [process.platform === 'win32' ? 'python' : 'python3', 'pip'],
        async build(projectPath, manifest) {
          const missingBinaries = this.binaries.filter(b => !checkBinary(b));
          const commands = {};
          if (hasProjectFile(projectPath, 'requirements.txt')) {
            commands.install = {label: 'Pip Install', command: ['pip', 'install', '-r', 'requirements.txt']};
          }
          if (hasProjectFile(projectPath, 'pyproject.toml')) {
            commands.test = {label: 'Pytest', command: ['pytest']};
          } else {
            commands.test = {label: 'Unittest', command: ['python', '-m', 'unittest', 'discover']};
          }

          const entry = findPythonEntry(projectPath);
          if (entry) {
            commands.run = {label: 'Run', command: ['python', entry]};
          }

          const metadata = {
            dependencies: gatherPythonDependencies(projectPath)
          };

          const setupHints = [];
          if (hasProjectFile(projectPath, 'requirements.txt')) {
            setupHints.push('pip install -r requirements.txt');
          }
          if (hasProjectFile(projectPath, 'Pipfile')) {
            setupHints.push('Use pipenv install --dev or poetry install');
          }

          return {
            id: `${projectPath}::python`,
            path: projectPath,
            name: path.basename(projectPath),
            type: 'Python',
            icon: '🐍',
            priority: this.priority,
            commands,
            metadata,
            manifest: path.basename(manifest),
            description: '',
            missingBinaries,
            extra: {
              entry,
              setupHints
            }
          };
        },
      },
      {
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
              install: {label: 'Cargo fetch', command: ['cargo', 'fetch']},
              build: {label: 'Cargo build', command: ['cargo', 'build']},
              test: {label: 'Cargo test', command: ['cargo', 'test']},
              run: {label: 'Cargo run', command: ['cargo', 'run']}
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
      },
      {
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
              install: {label: 'Go tidy', command: ['go', 'mod', 'tidy']},
              build: {label: 'Go build', command: ['go', 'build', './...']},
              test: {label: 'Go test', command: ['go', 'test', './...']},
              run: {label: 'Go run', command: ['go', 'run', '.']}
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
      },
      {
        type: 'java',
        label: 'Java',
        icon: '☕️',
        priority: 80,
        files: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
        binaries: ['java', 'javac'],
        async build(projectPath, manifest) {
          const missingBinaries = this.binaries.filter(b => !checkBinary(b));
          const hasMvnw = hasProjectFile(projectPath, 'mvnw');
          const hasGradlew = hasProjectFile(projectPath, 'gradlew');
          const commands = {};
          if (hasGradlew) {
            commands.install = {label: 'Gradle resolve', command: ['./gradlew', 'dependencies']};
            commands.build = {label: 'Gradle build', command: ['./gradlew', 'build']};
            commands.test = {label: 'Gradle test', command: ['./gradlew', 'test']};
          } else if (hasMvnw) {
            commands.install = {label: 'Maven install', command: ['./mvnw', 'install']};
            commands.build = {label: 'Maven package', command: ['./mvnw', 'package']};
            commands.test = {label: 'Maven test', command: ['./mvnw', 'test']};
          } else {
            commands.build = {label: 'Maven package', command: ['mvn', 'package']};
            commands.test = {label: 'Maven test', command: ['mvn', 'test']};
          }

          return {
            id: `${projectPath}::java`,
            path: projectPath,
            name: path.basename(projectPath),
            type: 'Java',
            icon: '☕️',
            priority: this.priority,
            commands,
            metadata: {},
            manifest: path.basename(manifest),
            description: '',
            missingBinaries,
            extra: {
              setupHints: ['Install JDK 17+ and run ./mvnw install or ./gradlew build']
            }
          };
        }
      },
      {
        type: 'scala',
        label: 'Scala',
        icon: '🔵',
        priority: 70,
        files: ['build.sbt'],
        binaries: ['sbt', 'scala'],
        async build(projectPath, manifest) {
          const missingBinaries = this.binaries.filter(b => !checkBinary(b));
          return {
            id: `${projectPath}::scala`,
            path: projectPath,
            name: path.basename(projectPath),
            type: 'Scala',
            icon: '🔵',
            priority: this.priority,
            commands: {
              install: {label: 'sbt update', command: ['sbt', 'update']},
              build: {label: 'sbt compile', command: ['sbt', 'compile']},
              test: {label: 'sbt test', command: ['sbt', 'test']},
              run: {label: 'sbt run', command: ['sbt', 'run']}
            },
            metadata: {},
            manifest: path.basename(manifest),
            description: '',
            missingBinaries,
            extra: {
              setupHints: ['Ensure sbt is installed', 'Run sbt compile before running your app']
            }
          };
        }
      },
      {
        type: 'php',
        label: 'PHP',
        icon: '🐘',
        priority: 65,
        files: ['composer.json'],
        binaries: ['php', 'composer'],
        async build(projectPath, manifest) {
          const missingBinaries = this.binaries.filter(b => !checkBinary(b));
          return {
            id: `${projectPath}::php`,
            path: projectPath,
            name: path.basename(projectPath),
            type: 'PHP',
            icon: '🐘',
            priority: this.priority,
            commands: {
              install: {label: 'Composer install', command: ['composer', 'install']},
              test: {label: 'PHP -v', command: ['php', '-v']}
            },
            metadata: {},
            manifest: path.basename(manifest),
            description: '',
            missingBinaries,
            extra: {
              setupHints: ['composer install to install dependencies']
            }
          };
        }
      },
      {
        type: 'ruby',
        label: 'Ruby',
        icon: '💎',
        priority: 65,
        files: ['Gemfile'],
        binaries: ['ruby', 'bundle'],
        async build(projectPath, manifest) {
          const missingBinaries = this.binaries.filter(b => !checkBinary(b));
          return {
            id: `${projectPath}::ruby`,
            path: projectPath,
            name: path.basename(projectPath),
            type: 'Ruby',
            icon: '💎',
            priority: this.priority,
            commands: {
              install: {label: 'Bundle install', command: ['bundle', 'install']},
              run: {label: 'Ruby console', command: ['ruby', 'app.rb']},
              test: {label: 'Ruby test', command: ['bundle', 'exec', 'rspec']}
            },
            metadata: {},
            manifest: path.basename(manifest),
            description: '',
            missingBinaries,
            extra: {
              setupHints: ['bundle install to ensure gems are present']
            }
          };
        }
      },
      {
        type: 'dotnet',
        label: '.NET',
        icon: '🔷',
        priority: 65,
        files: ['*.csproj'],
        binaries: ['dotnet'],
        async build(projectPath, manifest) {
          const missingBinaries = this.binaries.filter(b => !checkBinary(b));
          return {
            id: `${projectPath}::dotnet`,
            path: projectPath,
            name: path.basename(projectPath),
            type: '.NET',
            icon: '🔷',
            priority: this.priority,
            commands: {
              install: {label: 'dotnet restore', command: ['dotnet', 'restore']},
              build: {label: 'dotnet build', command: ['dotnet', 'build']},
              test: {label: 'dotnet test', command: ['dotnet', 'test']},
              run: {label: 'dotnet run', command: ['dotnet', 'run']}
            },
            metadata: {},
            manifest: path.basename(manifest),
            description: '',
            missingBinaries,
            extra: {
              setupHints: ['Install .NET SDK 8+', 'dotnet restore before running']
            }
          };
        }
      },
      {
        type: 'shell',
        label: 'Shell / Makefile',
        icon: '🐚',
        priority: 50,
        files: ['Makefile', 'build.sh'],
        binaries: ['make', 'sh'],
        async build(projectPath, manifest) {
          const missingBinaries = this.binaries.filter(b => !checkBinary(b));
          return {
            id: `${projectPath}::shell`,
            path: projectPath,
            name: path.basename(projectPath),
            type: 'Shell / Makefile',
            icon: '🐚',
            priority: this.priority,
            commands: {
              build: {label: 'make build', command: ['make', 'build']},
              test: {label: 'make test', command: ['make', 'test']}
            },
            metadata: {},
            manifest: path.basename(manifest),
            description: '',
            missingBinaries,
            extra: {
              setupHints: ['Run make install if available', 'Ensure shell scripts are executable']
            }
          };
        }
      },
      {
        type: 'generic',
        label: 'Custom project',
        icon: '🧰',
        priority: 10,
        files: ['README.md'],
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
      }
    ];
    return schemas;
  }
}

const schemaRegistry = new SchemaRegistry();

function loadUserFrameworks() {
  ensureConfigDir();
  if (!fs.existsSync(PLUGIN_FILE)) {
    return [];
  }
  try {
    const payload = JSON.parse(fs.readFileSync(PLUGIN_FILE, 'utf-8') || '{}');
    const plugins = payload.plugins || [];
    return plugins.map((entry) => {
      const normalizedId = entry.id || (entry.name ? entry.name.toLowerCase().replace(/\s+/g, '-') : `plugin-${Math.random().toString(36).slice(2, 8)}`);
      const commands = {};
      Object.entries(entry.commands || {}).forEach(([key, value]) => {
        const tokens = parseCommandTokens(typeof value === 'object' ? value.command : value);
        if (!tokens.length) {
          return;
        }
        commands[key] = {
          label: typeof value === 'object' ? value.label || key : key,
          command: tokens,
          source: 'plugin'
        };
      });
      return {
        id: normalizedId,
        name: entry.name || normalizedId,
        icon: entry.icon || '🧩',
        description: entry.description || '',
        languages: entry.languages || [],
        files: entry.files || [],
        dependencies: entry.dependencies || [],
        scripts: entry.scripts || [],
        priority: Number.isFinite(entry.priority) ? entry.priority : 70,
        commands,
        match: entry.match
      };
    }).filter((plugin) => plugin.name && plugin.commands && Object.keys(plugin.commands).length);
  } catch (error) {
    console.error(`Failed to parse plugins.json: ${error.message}`);
    return [];
  }
}

let cachedFrameworkPlugins = null;

function getFrameworkPlugins() {
  if (cachedFrameworkPlugins) {
    return cachedFrameworkPlugins;
  }
  cachedFrameworkPlugins = [...builtInFrameworks, ...loadUserFrameworks()];
  return cachedFrameworkPlugins;
}

function matchesPlugin(project, plugin) {
  if (plugin.languages && plugin.languages.length > 0 && !plugin.languages.includes(project.type)) {
    return false;
  }
  if (plugin.files && plugin.files.length > 0) {
    const hit = plugin.files.some((file) => hasProjectFile(project.path, file));
    if (!hit) {
      return false;
    }
  }
  if (plugin.dependencies && plugin.dependencies.length > 0) {
    const hit = plugin.dependencies.some((dep) => dependencyMatches(project, dep));
    if (!hit) {
      return false;
    }
  }
  if (plugin.scripts && plugin.scripts.length > 0) {
    const scripts = project.metadata?.scripts || {};
    const hit = plugin.scripts.some((name) => Object.prototype.hasOwnProperty.call(scripts, name));
    if (!hit) {
      return false;
    }
  }
  if (typeof plugin.match === 'function') {
    if (!plugin.match(project)) {
      return false;
    }
  }
  return true;
}

function applyFrameworkPlugins(project) {
  const plugins = getFrameworkPlugins();
  let commands = {...project.commands};
  const frameworks = [];
  let maxPriority = project.priority || 0;
  for (const plugin of plugins) {
    if (!matchesPlugin(project, plugin)) {
      continue;
    }
    frameworks.push({id: plugin.id, name: plugin.name, icon: plugin.icon, description: plugin.description});
    if (plugin.priority && plugin.priority > maxPriority) {
      maxPriority = plugin.priority;
    }
    const pluginCommands = typeof plugin.commands === 'function' ? plugin.commands(project) : plugin.commands;
    if (pluginCommands) {
      Object.entries(pluginCommands).forEach(([key, command]) => {
        if (!Array.isArray(command.command) || command.command.length === 0) {
          return;
        }
        commands = {
          ...commands,
          [key]: {
            ...command,
            source: command.source || 'framework'
          }
        };
      });
    }
  }
  return {...project, commands, frameworks, priority: maxPriority};
}

async function discoverProjects(root) {
  const projectMap = new Map();
  const schemas = schemaRegistry.getSchemas();
  for (const schema of schemas) {
    const patterns = schema.files.map((file) => `**/${file}`);
    const matches = await fastGlob(patterns, {
      cwd: root,
      ignore: IGNORE_PATTERNS,
      onlyFiles: true,
      deep: 5
    });

    for (const match of matches) {
      const projectDir = path.resolve(root, path.dirname(match));
      const existing = projectMap.get(projectDir);
      if (existing && existing.priority >= schema.priority) {
        continue;
      }
      const entry = await schema.build(projectDir, match);
      if (!entry) {
        continue;
      }
      const withFrameworks = applyFrameworkPlugins(entry);
      projectMap.set(projectDir, withFrameworks);
    }
  }
  return Array.from(projectMap.values()).sort((a, b) => b.priority - a.priority);
}

const SCHEMA_GUIDE = schemaRegistry.getSchemas().map((schema) => ({
  type: schema.type,
  label: schema.label || schema.type,
  icon: schema.icon || '⚙',
  files: schema.files
}));

export {discoverProjects, SCHEMA_GUIDE, checkBinary};
