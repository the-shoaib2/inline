#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that moved and their new locations
const fileMoves = {
    'core/completion-provider.ts': 'core/providers/completion-provider.ts',
    'core/code-action-provider.ts': 'core/providers/code-action-provider.ts',
    'core/hover-provider.ts': 'core/providers/hover-provider.ts',
    'ui/ai-commands-provider.ts': 'core/providers/ai-commands-provider.ts',

    'core/context-engine.ts': 'core/context/context-engine.ts',
    'core/smart-filter.ts': 'core/context/smart-filter.ts',
    'utils/context-analyzer.ts': 'core/context/context-analyzer.ts',
    'utils/context-selector.ts': 'core/context/context-selector.ts',

    'core/cache-manager.ts': 'core/cache/cache-manager.ts',
    'core/kv-cache-manager.ts': 'core/cache/kv-cache-manager.ts',

    'core/llama-inference.ts': 'inference/llama-inference.ts',
    'core/model-manager.ts': 'inference/model-manager.ts',
    'utils/gpu-detector.ts': 'inference/gpu-detector.ts',

    'core/doc-generator.ts': 'features/code-generation/doc-generator.ts',
    'core/test-generator.ts': 'features/code-generation/test-generator.ts',
    'core/pr-generator.ts': 'features/code-generation/pr-generator.ts',

    'core/error-explainer.ts': 'features/code-analysis/error-explainer.ts',
    'core/security-scanner.ts': 'features/code-analysis/security-scanner.ts',
    'core/refactoring-engine.ts': 'features/code-analysis/refactoring-engine.ts',

    'core/terminal-assistant.ts': 'features/terminal/terminal-assistant.ts',

    'utils/ast-parser.ts': 'analysis/ast-parser.ts',
    'utils/semantic-analyzer.ts': 'analysis/semantic-analyzer.ts',
    'utils/duplication-detector.ts': 'analysis/duplication-detector.ts',

    'utils/network-detector.ts': 'network/network-detector.ts',
    'utils/network-config.ts': 'network/network-config.ts',

    'utils/logger.ts': 'system/logger.ts',
    'utils/config-manager.ts': 'system/config-manager.ts',
    'utils/error-handler.ts': 'system/error-handler.ts',
    'utils/telemetry-manager.ts': 'system/telemetry-manager.ts',
    'utils/resource-manager.ts': 'system/resource-manager.ts',
    'utils/performance-monitor.ts': 'system/performance-monitor.ts',
    'utils/performance-tuner.ts': 'system/performance-tuner.ts',
    'utils/process-info-display.ts': 'system/process-info-display.ts',
    'utils/quantization-manager.ts': 'system/quantization-manager.ts',
};

function getRelativePath(from, to) {
    const fromDir = path.dirname(from);
    const rel = path.relative(fromDir, to);
    return './' + rel.replace(/\\/g, '/').replace(/\.ts$/, '');
}

function updateImportsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    const currentFile = path.relative('src', filePath).replace(/\\/g, '/');

    // Match import/export statements
    const importRegex = /(import|export)([^'"]*from\s+['"])([^'"]+)(['"])/g;

    content = content.replace(importRegex, (match, keyword, middle, importPath, quote) => {
        // Skip non-relative imports
        if (!importPath.startsWith('./') && !importPath.startsWith('../')) {
            return match;
        }

        // Resolve the absolute path being imported
        const currentDir = path.dirname(path.join('src', currentFile));
        const resolvedImport = path.resolve(currentDir, importPath + '.ts');
        const relativeImport = path.relative('src', resolvedImport).replace(/\\/g, '/');

        // Check if this file moved
        if (fileMoves[relativeImport]) {
            const newLocation = fileMoves[relativeImport];
            const newRelativePath = getRelativePath(currentFile, newLocation);
            modified = true;
            return `${keyword}${middle}${newRelativePath}${quote}`;
        }

        return match;
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Updated: ${filePath}`);
        return true;
    }
    return false;
}

function walkDirectory(dir, callback) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (!file.startsWith('.') && file !== 'node_modules') {
                walkDirectory(filePath, callback);
            }
        } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
            callback(filePath);
        }
    }
}

// Update all TypeScript files
console.log('Fixing import paths...\n');
let updatedCount = 0;

walkDirectory('./src', (filePath) => {
    if (updateImportsInFile(filePath)) {
        updatedCount++;
    }
});

// Also update test files
if (fs.existsSync('./test')) {
    walkDirectory('./test', (filePath) => {
        if (updateImportsInFile(filePath)) {
            updatedCount++;
        }
    });
}

console.log(`\n✓ Fixed ${updatedCount} files`);
