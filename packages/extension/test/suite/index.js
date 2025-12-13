"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const path = __importStar(require("path"));
const mocha_1 = __importDefault(require("mocha"));
const glob_1 = require("glob");
const moduleAlias = __importStar(require("module-alias"));
// Register module aliases for runtime test execution
const outDir = path.resolve(__dirname, '../../../../');
moduleAlias.addAliases({
    '@inline/core': path.join(outDir, 'packages/core/src'),
    '@inline/shared': path.join(outDir, 'packages/shared/src'),
    '@inline/completion': path.join(outDir, 'packages/features/completion/src'),
    '@inline/intelligence': path.join(outDir, 'packages/features/intelligence/src'),
    '@inline/context': path.join(outDir, 'packages/features/context/src'),
    '@inline/language': path.join(outDir, 'packages/features/language/src'),
    '@inline/events': path.join(outDir, 'packages/features/events/src'),
    '@inline/storage': path.join(outDir, 'packages/features/storage/src'),
    '@inline/ui': path.join(outDir, 'packages/features/ui/src'),
    '@inline/analyzer': path.join(outDir, 'packages/analyzer'),
    '@inline/accelerator': path.join(outDir, 'packages/accelerator'),
    '@language': path.join(outDir, 'packages/features/language/src'),
    '@completion': path.join(outDir, 'packages/features/completion/src'),
    '@context': path.join(outDir, 'packages/features/context/src'),
    '@storage': path.join(outDir, 'packages/features/storage/src'),
    '@network': path.join(outDir, 'packages/shared/src/network'),
    '@platform': path.join(outDir, 'packages/shared/src/platform'),
    '@events': path.join(outDir, 'packages/features/events/src')
});
async function runSuite(pattern, ui, testsRoot) {
    return new Promise((resolve, reject) => {
        // Create the mocha test
        const mocha = new mocha_1.default({
            ui: ui,
            color: true,
            timeout: 20000
        });
        (0, glob_1.glob)(pattern, { cwd: testsRoot }).then((files) => {
            // Add files to the test suite
            files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));
            try {
                // Run the mocha test
                mocha.run((failures) => {
                    if (failures > 0) {
                        reject(new Error(`${failures} tests failed.`));
                    }
                    else {
                        resolve();
                    }
                });
            }
            catch (err) {
                console.error(err);
                reject(err);
            }
        }, (error) => {
            reject(error);
        });
    });
}
async function run() {
    const testsRoot = path.resolve(__dirname, '..');
    try {
        // Check for test pattern from env
        const pattern = process.env['TEST_PATTERN'];
        if (pattern) {
            console.log(`Running tests matching pattern: ${pattern}`);
            // Default to TDD for targeted tests (works for most) or detect based on file?
            // For now assume TDD as most suites use 'suite'
            await runSuite(pattern, 'tdd', testsRoot);
        }
        else {
            // Run E2E tests (TDD style)
            await runSuite('suites/e2e/**/*.test.js', 'tdd', testsRoot);
            // Run Unit tests (BDD style)
            await runSuite('suites/unit/**/*.test.js', 'bdd', testsRoot);
            // Run Native tests (TDD style)
            await runSuite('suites/native/**/*.test.js', 'tdd', testsRoot);
        }
    }
    catch (err) {
        console.error('Test execution failed:', err);
        throw err;
    }
}
//# sourceMappingURL=index.js.map