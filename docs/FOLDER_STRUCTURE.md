# Folder Structure

## Project Layout

```
inline/
├── .github/
│   └── workflows/          # CI/CD automation
├── .vscode/                # Editor settings
│   ├── launch.json
│   └── tasks.json
├── docs/
│   ├── architecture/       # Technical design
│   │   ├── MODEL_INTEGRATION.md
│   │   ├── PERFORMANCE_OPTIMIZATION.md
│   │   └── PROJECT_PLAN.md
│   ├── guides/             # User guides
│   │   ├── CONTRIBUTING.md
│   │   ├── RELEASE.md
│   │   └── testing.md
│   └── FOLDER_STRUCTURE.md
├── resources/
│   ├── cache/              # Completion cache (runtime)
│   ├── config/             # User config (runtime)
│   ├── models/             # LLM models (runtime)
│   └── webview/            # UI assets
├── scripts/
│   └── release.sh          # Automated release
├── src/
│   ├── core/               # Core logic
│   │   ├── cache-manager.ts
│   │   ├── completion-provider.ts
│   │   ├── context-engine.ts
│   │   └── model-manager.ts
│   ├── models/             # Model management
│   │   ├── model-downloader.ts
│   │   └── model-validator.ts
│   ├── ui/                 # UI components
│   │   ├── model-manager-view.ts
│   │   ├── status-bar-manager.ts
│   │   └── webview-provider.ts
│   ├── utils/              # Utilities
│   │   ├── config-manager.ts
│   │   ├── error-handler.ts
│   │   ├── logger.ts
│   │   ├── network-detector.ts
│   │   ├── performance-monitor.ts
│   │   ├── resource-manager.ts
│   │   └── telemetry-manager.ts
│   └── extension.ts        # Entry point
├── test/
│   ├── e2e/                # End-to-end tests
│   ├── fixtures/           # Test data
│   ├── helpers/            # Test utilities
│   ├── integration/        # Integration tests
│   ├── mocks/              # Mock objects
│   ├── suite/              # Test suite
│   └── unit/               # Unit tests
├── out/                    # Build output (ignored)
├── node_modules/           # Dependencies (ignored)
├── .editorconfig           # Editor config
├── .eslintignore           # ESLint ignore
├── .eslintrc.yml           # ESLint config
├── .gitignore              # Git ignore
├── .nvmrc                  # Node version
├── .prettierignore         # Prettier ignore
├── .vscode-test.mjs        # VS Code test config
├── CHANGELOG.md            # Version history
├── LICENSE                 # Apache 2.0
├── package.json            # Package config
├── package-lock.json       # Dependency lock
├── README.md               # Documentation
└── tsconfig.json           # TypeScript config
```

## Directory Details

**docs/** - Documentation
- `architecture/` - Technical design docs (MODEL_INTEGRATION, PERFORMANCE_OPTIMIZATION, PROJECT_PLAN)
- `guides/` - User guides (CONTRIBUTING, RELEASE, testing)

**src/** - Source code
- `core/` - Core extension logic (completion, caching, context, models)
- `models/` - Model download and validation
- `ui/` - User interface (webview, status bar)
- `utils/` - Utilities (config, logging, monitoring, telemetry)
- `extension.ts` - Main entry point

**test/** - Test suites
- `e2e/` - End-to-end tests
- `unit/` - Unit tests
- `integration/` - Integration tests
- `fixtures/` - Test data and sample workspaces
- `helpers/` - Test utilities
- `mocks/` - Mock objects

**resources/** - Runtime resources
- `cache/` - Completion cache (gitignored)
- `config/` - User configuration (gitignored)
- `models/` - Downloaded models (gitignored)
- `webview/` - Webview HTML/CSS/JS assets

**scripts/** - Automation
- `release.sh` - Automated release script

## Configuration Files

- `.editorconfig` - Editor consistency across IDEs
- `.eslintrc.yml` - ESLint linting rules
- `.eslintignore` - Files to exclude from linting
- `.prettierignore` - Files to exclude from formatting
- `.gitignore` - Git ignore patterns
- `.nvmrc` - Node.js version specification
- `.vscode-test.mjs` - VS Code test configuration
- `tsconfig.json` - TypeScript compiler settings

## Build Artifacts (Ignored)

- `out/` - Compiled JavaScript output
- `dist/` - Distribution build
- `lib/` - Library build
- `coverage/` - Test coverage reports
- `.vscode-test/` - VS Code test files


