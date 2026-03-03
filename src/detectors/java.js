import path from 'path';
import { checkBinary, hasProjectFile } from './utils.js';

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
    const commands = {};
    if (hasGradlew) {
      commands.install = { label: 'Gradle resolve', command: ['./gradlew', 'dependencies'] };
      commands.build = { label: 'Gradle build', command: ['./gradlew', 'build'] };
      commands.test = { label: 'Gradle test', command: ['./gradlew', 'test'] };
    } else if (hasMvnw) {
      commands.install = { label: 'Maven install', command: ['./mvnw', 'install'] };
      commands.build = { label: 'Maven package', command: ['./mvnw', 'package'] };
      commands.test = { label: 'Maven test', command: ['./mvnw', 'test'] };
    } else {
      commands.build = { label: 'Maven package', command: ['mvn', 'package'] };
      commands.test = { label: 'Maven test', command: ['mvn', 'test'] };
    }

    return {
      id: `${projectPath}::java`,
      path: projectPath,
      name: path.basename(projectPath),
      type: 'Java',
      icon: '☕',
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
};
