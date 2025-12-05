import * as assert from 'assert';
import { TerminalAssistant } from '../../src/core/terminal-assistant';
import { LlamaInference } from '../../src/core/llama-inference';

suite('Terminal Assistant E2E Tests', () => {
    let assistant: TerminalAssistant;
    let inference: LlamaInference;

    suiteSetup(async function() {
        this.timeout(30000);

        inference = new LlamaInference();
        assistant = new TerminalAssistant(inference);
    });

    test('Should provide git command suggestions', () => {
        const gitCommands = assistant.getGitCommands();
        
        assert.ok(gitCommands.length > 0);
        assert.ok(gitCommands.some(cmd => cmd.command.includes('git status')));
        assert.ok(gitCommands.some(cmd => cmd.command.includes('git commit')));
    });

    test('Should provide npm command suggestions', () => {
        const npmCommands = assistant.getPackageManagerCommands('npm');
        
        assert.ok(npmCommands.length > 0);
        assert.ok(npmCommands.some(cmd => cmd.command.includes('npm install')));
        assert.ok(npmCommands.some(cmd => cmd.command.includes('npm test')));
    });

    test('Should convert npm to pnpm commands', () => {
        const pnpmCommands = assistant.getPackageManagerCommands('pnpm');
        
        assert.ok(pnpmCommands.every(cmd => cmd.command.includes('pnpm')));
        assert.ok(!pnpmCommands.some(cmd => cmd.command.includes('npm')));
    });

    test('Should provide Docker commands', () => {
        const dockerCommands = assistant.getDockerCommands();
        
        assert.ok(dockerCommands.length > 0);
        assert.ok(dockerCommands.some(cmd => cmd.command.includes('docker ps')));
    });

    test('Should detect dangerous commands', () => {
        assert.strictEqual(assistant.isDangerous('rm -rf /'), true);
        assert.strictEqual(assistant.isDangerous('sudo rm -rf'), true);
        assert.strictEqual(assistant.isDangerous('git status'), false);
        assert.strictEqual(assistant.isDangerous('npm install'), false);
    });

    test('Should detect fork bomb', () => {
        const forkBomb = ':(){ :|: & };:';
        assert.strictEqual(assistant.isDangerous(forkBomb), true);
    });

    test('Should manage command history', () => {
        assistant.addToHistory('git status');
        assistant.addToHistory('npm install');
        assistant.addToHistory('docker ps');

        const history = assistant.getHistory();
        assert.ok(history.length >= 3);
        assert.strictEqual(history[0], 'docker ps'); // Most recent first
    });

    test('Should search command history', () => {
        assistant.addToHistory('git commit -m "test"');
        assistant.addToHistory('git push origin main');
        
        const gitCommands = assistant.searchHistory('git');
        assert.ok(gitCommands.length >= 2);
    });

    test('Should categorize commands correctly', () => {
        const gitCommands = assistant.getGitCommands();
        assert.ok(gitCommands.every(cmd => cmd.category === 'git'));

        const npmCommands = assistant.getPackageManagerCommands();
        assert.ok(npmCommands.every(cmd => cmd.category === 'npm'));
    });

    suiteTeardown(async () => {
        if (inference) {
            await inference.unloadModel();
        }
    });
});
