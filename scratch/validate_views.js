import React from 'react';
import { render } from 'ink';

// Mock dependencies/globals to avoid rendering crashes
globalThis.setTimeout = () => {};

import PackageRegistry from '../src/components/PackageRegistry.js';
import ProjectArchitect from '../src/components/ProjectArchitect.js';
import AIHorizon from '../src/components/AIHorizon.js';

console.log("🚀 Importing components...");
console.log("✅ PackageRegistry imported successfully:", typeof PackageRegistry);
console.log("✅ ProjectArchitect imported successfully:", typeof ProjectArchitect);
console.log("✅ AIHorizon imported successfully:", typeof AIHorizon);

console.log("🎉 Components loaded without syntax or import errors!");
process.exit(0);
