import fs from 'fs';
import path from 'path';
import { checkBinary } from './utils.js';

function parseCsProj(content) {
  const metadata = {
    name: '',
    targetFramework: '',
    dependencies: []
  };
  
  const nameMatch = content.match(/<AssemblyName>([^<]+)<\/AssemblyName>/);
  if (nameMatch) metadata.name = nameMatch[1];
  
  const frameworkMatch = content.match(/<TargetFramework>([^<]+)<\/TargetFramework>/);
  if (frameworkMatch) metadata.targetFramework = frameworkMatch[1];
  
  const packageMatches = content.matchAll(/<PackageReference\s+Include="([^"]+)"[^/]*\/?>/g);
  for (const match of packageMatches) {
    if (match[1]) metadata.dependencies.push(match[1]);
  }
  
  return metadata;
}

function detectDotnetFrameworks(deps) {
  const frameworks = [];
  const depStr = deps.join(' ').toLowerCase();
  
  if (depStr.includes('microsoft.aspnetcore') || depStr.includes('microsoft.aspnetcore.app')) frameworks.push({ name: 'ASP.NET Core', icon: '🔷' });
  if (depStr.includes('blazor')) frameworks.push({ name: 'Blazor', icon: '🌀' });
  if (depStr.includes('entityframework') || depStr.includes('efcore')) frameworks.push({ name: 'Entity Framework', icon: '🗄️' });
  if (depStr.includes('newtonsoft.json')) frameworks.push({ name: 'Newtonsoft.Json', icon: '📄' });
  if (depStr.includes('xunit')) frameworks.push({ name: 'xUnit', icon: '✅' });
  if (depStr.includes('nunit')) frameworks.push({ name: 'NUnit', icon: '🔬' });
  if (depStr.includes('mstest')) frameworks.push({ name: 'MSTest', icon: '🧪' });
  if (depStr.includes('automapper')) frameworks.push({ name: 'AutoMapper', icon: '🔄' });
  if (depStr.includes('mass transit') || depStr.includes('masstransit')) frameworks.push({ name: 'MassTransit', icon: '🚌' });
  if (depStr.includes('grpc')) frameworks.push({ name: 'gRPC', icon: '🔌' });
  
  return frameworks;
}

function findCsProj(projectPath) {
  try {
    const files = fs.readdirSync(projectPath);
    const csproj = files.find(f => f.endsWith('.csproj') || f.endsWith('.fsproj'));
    if (csproj) return path.join(projectPath, csproj);
  } catch { /* ignore */ }
  return null;
}

export default {
  type: 'dotnet',
  label: '.NET',
  icon: '🎯',
  priority: 65,
  files: ['*.csproj', '*.sln', '*.fsproj'],
  binaries: ['dotnet'],
  async build(projectPath, manifest) {
    const missingBinaries = this.binaries.filter(b => !checkBinary(b));
    let metadata = { name: '', targetFramework: '', dependencies: [] };
    let frameworks = [];
    
    const csprojPath = findCsProj(projectPath);
    if (csprojPath && fs.existsSync(csprojPath)) {
      const content = fs.readFileSync(csprojPath, 'utf-8');
      metadata = parseCsProj(content);
      frameworks = detectDotnetFrameworks(metadata.dependencies);
    }
    
    const commands = {
      install: { label: 'Dotnet restore', command: ['dotnet', 'restore'], source: 'builtin' },
      build: { label: 'Dotnet build', command: ['dotnet', 'build'], source: 'builtin' },
      test: { label: 'Dotnet test', command: ['dotnet', 'test'], source: 'builtin' },
      run: { label: 'Dotnet run', command: ['dotnet', 'run'], source: 'builtin' },
      clean: { label: 'Dotnet clean', command: ['dotnet', 'clean'], source: 'builtin' },
      publish: { label: 'Dotnet publish', command: ['dotnet', 'publish'], source: 'builtin' }
    };
    
    const hasSln = fs.readdirSync(projectPath).some(f => f.endsWith('.sln'));
    if (hasSln) {
      commands['restore-sl'] = { label: 'Restore Solution', command: ['dotnet', 'restore'], source: 'builtin' };
    }

    const setupHints = [];
    if (missingBinaries.length > 0) {
      setupHints.push('Install .NET SDK: https://dot.net/');
    }
    if (metadata.targetFramework) {
      setupHints.push(`Target Framework: ${metadata.targetFramework}`);
    }
    if (metadata.dependencies.length > 0) {
      setupHints.push('Run dotnet restore to fetch dependencies');
    }

    return {
      id: `${projectPath}::dotnet`,
      path: projectPath,
      name: metadata.name || path.basename(projectPath),
      type: '.NET',
      icon: '🎯',
      priority: this.priority,
      commands,
      metadata: {
        ...metadata,
        packageManager: 'dotnet'
      },
      manifest: path.basename(manifest),
      description: frameworks.map(f => f.name).join(', ') || metadata.targetFramework,
      missingBinaries,
      frameworks,
      extra: {
        setupHints,
        targetFramework: metadata.targetFramework
      }
    };
  }
};