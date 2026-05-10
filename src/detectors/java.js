import fs from 'fs';
import path from 'path';
import { checkBinary, hasProjectFile } from './utils.js';

function parsePomXml(content) {
  const metadata = {
    groupId: '',
    artifactId: '',
    version: '',
    name: '',
    description: '',
    dependencies: []
  };
  
  const groupIdMatch = content.match(/<groupId>([^<]+)<\/groupId>/);
  if (groupIdMatch) metadata.groupId = groupIdMatch[1];
  
  const artifactIdMatch = content.match(/<artifactId>([^<]+)<\/artifactId>/);
  if (artifactIdMatch) metadata.artifactId = artifactIdMatch[1];
  
  const versionMatch = content.match(/<version>([^<]+)<\/version>/);
  if (versionMatch) metadata.version = versionMatch[1];
  
  const nameMatch = content.match(/<name>([^<]+)<\/name>/);
  if (nameMatch) metadata.name = nameMatch[1];
  
  const descMatch = content.match(/<description>([^<]+)<\/description>/);
  if (descMatch) metadata.description = descMatch[1];
  
  const depMatches = content.matchAll(/<dependency>[\s\S]*?<artifactId>([^<]+)<\/artifactId>[\s\S]*?<\/dependency>/g);
  for (const match of depMatches) {
    if (match[1]) metadata.dependencies.push(match[1]);
  }
  
  return metadata;
}

function parseGradleBuild(content) {
  const metadata = {
    name: '',
    version: '',
    description: '',
    dependencies: []
  };
  
  const nameMatch = content.match(/rootProject\.name\s*=\s*['"]([^'"]+)['"]/);
  if (nameMatch) metadata.name = nameMatch[1];
  
  const versionMatch = content.match(/version\s*=\s*['"]([^'"]+)['"]/);
  if (versionMatch) metadata.version = versionMatch[1];
  
  const depMatches = content.matchAll(/implementation\s+['"]([^'"]+)['"]/g);
  for (const match of depMatches) {
    if (match[1]) metadata.dependencies.push(match[1].split(':')[1] || match[1]);
  }
  
  return metadata;
}

function detectJavaFrameworks(deps) {
  const frameworks = [];
  const depStr = deps.join(' ').toLowerCase();
  
  if (depStr.includes('spring-boot') || depStr.includes('springframework')) frameworks.push({ name: 'Spring Boot', icon: '🍃' });
  if (depStr.includes('quarkus')) frameworks.push({ name: 'Quarkus', icon: '⚡' });
  if (depStr.includes('micronaut')) frameworks.push({ name: 'Micronaut', icon: '🚀' });
  if (depStr.includes('play')) frameworks.push({ name: 'Play Framework', icon: '🎭' });
  if (depStr.includes('vertx')) frameworks.push({ name: 'Vert.x', icon: '🔋' });
  if (depStr.includes('dropwizard')) frameworks.push({ name: 'Dropwizard', icon: '📊' });
  if (depStr.includes(('hibernate'))) frameworks.push({ name: 'Hibernate', icon: '🗄️' });
  if (depStr.includes('junit')) frameworks.push({ name: 'JUnit', icon: '✅' });
  if (depStr.includes('lombok')) frameworks.push({ name: 'Lombok', icon: '🔧' });
  
  return frameworks;
}

export default {
  type: 'java',
  label: 'Java',
  icon: '☕',
  priority: 80,
  files: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
  binaries: ['java', 'javac'],
  async build(projectPath, manifest) {
    const missingBinaries = this.binaries.filter(b => !checkBinary(b));
    const hasMvnw = hasProjectFile(projectPath, 'mvnw');
    const hasGradlew = hasProjectFile(projectPath, 'gradlew');
    const isMaven = hasProjectFile(projectPath, 'pom.xml');
    const isGradle = hasProjectFile(projectPath, 'build.gradle') || hasProjectFile(projectPath, 'build.gradle.kts');
    
    let metadata = { name: '', version: '', description: '', dependencies: [] };
    let frameworks = [];
    let buildTool = isGradle ? 'gradle' : 'maven';
    
    if (isMaven) {
      const pomPath = path.join(projectPath, 'pom.xml');
      if (fs.existsSync(pomPath)) {
        const content = fs.readFileSync(pomPath, 'utf-8');
        metadata = parsePomXml(content);
        frameworks = detectJavaFrameworks(metadata.dependencies);
      }
    } else if (isGradle) {
      const gradleFile = hasProjectFile(projectPath, 'build.gradle.kts') ? 'build.gradle.kts' : 'build.gradle';
      const gradlePath = path.join(projectPath, gradleFile);
      if (fs.existsSync(gradlePath)) {
        const content = fs.readFileSync(gradlePath, 'utf-8');
        metadata = parseGradleBuild(content);
        frameworks = detectJavaFrameworks(metadata.dependencies);
      }
    }
    
    const commands = {};
    if (isGradle) {
      const gradleCmd = hasGradlew ? ['./gradlew'] : ['gradle'];
      commands.install = { label: 'Gradle dependencies', command: [...gradleCmd, 'dependencies'], source: 'builtin' };
      commands.build = { label: 'Gradle build', command: [...gradleCmd, 'build'], source: 'builtin' };
      commands.test = { label: 'Gradle test', command: [...gradleCmd, 'test'], source: 'builtin' };
      commands.run = { label: 'Gradle run', command: [...gradleCmd, 'run'], source: 'builtin' };
      commands.clean = { label: 'Gradle clean', command: [...gradleCmd, 'clean'], source: 'builtin' };
    } else {
      const mvnCmd = hasMvnw ? ['./mvnw'] : ['mvn'];
      commands.install = { label: 'Maven install', command: [...mvnCmd, 'install'], source: 'builtin' };
      commands.build = { label: 'Maven package', command: [...mvnCmd, 'package'], source: 'builtin' };
      commands.test = { label: 'Maven test', command: [...mvnCmd, 'test'], source: 'builtin' };
      commands.run = { label: 'Maven spring-boot:run', command: [...mvnCmd, 'spring-boot:run'], source: 'builtin' };
      commands.clean = { label: 'Maven clean', command: [...mvnCmd, 'clean'], source: 'builtin' };
    }

    const setupHints = [];
    if (missingBinaries.length > 0) {
      setupHints.push('Install JDK 17+ from https://adoptium.net/');
    }
    if (isMaven) {
      setupHints.push('Run ' + (hasMvnw ? './mvnw install' : 'mvn install') + ' to build');
    } else if (isGradle) {
      setupHints.push('Run ' + (hasGradlew ? './gradlew build' : 'gradle build') + ' to build');
    }

    return {
      id: `${projectPath}::java`,
      path: projectPath,
      name: metadata.name || metadata.artifactId || path.basename(projectPath),
      type: 'Java',
      icon: '☕',
      priority: this.priority,
      commands,
      metadata: {
        ...metadata,
        packageManager: buildTool
      },
      manifest: path.basename(manifest),
      description: metadata.description || frameworks.map(f => f.name).join(', '),
      missingBinaries,
      frameworks,
      extra: {
        setupHints,
        buildTool
      }
    };
  }
};
