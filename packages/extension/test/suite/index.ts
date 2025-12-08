import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

async function runSuite(pattern: string, ui: 'tdd' | 'bdd', testsRoot: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create the mocha test
    const mocha = new Mocha({
      ui: ui,
      color: true,
      timeout: 20000
    });

    glob(pattern, { cwd: testsRoot }, (err, files) => {
      if (err) {
        return reject(err);
      }

      // Add files to the test suite
      files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

      try {
        // Run the mocha test
        mocha.run(failures => {
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
