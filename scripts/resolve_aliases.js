const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '../out');
const srcRoot = path.resolve(outDir, 'packages/extension/src');

// TSConfig paths mapping logic (simplified)
const aliases = {
    '@language': 'language',
    '@intelligence': 'intelligence',
    '@completion': 'completion',
    '@workspace': 'workspace',
    '@platform': 'platform',
    '@storage': 'storage',
    '@ui': 'ui',
    '@network': 'network',
    '@context': 'context',
    '@shared': 'shared',
    '@events': 'events',
    '@activation': 'activation',
    '@security': 'security',
    '@inline/native': '../native/index.d.ts', // Special case? No, native module logic handled by node mapping usually?
    // Native modules are workspace packages, usually symlinked in node_modules?
    // If code uses @inline/native, it expects node resolution?
    // But @inline/native in tsconfig points to index.d.ts.
    // In JS, it should probably be 'require("@inline/native")' and let Node find it in node_modules.
};

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function resolveAliases(filePath) {
    if (!filePath.endsWith('.js')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Replace require("@alias/path")
    // Replace require("@alias/path") or require('@alias/path')
    content = content.replace(/require\((["'])(@[^"'/]+)([^"']*)\1\)/g, (match, quote, alias, restPath) => {
        if (aliases[alias]) {
            // Target path in out/src/
            // e.g. @intelligence/engines -> out/src/intelligence/engines

            // If alias is @inline/native, ignore (let node resolve from node_modules)
            if (alias.startsWith('@inline')) return match;

            const targetFolder = aliases[alias];
            const targetAbsPath = path.join(srcRoot, targetFolder, restPath);

            // Calculate relative path from current filePath directory to targetAbsPath
            let relPath = path.relative(path.dirname(filePath), targetAbsPath);

            // Ensure format ./ or ../
            if (!relPath.startsWith('.')) {
                relPath = './' + relPath;
            }

            // Remove .ts extension if present in restPath (unlikely in require)
            // But if restPath was empty? @alias -> path to index?

            return `require("${relPath}")`;
        }
        return match;
    });

    if (content !== originalContent) {
        console.log(`Resolved aliases in ${filePath}`);
        fs.writeFileSync(filePath, content);
    }
}

console.log(`Resolving aliases in output directory: ${outDir}`);
walkDir(outDir, resolveAliases);
