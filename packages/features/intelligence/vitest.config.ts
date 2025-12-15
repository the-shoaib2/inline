import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./__tests__/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                '__tests__/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/dist/',
                '**/*.js',
                '**/*.js.map'
            ],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 75,
                statements: 80
            }
        },
        include: ['__tests__/**/*.test.ts'],
        exclude: ['node_modules', 'dist'],
        testTimeout: 30000,
        hookTimeout: 30000
    },
    resolve: {
        alias: {
            '@inline/shared': path.resolve(__dirname, '../../shared/src'),
            '@inline/language': path.resolve(__dirname, '../language/src'),
            '@inline/core': path.resolve(__dirname, '../../core/src'),
            '@inline/events': path.resolve(__dirname, '../events/src'),
            '@inline/accelerator': path.resolve(__dirname, '../accelerator/src'),
            '@inline/analyzer': path.resolve(__dirname, '../analyzer/src')
        }
    }
});
