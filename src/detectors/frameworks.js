import { dependencyMatches, hasProjectFile, resolveScriptCommand } from './utils.js';

export const builtInFrameworks = [
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
          commands[key] = { label, command: tokens, source: 'framework' };
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
          commands[key] = { label, command: tokens, source: 'framework' };
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
          commands[key] = { label, command: tokens, source: 'framework' };
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
          commands[key] = { label, command: tokens, source: 'framework' };
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
            const commands = {};
      if (hasProjectFile(project.path, 'requirements.txt')) {
        commands.install = { label: 'Pip install', command: ['pip', 'install', '-r', 'requirements.txt'], source: 'framework' };
      }
      if (hasProjectFile(project.path, 'manage.py')) {
        commands.run = { label: 'Django runserver', command: ['python', 'manage.py', 'runserver'], source: 'framework' };
        commands.test = { label: 'Django test', command: ['python', 'manage.py', 'test'], source: 'framework' };
        commands.migrate = { label: 'Django migrate', command: ['python', 'manage.py', 'migrate'], source: 'framework' };
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
          commands[key] = { label, command: tokens, source: 'framework' };
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
      // Moved to 'setup' to avoid hijacking the primary 'install' (I) macro
      return { setup: { label: 'Tailwind Init', command: [pm, 'install', '-D', 'tailwindcss'], source: 'framework' } };
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
        install: { label: 'Prisma install', command: [pm, 'install', '@prisma/client'], source: 'framework' },
        generate: { label: 'Prisma generate', command: [npxLike, 'prisma', 'generate'], source: 'framework' },
        studio: { label: 'Prisma studio', command: [npxLike, 'prisma', 'studio'], source: 'framework' }
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
        install: { label: 'Cargo Fetch', command: ['cargo', 'fetch'], source: 'framework' },
        run: { label: 'Rocket Run', command: ['cargo', 'run'], source: 'framework' },
        test: { label: 'Rocket Test', command: ['cargo', 'test'], source: 'framework' }
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
        install: { label: 'Composer install', command: ['composer', 'install'], source: 'framework' },
        run: { label: 'Artisan Serve', command: ['php', 'artisan', 'serve'], source: 'framework' },
        test: { label: 'Artisan Test', command: ['php', 'artisan', 'test'], source: 'framework' },
        migrate: { label: 'Artisan Migrate', command: ['php', 'artisan', 'migrate'], source: 'framework' }
      };
    }
  }
];
