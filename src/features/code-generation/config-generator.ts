/**
 * Config Generator
 * Generates configuration files
 */
export class ConfigGenerator {
    
    generateConfig(type: string, options: Record<string, any> = {}): string {
        const generators: Record<string, (opts: Record<string, any>) => string> = {
            'package.json': (opts) => this.generatePackageJSON(opts),
            'tsconfig.json': (opts) => this.generateTSConfig(opts),
            '.eslintrc.json': (opts) => this.generateESLintConfig(opts),
            '.prettierrc': (opts) => this.generatePrettierConfig(opts),
            'jest.config.js': (opts) => this.generateJestConfig(opts),
            'webpack.config.js': (opts) => this.generateWebpackConfig(opts),
            '.gitignore': (opts) => this.generateGitignore(opts),
            'docker-compose.yml': (opts) => this.generateDockerCompose(opts)
        };

        const generator = generators[type.toLowerCase()];
        return generator ? generator(options) : '';
    }

    private generatePackageJSON(opts: Record<string, any>): string {
        const name = opts.name || 'my-project';
        const version = opts.version || '1.0.0';
        
        return JSON.stringify({
            name,
            version,
            description: opts.description || '',
            main: 'dist/index.js',
            scripts: {
                start: 'node dist/index.js',
                build: 'tsc',
                dev: 'ts-node-dev src/index.ts',
                test: 'jest'
            },
            keywords: [],
            author: '',
            license: 'MIT',
            dependencies: {},
            devDependencies: {
                '@types/node': '^20.0.0',
                'typescript': '^5.0.0',
                'ts-node-dev': '^2.0.0'
            }
        }, null, 2);
    }

    private generateTSConfig(opts: Record<string, any>): string {
        return JSON.stringify({
            compilerOptions: {
                target: opts.target || 'ES2020',
                module: opts.module || 'commonjs',
                lib: ['ES2020'],
                outDir: './dist',
                rootDir: './src',
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: true,
                resolveJsonModule: true,
                declaration: true,
                declarationMap: true,
                sourceMap: true
            },
            include: ['src/**/*'],
            exclude: ['node_modules', 'dist']
        }, null, 2);
    }

    private generateESLintConfig(opts: Record<string, any>): string {
        return JSON.stringify({
            env: {
                node: true,
                es2021: true
            },
            extends: [
                'eslint:recommended',
                'plugin:@typescript-eslint/recommended'
            ],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                ecmaVersion: 12,
                sourceType: 'module'
            },
            plugins: ['@typescript-eslint'],
            rules: {
                'indent': ['error', 4],
                'quotes': ['error', 'single'],
                'semi': ['error', 'always']
            }
        }, null, 2);
    }

    private generatePrettierConfig(opts: Record<string, any>): string {
        return JSON.stringify({
            semi: true,
            trailingComma: 'all',
            singleQuote: true,
            printWidth: 100,
            tabWidth: 4
        }, null, 2);
    }

    private generateJestConfig(opts: Record<string, any>): string {
        return `module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/test'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    transform: {
        '^.+\\\\.ts$': 'ts-jest'
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html']
};`;
    }

    private generateWebpackConfig(opts: Record<string, any>): string {
        return `const path = require('path');

module.exports = {
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    }
};`;
    }

    private generateGitignore(opts: Record<string, any>): string {
        return `# Dependencies
node_modules/
vendor/

# Build output
dist/
build/
*.js.map

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*

# Testing
coverage/
.nyc_output/

# Misc
*.tmp
*.temp`;
    }

    private generateDockerCompose(opts: Record<string, any>): string {
        const serviceName = opts.serviceName || 'app';
        
        return `version: '3.8'

services:
  ${serviceName}:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: database
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:`;
    }
}
