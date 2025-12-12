const esbuild = require("esbuild");
const path = require("path");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

/**
 * @type {import('esbuild').Plugin}
 */
const pathAliasPlugin = {
    name: "path-alias",
    setup(build) {
        const fs = require("fs");
        const pathAliases = {
            "@language/": path.resolve(__dirname, "../features/language/src/"),
            "@completion/": path.resolve(__dirname, "../features/completion/src/"),
            "@context/": path.resolve(__dirname, "../features/context/src/"),
            "@storage/": path.resolve(__dirname, "../features/storage/src/"),
            "@platform/": path.resolve(__dirname, "../shared/src/platform/"),
            "@network/": path.resolve(__dirname, "../shared/src/network/"),
            "@events/": path.resolve(__dirname, "../features/events/src/"),
            "@inline/language": path.resolve(__dirname, "../features/language/src/"),
            "@inline/completion": path.resolve(__dirname, "../features/completion/src/"),
            "@inline/context": path.resolve(__dirname, "../features/context/src/"),
            "@inline/storage": path.resolve(__dirname, "../features/storage/src/"),
            "@inline/intelligence": path.resolve(__dirname, "../features/intelligence/src/"),
            "@inline/events": path.resolve(__dirname, "../features/events/src/"),
            "@inline/ui": path.resolve(__dirname, "../features/ui/src/"),
        };

        // Handle both shorthand and full package names
        build.onResolve({ filter: /^@(language|completion|context|storage|platform|network|inline|events)/ }, (args) => {
            for (const [alias, aliasPath] of Object.entries(pathAliases)) {
                if (args.path === alias || args.path.startsWith(alias + "/")) {
                    const relativePath = args.path === alias ? "" : args.path.substring(alias.length + 1);
                    let resolvedPath = relativePath ? path.join(aliasPath, relativePath) : aliasPath;

                    // Try adding .ts extension if file doesn't exist
                    if (!fs.existsSync(resolvedPath) || fs.statSync(resolvedPath).isDirectory()) {
                        // Check for index files first
                        if (fs.existsSync(path.join(resolvedPath, "index.ts"))) {
                            resolvedPath = path.join(resolvedPath, "index.ts");
                        } else if (fs.existsSync(path.join(resolvedPath, "index.tsx"))) {
                            resolvedPath = path.join(resolvedPath, "index.tsx");
                        } else if (fs.existsSync(resolvedPath + ".ts")) {
                            resolvedPath += ".ts";
                        } else if (fs.existsSync(resolvedPath + ".tsx")) {
                            resolvedPath += ".tsx";
                        }
                    }

                    return { path: resolvedPath };
                }
            }
        });
    },
};

/**
 * @type {import('esbuild').Plugin}
 */
const nativeNodePlugin = {
    name: "native-node",
    setup(build) {
        // Mark .node files as external (don't try to bundle them)
        build.onResolve({ filter: /\.node$/ }, (args) => {
            return { path: args.path, external: true };
        });
    },
};

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
    name: "esbuild-problem-matcher",
    setup(build) {
        build.onStart(() => {
            console.log("[watch] build started");
        });
        build.onEnd((result) => {
            result.errors.forEach(({ text, location }) => {
                console.error(`✘ [ERROR] ${text}`);
                console.error(`    ${location.file}:${location.line}:${location.column}`);
            });
            console.log("[watch] build finished");
        });
    },
};

async function main() {
    const ctx = await esbuild.context({
        entryPoints: ["src/activation/extension.ts"],
        bundle: true,
        format: "cjs",
        minify: production,
        sourcemap: !production,
        sourcesContent: false,
        platform: "node",
        outfile: "dist/extension.js",
        external: [
            "vscode",
            "@inline/native-rust",
            "@inline/native-cpp",
            "@inline/accelerator",
            "@inline/analyzer",
            "node-llama-cpp",
            "web-tree-sitter",
            "tar"
        ],
        logLevel: "silent",
        plugins: [
            pathAliasPlugin,
            nativeNodePlugin,
            /* add to the end of plugins array */
            esbuildProblemMatcherPlugin,
        ],
        tsconfig: "../../.config/build/tsconfig.json",
    });

    if (watch) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
