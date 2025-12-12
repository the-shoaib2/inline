import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';
import * as moduleAlias from 'module-alias';

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


async function runSuite(pattern: string, ui: 'tdd' | 'bdd', testsRoot: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create the mocha test
    const mocha = new Mocha({
      ui: ui,
      color: true,
      timeout: 20000
    });

    glob(pattern, { cwd: testsRoot }).then((files: string[]) => {
      // Add files to the test suite
      files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

      try {
        // Run the mocha test
        mocha.run((failures: number) => {
          if (failures > 0) {
            reject(new Error(`${failures} tests failed.`));
          } else {
            resolve();
          }
        });
      } catch (err) {
        console.error(err);
        reject(err);
      }
    }, (error: any) => {
        reject(error);
    });
  });
}

export async function run(): Promise<void> {
  const testsRoot = path.resolve(__dirname, '..');

  try {
    // Check for test pattern from env
    const pattern = process.env['TEST_PATTERN'];

    if (pattern) {
      console.log(`Running tests matching pattern: ${pattern}`);
      // Default to TDD for targeted tests (works for most) or detect based on file?
      // For now assume TDD as most suites use 'suite'
      await runSuite(pattern, 'tdd', testsRoot);
    } else {
      // Run E2E tests (TDD style)
      await runSuite('suites/e2e/**/*.test.js', 'tdd', testsRoot);
      
      // Run Unit tests (BDD style)
      await runSuite('suites/unit/**/*.test.js', 'bdd', testsRoot);
      
      // Run Native tests (TDD style)
      await runSuite('suites/native/**/*.test.js', 'tdd', testsRoot);
    }
    
  } catch (err) {
    console.error('Test execution failed:', err);
    throw err;
  }
}
