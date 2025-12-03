import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    files: 'out/test/**/*.test.js',
    version: 'stable',
    workspaceFolder: './test/fixtures/sample-workspace',
    mocha: {
        ui: 'bdd',
        timeout: 20000,
        color: true
    },
    launchArgs: [
        '--disable-extensions',
        '--disable-workspace-trust'
    ]
});
