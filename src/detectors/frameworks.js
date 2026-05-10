import { dependencyMatches, hasProjectFile, resolveScriptCommand } from './utils.js';

export const builtInFrameworks = [
  // ==================== NODE.JS FRAMEWORKS ====================
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
        if (tokens) commands[key] = { label, command: tokens, source: 'framework' };
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
    id: 'express',
    name: 'Express',
    icon: '🚂',
    description: 'Express.js web framework',
    languages: ['Node.js'],
    priority: 108,
    match(project) {
      return dependencyMatches(project, 'express') && !dependencyMatches(project, 'next') && !dependencyMatches(project, '@nestjs/core');
    },
    commands(project) {
      const pm = project.metadata?.packageManager || 'npm';
      return {
        install: { label: 'Express install', command: [pm, 'install'], source: 'framework' },
        start: { label: 'Express start', command: [pm, 'run', 'start'], source: 'framework' },
        dev: { label: 'Express dev', command: [pm, 'run', 'dev'], source: 'framework' }
      };
    }
  },
  {
    id: 'fastify',
    name: 'Fastify',
    icon: '⚡',
    description: 'Fast and low overhead web framework',
    languages: ['Node.js'],
    priority: 107,
    match(project) {
      return dependencyMatches(project, 'fastify');
    },
    commands(project) {
      const pm = project.metadata?.packageManager || 'npm';
      return {
        install: { label: 'Fastify install', command: [pm, 'install'], source: 'framework' },
        start: { label: 'Fastify start', command: [pm, 'run', 'start'], source: 'framework' },
        dev: { label: 'Fastify dev', command: [pm, 'run', 'dev'], source: 'framework' }
      };
    }
  },
  {
    id: 'koa',
    name: 'Koa',
    icon: '🎋',
    description: 'Koa web framework by Express team',
    languages: ['Node.js'],
    priority: 106,
    match(project) {
      return dependencyMatches(project, 'koa');
    },
    commands(project) {
      const pm = project.metadata?.packageManager || 'npm';
      return {
        install: { label: 'Koa install', command: [pm, 'install'], source: 'framework' },
        start: { label: 'Koa start', command: [pm, 'run', 'start'], source: 'framework' }
      };
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
        if (tokens) commands[key] = { label, command: tokens, source: 'framework' };
      };
      add('install', 'Nest install', (pm) => [pm, 'install']);
      add('run', 'Nest dev', (pm) => [pm, 'run', 'start:dev']);
      add('build', 'Nest build', (pm) => [pm, 'run', 'build']);
      add('test', 'Nest test', (pm) => [pm, 'run', 'test']);
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
        if (tokens) commands[key] = { label, command: tokens, source: 'framework' };
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
        if (tokens) commands[key] = { label, command: tokens, source: 'framework' };
      };
      add('install', 'Vue install', (pm) => [pm, 'install']);
      add('run', 'Vue dev', (pm) => [pm, 'run', 'dev']);
      add('build', 'Vue build', (pm) => [pm, 'run', 'build']);
      add('test', 'Vue test', (pm) => [pm, 'run', 'test']);
      return commands;
    }
  },
  {
    id: 'svelte',
    name: 'Svelte',
    icon: '🧡',
    description: 'SvelteKit or Svelte apps',
    languages: ['Node.js'],
    priority: 109,
    match(project) {
      return dependencyMatches(project, 'svelte') || dependencyMatches(project, '@sveltejs/kit') || hasProjectFile(project.path, 'svelte.config.js');
    },
    commands(project) {
      const commands = {};
      const add = (key, label, fallback) => {
        const tokens = resolveScriptCommand(project, key, fallback);
        if (tokens) commands[key] = { label, command: tokens, source: 'framework' };
      };
      add('install', 'Svelte install', (pm) => [pm, 'install']);
      add('run', 'Svelte dev', (pm) => [pm, 'run', 'dev']);
      add('build', 'Svelte build', (pm) => [pm, 'run', 'build']);
      add('test', 'Svelte test', (pm) => [pm, 'run', 'test']);
      return commands;
    }
  },
  {
    id: 'astro',
    name: 'Astro',
    icon: '🚀',
    description: 'Astro SSR/SSG framework',
    languages: ['Node.js'],
    priority: 108,
    match(project) {
      return dependencyMatches(project, 'astro') || hasProjectFile(project.path, 'astro.config.mjs') || hasProjectFile(project.path, 'astro.config.ts');
    },
    commands(project) {
      const commands = {};
      const add = (key, label, fallback) => {
        const tokens = resolveScriptCommand(project, key, fallback);
        if (tokens) commands[key] = { label, command: tokens, source: 'framework' };
      };
      add('install', 'Astro install', (pm) => [pm, 'install']);
      add('run', 'Astro dev', (pm) => [pm, 'run', 'dev']);
      add('build', 'Astro build', (pm) => [pm, 'run', 'build']);
      add('preview', 'Astro preview', (pm) => [pm, 'run', 'preview']);
      return commands;
    }
  },
  {
    id: 'nuxt',
    name: 'Nuxt',
    icon: '🟢',
    description: 'Nuxt.js Vue framework',
    languages: ['Node.js'],
    priority: 110,
    match(project) {
      return dependencyMatches(project, 'nuxt') || dependencyMatches(project, '@nuxt/core') || hasProjectFile(project.path, 'nuxt.config.ts') || hasProjectFile(project.path, 'nuxt.config.js');
    },
    commands(project) {
      const commands = {};
      const add = (key, label, fallback) => {
        const tokens = resolveScriptCommand(project, key, fallback);
        if (tokens) commands[key] = { label, command: tokens, source: 'framework' };
      };
      add('install', 'Nuxt install', (pm) => [pm, 'install']);
      add('run', 'Nuxt dev', (pm) => [pm, 'run', 'dev']);
      add('build', 'Nuxt build', (pm) => [pm, 'run', 'build']);
      add('generate', 'Nuxt generate', (pm) => [pm, 'run', 'generate']);
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
        if (tokens) commands[key] = { label, command: tokens, source: 'framework' };
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
    id: 'trpc',
    name: 'tRPC',
    icon: '🔌',
    description: 'End-to-end typesafe APIs',
    languages: ['Node.js'],
    priority: 45,
    match(project) {
      return dependencyMatches(project, '@trpc/server') || dependencyMatches(project, '@trpc/client');
    },
    commands(project) {
      const pm = project.metadata?.packageManager || 'npm';
      return {
        dev: { label: 'tRPC dev', command: [pm, 'run', 'dev'], source: 'framework' },
        build: { label: 'tRPC build', command: [pm, 'run', 'build'], source: 'framework' }
      };
    }
  },
  {
    id: 'graphql',
    name: 'GraphQL',
    icon: '◼️',
    description: 'GraphQL API framework',
    languages: ['Node.js'],
    priority: 48,
    match(project) {
      return dependencyMatches(project, 'graphql') || dependencyMatches(project, 'apollo-server') || dependencyMatches(project, '@apollo/server');
    },
    commands(project) {
      const pm = project.metadata?.packageManager || 'npm';
      return {
        start: { label: 'GraphQL start', command: [pm, 'run', 'start'], source: 'framework' },
        dev: { label: 'GraphQL dev', command: [pm, 'run', 'dev'], source: 'framework' }
      };
    }
  },

  // ==================== PYTHON FRAMEWORKS ====================
  {
    id: 'fastapi',
    name: 'FastAPI',
    icon: '⚡',
    description: 'Modern fast web framework for Python',
    languages: ['Python'],
    priority: 112,
     match(project) {
       return dependencyMatches(project, 'fastapi');
     },
    commands(project) {
      const pm = project.metadata?.packageManager || 'pip';
      const isUV = pm === 'uv';
      const base = isUV ? ['uv', 'run'] : pm === 'poetry' ? ['poetry', 'run'] : [];
      return {
        install: { label: 'FastAPI deps', command: isUV ? ['uv', 'sync'] : ['pip', 'install', '-r', 'requirements.txt'], source: 'framework' },
        run: { label: 'FastAPI dev', command: [...base, 'uvicorn', 'main:app', '--reload'], source: 'framework' },
        test: { label: 'FastAPI test', command: [...base, 'pytest'], source: 'framework' }
      };
    }
  },
  {
    id: 'flask',
    name: 'Flask',
    icon: '🌶️',
    description: 'Lightweight WSGI web framework',
    languages: ['Python'],
    priority: 111,
    match(project) {
      return dependencyMatches(project, 'flask') && !dependencyMatches(project, 'fastapi');
    },
    commands(project) {
      const pm = project.metadata?.packageManager || 'pip';
      const isUV = pm === 'uv';
      const base = isUV ? ['uv', 'run'] : pm === 'poetry' ? ['poetry', 'run'] : ['python'];
      return {
        install: { label: 'Flask deps', command: isUV ? ['uv', 'sync'] : ['pip', 'install', '-r', 'requirements.txt'], source: 'framework' },
        run: { label: 'Flask run', command: [...base, 'app.py'], source: 'framework' },
        test: { label: 'Flask test', command: [...base, 'pytest'], source: 'framework' }
      };
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
       return dependencyMatches(project, 'django');
     },
    commands(project) {
      const pm = project.metadata?.packageManager || 'pip';
      const isUV = pm === 'uv';
      const base = isUV ? ['uv', 'run'] : pm === 'poetry' ? ['poetry', 'run'] : ['python'];
      return {
        install: { label: 'Django deps', command: isUV ? ['uv', 'sync'] : ['pip', 'install', '-r', 'requirements.txt'], source: 'framework' },
        run: { label: 'Django runserver', command: [...base, 'manage.py', 'runserver'], source: 'framework' },
        test: { label: 'Django test', command: [...base, 'manage.py', 'test'], source: 'framework' },
        migrate: { label: 'Django migrate', command: [...base, 'manage.py', 'migrate'], source: 'framework' }
      };
    }
  },
  {
    id: 'aiohttp',
    name: 'AioHTTP',
    icon: '🔄',
    description: 'Async HTTP client/server for Python',
    languages: ['Python'],
    priority: 105,
    match(project) {
      return dependencyMatches(project, 'aiohttp');
    },
    commands() {
      return {
        test: { label: 'AioHTTP test', command: ['pytest'], source: 'framework' }
      };
    }
  },
  {
    id: 'sanic',
    name: 'Sanic',
    icon: '🚀',
    description: 'Async Python 3.7+ web server',
    languages: ['Python'],
    priority: 106,
    match(project) {
      return dependencyMatches(project, 'sanic');
    },
    commands() {
      return {
        run: { label: 'Sanic run', command: ['python', '-m', 'sanic', 'app.app'], source: 'framework' },
        test: { label: 'Sanic test', command: ['pytest'], source: 'framework' }
      };
    }
  },
  {
    id: 'tornado',
    name: 'Tornado',
    icon: '🌪️',
    description: 'Python web framework and async networking',
    languages: ['Python'],
    priority: 104,
    match(project) {
      return dependencyMatches(project, 'tornado');
    },
    commands() {
      return {
        run: { label: 'Tornado run', command: ['python', 'app.py'], source: 'framework' },
        test: { label: 'Tornado test', command: ['pytest'], source: 'framework' }
      };
    }
  },
  {
    id: 'pytest',
    name: 'Pytest',
    icon: '✅',
    description: 'Python testing framework',
    languages: ['Python'],
    priority: 50,
    match(project) {
      return dependencyMatches(project, 'pytest');
    },
    commands() {
      return {
        test: { label: 'Pytest run', command: ['pytest'], source: 'framework' },
        coverage: { label: 'Pytest coverage', command: ['pytest', '--cov'], source: 'framework' }
      };
    }
  },
  {
    id: 'sqlalchemy',
    name: 'SQLAlchemy',
    icon: '🗄️',
    description: 'Python SQL toolkit and ORM',
    languages: ['Python'],
    priority: 48,
    match(project) {
      return dependencyMatches(project, 'sqlalchemy') || dependencyMatches(project, 'flask-sqlalchemy');
    },
    commands() {
      return {
        test: { label: 'SQLAlchemy test', command: ['pytest'], source: 'framework' }
      };
    }
  },

  // ==================== RUST FRAMEWORKS ====================
  {
    id: 'actix',
    name: 'Actix Web',
    icon: '🎭',
    description: 'Powerful web framework for Rust',
    languages: ['Rust'],
    priority: 110,
    match(project) {
      return dependencyMatches(project, 'actix-web');
    },
    commands() {
      return {
        install: { label: 'Cargo Fetch', command: ['cargo', 'fetch'], source: 'framework' },
        run: { label: 'Actix Run', command: ['cargo', 'run'], source: 'framework' },
        test: { label: 'Actix Test', command: ['cargo', 'test'], source: 'framework' },
        build: { label: 'Actix Build', command: ['cargo', 'build'], source: 'framework' }
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
    id: 'axum',
    name: 'Axum',
    icon: '🗡️',
    description: 'Ergonomic and modular web framework for Rust',
    languages: ['Rust'],
    priority: 108,
    match(project) {
      return dependencyMatches(project, 'axum');
    },
    commands() {
      return {
        install: { label: 'Cargo Fetch', command: ['cargo', 'fetch'], source: 'framework' },
        run: { label: 'Axum Run', command: ['cargo', 'run'], source: 'framework' },
        test: { label: 'Axum Test', command: ['cargo', 'test'], source: 'framework' }
      };
    }
  },
  {
    id: 'warp',
    name: 'Warp',
    icon: '🌀',
    description: 'Super-easy, composable web framework for Rust',
    languages: ['Rust'],
    priority: 104,
    match(project) {
      return dependencyMatches(project, 'warp');
    },
    commands() {
      return {
        run: { label: 'Warp Run', command: ['cargo', 'run'], source: 'framework' },
        test: { label: 'Warp Test', command: ['cargo', 'test'], source: 'framework' }
      };
    }
  },
  {
    id: 'tokio',
    name: 'Tokio',
    icon: '⚡',
    description: 'Async runtime for Rust',
    languages: ['Rust'],
    priority: 50,
    match(project) {
      return dependencyMatches(project, 'tokio');
    },
    commands() {
      return {
        run: { label: 'Tokio Run', command: ['cargo', 'run'], source: 'framework' },
        test: { label: 'Tokio Test', command: ['cargo', 'test'], source: 'framework' }
      };
    }
  },

  // ==================== GO FRAMEWORKS ====================
  {
    id: 'gin',
    name: 'Gin',
    icon: '🍸',
    description: 'HTTP web framework for Go',
    languages: ['Go'],
    priority: 110,
    match(project) {
      return dependencyMatches(project, 'gin') || dependencyMatches(project, 'github.com/gin-gonic/gin');
    },
    commands() {
      return {
        install: { label: 'Go mod tidy', command: ['go', 'mod', 'tidy'], source: 'framework' },
        run: { label: 'Gin Run', command: ['go', 'run', 'main.go'], source: 'framework' },
        test: { label: 'Gin Test', command: ['go', 'test', './...'], source: 'framework' },
        build: { label: 'Gin Build', command: ['go', 'build', '-o', 'app'], source: 'framework' }
      };
    }
  },
  {
    id: 'echo',
    name: 'Echo',
    icon: '🔊',
    description: 'High performance, minimalist Go web framework',
    languages: ['Go'],
    priority: 108,
    match(project) {
      return dependencyMatches(project, 'echo') || dependencyMatches(project, 'github.com/labstack/echo/v4');
    },
    commands() {
      return {
        run: { label: 'Echo Run', command: ['go', 'run', 'main.go'], source: 'framework' },
        test: { label: 'Echo Test', command: ['go', 'test', './...'], source: 'framework' }
      };
    }
  },
  {
    id: 'fiber',
    name: 'Fiber',
    icon: '🔥',
    description: 'Express-inspired web framework for Go',
    languages: ['Go'],
    priority: 109,
    match(project) {
      return dependencyMatches(project, 'fiber') || dependencyMatches(project, 'github.com/gofiber/fiber/v2');
    },
    commands() {
      return {
        run: { label: 'Fiber Run', command: ['go', 'run', 'main.go'], source: 'framework' },
        test: { label: 'Fiber Test', command: ['go', 'test', './...'], source: 'framework' }
      };
    }
  },
  {
    id: 'chi',
    name: 'Chi',
    icon: '🤝',
    description: 'Lightweight, idiomatic router for Go',
    languages: ['Go'],
    priority: 105,
    match(project) {
      return dependencyMatches(project, 'chi') || dependencyMatches(project, 'github.com/go-chi/chi/v5');
    },
    commands() {
      return {
        run: { label: 'Chi Run', command: ['go', 'run', 'main.go'], source: 'framework' },
        test: { label: 'Chi Test', command: ['go', 'test', './...'], source: 'framework' }
      };
    }
  },

  // ==================== JAVA FRAMEWORKS ====================
  {
    id: 'spring-boot',
    name: 'Spring Boot',
    icon: '🍃',
    description: 'Spring Boot Java framework',
    languages: ['Java'],
    priority: 115,
     match(project) {
       return dependencyMatches(project, 'spring-boot') || dependencyMatches(project, 'org.springframework.boot');
     },
    commands(project) {
      if (hasProjectFile(project.path, 'pom.xml')) {
        return {
          install: { label: 'Maven Install', command: ['mvn', 'install'], source: 'framework' },
          run: { label: 'Spring Boot Run', command: ['mvn', 'spring-boot:run'], source: 'framework' },
          test: { label: 'Spring Boot Test', command: ['mvn', 'test'], source: 'framework' },
          build: { label: 'Spring Boot Build', command: ['mvn', 'package'], source: 'framework' }
        };
      }
      if (hasProjectFile(project.path, 'build.gradle') || hasProjectFile(project.path, 'build.gradle.kts')) {
        return {
          install: { label: 'Gradle Build', command: ['./gradlew', 'build'], source: 'framework' },
          run: { label: 'Spring Boot Run', command: ['./gradlew', 'bootRun'], source: 'framework' },
          test: { label: 'Spring Boot Test', command: ['./gradlew', 'test'], source: 'framework' }
        };
      }
      return {};
    }
  },
  {
    id: 'quarkus',
    name: 'Quarkus',
    icon: '⚡',
    description: 'Kubernetes Native Java stack',
    languages: ['Java'],
    priority: 108,
     match(project) {
       return dependencyMatches(project, 'quarkus') || dependencyMatches(project, 'io.quarkus');
     },
    commands() {
      return {
        run: { label: 'Quarkus Dev', command: ['mvn', 'quarkus:dev'], source: 'framework' },
        build: { label: 'Quarkus Build', command: ['mvn', 'package'], source: 'framework' },
        test: { label: 'Quarkus Test', command: ['mvn', 'test'], source: 'framework' }
      };
    }
  },
  {
    id: 'micronaut',
    name: 'Micronaut',
    icon: '🚀',
    description: 'Modern JVM-based framework',
    languages: ['Java'],
    priority: 106,
     match(project) {
       return dependencyMatches(project, 'micronaut') || dependencyMatches(project, 'io.micronaut');
     },
    commands() {
      return {
        run: { label: 'Micronaut Run', command: ['./mvnw', 'run'], source: 'framework' },
        test: { label: 'Micronaut Test', command: ['./mvnw', 'test'], source: 'framework' }
      };
    }
  },

  // ==================== PHP FRAMEWORKS ====================
  {
    id: 'laravel',
    name: 'Laravel',
    icon: '🧡',
    description: 'Laravel PHP Framework',
    languages: ['PHP'],
    priority: 110,
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
  },
  {
    id: 'symfony',
    name: 'Symfony',
    icon: '🎵',
    description: 'Symfony PHP Framework',
    languages: ['PHP'],
    priority: 108,
    match(project) {
      return hasProjectFile(project.path, 'bin/console') || dependencyMatches(project, 'symfony/symfony') || hasProjectFile(project.path, 'symfony.lock');
    },
    commands() {
      return {
        install: { label: 'Composer install', command: ['composer', 'install'], source: 'framework' },
        run: { label: 'Symfony Server', command: ['symfony', 'server:start'], source: 'framework' },
        test: { label: 'Symfony Test', command: ['php', 'bin/phpunit'], source: 'framework' }
      };
    }
  },
  {
    id: 'codeigniter',
    name: 'CodeIgniter',
    icon: '🔥',
    description: 'CodeIgniter PHP Framework',
    languages: ['PHP'],
    priority: 104,
    match(project) {
      return hasProjectFile(project.path, 'application/config/config.php') || dependencyMatches(project, 'codeigniter4/framework');
    },
    commands() {
      return {
        test: { label: 'CI Test', command: ['php', 'vendor/bin/phpunit'], source: 'framework' }
      };
    }
  },

  // ==================== RUBY FRAMEWORKS ====================
  {
    id: 'rails',
    name: 'Ruby on Rails',
    icon: '🛤️',
    description: 'Ruby on Rails framework',
    languages: ['Ruby'],
    priority: 110,
     match(project) {
       return dependencyMatches(project, 'rails') || hasProjectFile(project.path, 'bin/rails');
     },
    commands() {
      return {
        install: { label: 'Bundle install', command: ['bundle', 'install'], source: 'framework' },
        run: { label: 'Rails server', command: ['bin/rails', 'server'], source: 'framework' },
        test: { label: 'Rails test', command: ['bin/rails', 'test'], source: 'framework' },
        migrate: { label: 'Rails migrate', command: ['bin/rails', 'db:migrate'], source: 'framework' }
      };
    }
  },
  {
    id: 'sinatra',
    name: 'Sinatra',
    icon: '🎷',
    description: 'Sinatra DSL for quickly creating web applications',
    languages: ['Ruby'],
    priority: 105,
     match(project) {
       return dependencyMatches(project, 'sinatra');
     },
    commands() {
      return {
        install: { label: 'Bundle install', command: ['bundle', 'install'], source: 'framework' },
        run: { label: 'Rackup', command: ['rackup'], source: 'framework' }
      };
    }
  },

  // ==================== .NET FRAMEWORKS ====================
  {
    id: 'aspnet-core',
    name: 'ASP.NET Core',
    icon: '🔷',
    description: 'ASP.NET Core web framework',
    languages: ['.NET'],
    priority: 110,
     match(project) {
       return dependencyMatches(project, 'Microsoft.AspNetCore') || dependencyMatches(project, 'Microsoft.AspNetCore.App');
     },
    commands() {
      return {
        install: { label: 'Dotnet restore', command: ['dotnet', 'restore'], source: 'framework' },
        run: { label: 'Dotnet run', command: ['dotnet', 'run'], source: 'framework' },
        test: { label: 'Dotnet test', command: ['dotnet', 'test'], source: 'framework' },
        build: { label: 'Dotnet build', command: ['dotnet', 'build'], source: 'framework' }
      };
    }
  },
  {
    id: 'blazor',
    name: 'Blazor',
    icon: '🌀',
    description: 'Blazor interactive web UI with .NET',
    languages: ['.NET'],
    priority: 105,
     match(project) {
       return dependencyMatches(project, 'Microsoft.AspNetCore.Components.Web') || dependencyMatches(project, 'Blazor');
     },
    commands() {
      return {
        run: { label: 'Blazor Run', command: ['dotnet', 'run'], source: 'framework' },
        build: { label: 'Blazor Build', command: ['dotnet', 'build'], source: 'framework' }
      };
    }
  },

  // ==================== DATA SCIENCE / ML ====================
  {
    id: 'pandas',
    name: 'Pandas',
    icon: '🐼',
    description: 'Python data analysis library',
    languages: ['Python'],
    priority: 45,
    match(project) {
      return dependencyMatches(project, 'pandas');
    },
    commands() {
      return {
        test: { label: 'Pandas test', command: ['pytest'], source: 'framework' }
      };
    }
  },
  {
    id: 'pytorch',
    name: 'PyTorch',
    icon: '🔥',
    description: 'Machine learning framework for Python',
    languages: ['Python'],
    priority: 45,
    match(project) {
      return dependencyMatches(project, 'torch') || dependencyMatches(project, 'pytorch');
    },
    commands() {
      return {
        test: { label: 'PyTorch test', command: ['pytest'], source: 'framework' }
      };
    }
  },
  {
    id: 'tensorflow',
    name: 'TensorFlow',
    icon: '🧠',
    description: 'TensorFlow ML library',
    languages: ['Python'],
    priority: 45,
    match(project) {
      return dependencyMatches(project, 'tensorflow');
    },
    commands() {
      return {
        test: { label: 'TF test', command: ['pytest'], source: 'framework' }
      };
    }
  }
];
