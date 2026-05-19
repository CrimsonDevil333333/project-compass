import { EventEmitter } from 'events';
import path from 'path';
import { execa } from 'execa';
import { discoverProjects } from '../projectDetection.js';
import { loadConfig } from '../configPaths.js';

class Orchestrator extends EventEmitter {
  constructor() {
    super();
    this.projects = [];
    this.tasks = new Map();
    this.rootPath = process.cwd();
    this.config = {};
    this.scanning = false;
  }

  async scan(rootPath = this.rootPath, depth = 7) {
    this.scanning = true;
    this.emit('scan_start', { rootPath, depth });
    try {
      this.rootPath = rootPath;
      this.projects = await discoverProjects(rootPath, depth);
      this.emit('scan_complete', this.projects);
      return this.projects;
    } catch (error) {
      this.emit('scan_error', error.message);
      throw error;
    } finally {
      this.scanning = false;
    }
  }

  runCommand(projectId, commandId, customCmd = null) {
    let project = this.projects.find(p => p.id === projectId);
    
    // Support for system-wide commands (scaffolding, global tools)
    if (!project && projectId === 'system') {
      project = { id: 'system', name: 'System', path: this.rootPath };
    }
    
    if (!project) throw new Error('Project not found');

    const cmdSpec = customCmd || (commandId ? project.commands[commandId] : null);
    if (!cmdSpec) throw new Error('Command not found');


    let finalCommand = [...cmdSpec.command];
    
    // --- Smart Port Application ---
    const port = project.metadata?.port;
    if (port) {
      let cmdStr = finalCommand.join(' ').toLowerCase();
      const portStr = String(port);
      let portApplied = false;

      const patterns = [
        { match: 'uvicorn', flag: '--port' },
        { match: 'gunicorn', flag: '--bind' },
        { match: 'gunicorn', flag: '-b' },
        { match: 'hypercorn', flag: '-b' },
        { match: 'next dev', flag: '-p' },
        { match: 'vite', flag: '--port' },
        { match: 'flask', flag: '--port' },
        { match: 'webpack', flag: '--port' },
        { match: 'serve', flag: '-l' },
        { match: 'django', flag: '--port' },
        { match: 'react-scripts start', flag: '--port' }
      ];

      for (const { match, flag } of patterns) {
        if (cmdStr.includes(match.toLowerCase())) {
          const flagIdx = finalCommand.indexOf(flag);
          if (flagIdx !== -1 && flagIdx + 1 < finalCommand.length) {
            finalCommand[flagIdx + 1] = portStr;
            portApplied = true;
          } else if (flagIdx === -1) {
            finalCommand.push(flag, portStr);
            portApplied = true;
          }
          break;
        }
      }
      
      if (!portApplied && (cmdStr.includes('runserver') || cmdStr.includes('manage.py'))) {
        if (!finalCommand.some(t => /^\d{4,5}$/.test(t))) {
          finalCommand.push(portStr);
          portApplied = true;
        }
      }
    }

    const [binary, ...args] = finalCommand;
    const taskId = `${projectId}::${commandId || 'custom'}::${Date.now()}`;

    
    const process = execa(binary, args, {
      cwd: project.path,
      all: true,
      env: { FORCE_COLOR: 'true' }
    });

    // Prevent unhandled promise rejections if command fails
    process.catch((err) => {
      console.error(`Task ${taskId} failed: ${err.message}`);
    });


    const task = {
      id: taskId,
      projectId,
      commandId,
      name: cmdSpec.label,
      label: cmdSpec.label,
      status: 'running',
      startTime: Date.now(),
      output: '',
      logs: [],
      process
    };

    this.tasks.set(taskId, task);
    this.emit('task_start', task);

    process.all.on('data', (data) => {
      const chunk = data.toString();
      task.output += chunk;
      
      const newLines = chunk.split(/\r?\n/).filter(l => l.length > 0);
      task.logs.push(...newLines);
      if (task.logs.length > 1000) task.logs = task.logs.slice(-1000);

      this.emit('task_output', { taskId, chunk, logs: task.logs });
    });

    process.on('close', (code) => {
      task.status = code === 0 ? 'success' : 'failed';
      task.endTime = Date.now();
      this.emit('task_end', task);
    });

    process.on('error', (err) => {
      task.status = 'failed';
      task.error = err.message;
      const errorMsg = `✗ Execution Error: ${err.message}`;
      task.logs.push(errorMsg);
      this.emit('task_error', { taskId, error: err.message });
      this.emit('task_end', task);
    });


    return taskId;
  }

  killTask(taskId) {
    const task = this.tasks.get(taskId);
    if (task && task.process) {
      task.process.kill('SIGINT');
      task.status = 'killed';
      this.emit('task_end', task);
      return true;
    }
    return false;
  }

  // --- Advanced Workspace Features ---

  getGroups() {
    const groups = new Set(['All']);
    this.projects.forEach(p => {
      if (p.metadata?.group) groups.add(p.metadata.group);
    });
    return Array.from(groups);
  }

  setProjectGroup(projectId, group) {
    const project = this.getProject(projectId);
    if (project) {
      project.metadata = { ...project.metadata, group };
      // Note: Persisting this would require updating config.json
      this.emit('project_updated', project);
    }
  }

  runOmniCommand(commandId, filter = null) {
    const results = [];
    this.projects.forEach(project => {
      if (!filter || filter(project)) {
        if (project.commands[commandId]) {
          const taskId = this.runCommand(project.id, commandId);
          results.push({ projectId: project.id, taskId });
        }
      }
    });
    return results;
  }

  getTask(taskId) {
    return this.tasks.get(taskId);
  }


  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  async scaffold(template, name, targetParentPath) {
    const targetPath = path.resolve(targetParentPath || this.rootPath, name);
    const scaffoldCmds = {
      'nextjs': ['npx', 'create-next-app@latest', targetPath, '--typescript', '--tailwind', '--eslint'],
      'nextjs-bun': ['bun', 'create', 'next-app', targetPath],
      'react-vite': ['pnpm', 'create', 'vite', targetPath, '--template', 'react'],
      'react-vite-npm': ['npm', 'create', 'vite@latest', targetPath, '--', '--template', 'react'],
      'vue-vite': ['npm', 'create', 'vite@latest', targetPath, '--', '--template', 'vue'],
      'rust': ['cargo', 'new', targetPath],
      'django': ['django-admin', 'startproject', name, targetPath],
      'python-basic': ['mkdir', '-p', targetPath],
      'go': ['mkdir', '-p', targetPath]
    };

    const cmd = scaffoldCmds[template];
    if (!cmd) throw new Error(`Unknown template: ${template}`);

    this.emit('scaffold_start', { template, name, targetPath });

    try {
      if (template === 'go') {
        await execa('mkdir', ['-p', targetPath]);
        await execa('go', ['mod', 'init', name], { cwd: targetPath });
      } else {
        await execa(cmd[0], cmd.slice(1));
      }
      
      // Refresh project list after scaffolding
      await this.scan();
      this.emit('scaffold_complete', { template, name, targetPath });
      return { success: true, path: targetPath };
    } catch (error) {
      this.emit('scaffold_error', { template, name, error: error.message });
      throw error;
    }
  }

  getProject(projectId) {
    return this.projects.find(p => p.id === projectId);
  }

}

export const orchestrator = new Orchestrator();
