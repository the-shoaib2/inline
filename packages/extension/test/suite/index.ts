import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';
import * as moduleAlias from 'module-alias';

// Register module aliases for runtime test execution
const projectRoot = path.resolve(__dirname, '../../../../../');
moduleAlias.addAliases({
  '@inline/core': path.join(projectRoot, 'packages/core/dist'),
  '@inline/shared': path.join(projectRoot, 'packages/shared/dist'),
  '@inline/completion': path.join(projectRoot, 'packages/features/completion/dist'),
  '@inline/intelligence': path.join(projectRoot, 'packages/features/intelligence/dist'),
  '@inline/context': path.join(projectRoot, 'packages/features/context/dist'),
  '@inline/language': path.join(projectRoot, 'packages/features/language/dist'),
  '@inline/events': path.join(projectRoot, 'packages/features/events/dist'),
  '@inline/storage': path.join(projectRoot, 'packages/features/storage/dist'),
  '@inline/ui': path.join(projectRoot, 'packages/features/ui/dist'),
  '@inline/analyzer': path.join(projectRoot, 'packages/analyzer'),
  '@inline/accelerator': path.join(projectRoot, 'packages/accelerator'),
  '@inline/extension': path.join(projectRoot, 'packages/extension/dist/src'),
  '@inline/extension/utilities': path.join(projectRoot, 'packages/extension/dist/test/utilities'),
  // Deprecated aliases mapped to dist as well
  '@language': path.join(projectRoot, 'packages/features/language/dist'),
  '@completion': path.join(projectRoot, 'packages/features/completion/dist'),
  '@context': path.join(projectRoot, 'packages/features/context/dist'),
  '@storage': path.join(projectRoot, 'packages/features/storage/dist'),
  '@network': path.join(projectRoot, 'packages/shared/dist/network'),
  '@platform': path.join(projectRoot, 'packages/shared/dist/platform'),
  '@events': path.join(projectRoot, 'packages/features/events/dist')
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
