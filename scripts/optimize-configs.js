const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const packagesDir = path.join(rootDir, 'packages');
const featuresDir = path.join(packagesDir, 'features');

// Helper to find all packages
function getPackages() {
    const pkgs = [];

    // Direct packages
    if (fs.existsSync(packagesDir)) {
        fs.readdirSync(packagesDir).forEach(dir => {
            if (dir === 'features') return;
            const pkgPath = path.join(packagesDir, dir);
            if (fs.existsSync(path.join(pkgPath, 'package.json'))) {
                pkgs.push({
                    name: dir,
                    path: pkgPath,
                    relPath: `packages/${dir}`,
                    isFeature: false
                });
            }
        });
    }

    // Feature packages
    if (fs.existsSync(featuresDir)) {
        fs.readdirSync(featuresDir).forEach(dir => {
            const pkgPath = path.join(featuresDir, dir);
            if (fs.existsSync(path.join(pkgPath, 'package.json'))) {
                pkgs.push({
                    name: dir,
                    path: pkgPath,
                    relPath: `packages/features/${dir}`,
                    isFeature: true
                });
            }
        });
    }
    return pkgs;
}

const packages = getPackages();

// 1. Update each package's tsconfig.json
packages.forEach(pkg => {
    const pkgJsonPath = path.join(pkg.path, 'package.json');
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    const tsconfigPath = path.join(pkg.path, 'tsconfig.json');

    // Find dependencies in workspace
    const references = [];
    const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };

    Object.keys(deps).forEach(dep => {
        if (dep.startsWith('@inline/')) {
            const depName = dep.replace('@inline/', '');
            // Find the package object
            const targetPkg = packages.find(p => {
                // Heuristic: package name usually matches directory or export name
                // e.g. @inline/core -> packages/core
                if (dep === '@inline/core' && p.relPath === 'packages/core') return true;
                if (dep === '@inline/shared' && p.relPath === 'packages/shared') return true;
                if (dep === `@inline/${p.name}`) return true;
                return false;
            });

            if (targetPkg) {
                // Calculate relative path for reference
                // From packages/extension to packages/core: ../core
                // From packages/features/language to packages/core: ../../core
                const relRef = path.relative(pkg.path, targetPkg.path);
                references.push({ path: relRef });
            }
        }
    });

    // Base config
    const tsConfig = {
        extends: path.relative(pkg.path, path.join(rootDir, 'tsconfig.base.json')),
        compilerOptions: {
            outDir: "dist",
            rootDir: "src",
            composite: true
        },
        include: ["src"],
        exclude: ["node_modules", "dist", "out", "test"], // Exclude test from build to avoid cycles if tests depend on other things
        references: references.length > 0 ? references : undefined
    };

    // Special case for 'extension' which has tests and special output requirements previously
    if (pkg.name === 'extension') {
        // Extension includes tests in compilation typically, or we separate them.
        // For now, include everything.
        tsConfig.include = ["src", "test"];
        // Remove exclude test
        tsConfig.exclude = ["node_modules", "dist", "out"];
        // Set rootDir to . so it can include both src and test
        tsConfig.compilerOptions.rootDir = ".";
    }

    // Special handling for natives (no src/ usually, or rust/cpp)
    if (pkg.name === 'accelerator') {
        tsConfig.include = ["index.d.ts"];
        tsConfig.compilerOptions.rootDir = ".";
    }
    if (pkg.name === 'analyzer') {
        tsConfig.include = ["index.ts"];
        tsConfig.compilerOptions.rootDir = ".";
    }

    // Special handling for webview (React)
    if (pkg.name === 'webview') {
        tsConfig.compilerOptions.jsx = "react-jsx";
        tsConfig.compilerOptions.lib = ["DOM", "DOM.Iterable", "ES2020"];
        tsConfig.compilerOptions.allowImportingTsExtensions = true;

        // Webview is usually bundled by Vite/Webpack, so we don't need tsc to emit
        tsConfig.compilerOptions.noEmit = true;
    }

    fs.writeFileSync(tsconfigPath, JSON.stringify(tsConfig, null, 4));
    console.log(`Updated ${tsconfigPath}`);
});

// 2. Create root tsconfig.json (Solution)
const rootTsConfig = {
    files: [],
    include: [],
    references: packages
        .filter(p => fs.existsSync(path.join(p.path, 'tsconfig.json')))
        .map(p => ({ path: p.relPath }))
};

fs.writeFileSync(path.join(rootDir, 'tsconfig.json'), JSON.stringify(rootTsConfig, null, 4));
console.log('Updated root tsconfig.json');

