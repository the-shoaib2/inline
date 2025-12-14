/**
 * Test Runner for E2E Completion Features
 * Runs all completion-related tests
 */

import * as path from 'path';
import { glob } from 'glob';

export async function run(): Promise<void> {
    // Dynamically import Mocha
    const Mocha = (await import('mocha')).default;

    // Create the mocha test
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
        timeout: 30000, // 30 seconds for E2E tests
        reporter: 'spec'
    });

    const testsRoot = path.resolve(__dirname, '..');

    try {
        // Find test files
        const files = await glob('**/completion-features.test.js', { cwd: testsRoot });

        // Add files to the test suite
        files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

        // Run the mocha test
        return new Promise<void>((resolve, reject) => {
            try {
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
        });
    } catch (err) {
        throw new Error(`Failed to find test files: ${err}`);
    }
}
