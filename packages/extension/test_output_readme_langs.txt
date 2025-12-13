
> inline@0.1.0 pretest /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension
> pnpm build:native && pnpm compile


> inline@0.1.0 build:native /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension
> pnpm build:native:analyzer && pnpm build:native:accelerator


> inline@0.1.0 build:native:analyzer /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension
> pnpm --filter @inline/analyzer build


> @inline/analyzer@0.1.0 build /Users/ratulhasan/Desktop/Shoaib/inline/packages/analyzer
> napi build --platform --release && tsc

   Compiling inline-analyzer v0.1.0 (/Users/ratulhasan/Desktop/Shoaib/inline/packages/analyzer)
    Finished `release` profile [optimized] target(s) in 2.98s

> inline@0.1.0 build:native:accelerator /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension
> pnpm --filter @inline/accelerator build


> @inline/accelerator@0.1.0 build /Users/ratulhasan/Desktop/Shoaib/inline/packages/accelerator
> node-gyp configure && node-gyp build

gyp info it worked if it ends with ok
gyp info using node-gyp@12.1.0
gyp info using node@22.21.1 | darwin | arm64
gyp info find Python using Python version 3.9.6 found at "/Library/Developer/CommandLineTools/usr/bin/python3"

gyp info spawn /Library/Developer/CommandLineTools/usr/bin/python3
gyp info spawn args [
gyp info spawn args '/Users/ratulhasan/Desktop/Shoaib/inline/node_modules/.pnpm/node-gyp@12.1.0/node_modules/node-gyp/gyp/gyp_main.py',
gyp info spawn args 'binding.gyp',
gyp info spawn args '-f',
gyp info spawn args 'make',
gyp info spawn args '-I',
gyp info spawn args '/Users/ratulhasan/Desktop/Shoaib/inline/packages/accelerator/build/config.gypi',
gyp info spawn args '-I',
gyp info spawn args '/Users/ratulhasan/Desktop/Shoaib/inline/node_modules/.pnpm/node-gyp@12.1.0/node_modules/node-gyp/addon.gypi',
gyp info spawn args '-I',
gyp info spawn args '/Users/ratulhasan/Library/Caches/node-gyp/22.21.1/include/node/common.gypi',
gyp info spawn args '-Dlibrary=shared_library',
gyp info spawn args '-Dvisibility=default',
gyp info spawn args '-Dnode_root_dir=/Users/ratulhasan/Library/Caches/node-gyp/22.21.1',
gyp info spawn args '-Dnode_gyp_dir=/Users/ratulhasan/Desktop/Shoaib/inline/node_modules/.pnpm/node-gyp@12.1.0/node_modules/node-gyp',
gyp info spawn args '-Dnode_lib_file=/Users/ratulhasan/Library/Caches/node-gyp/22.21.1/<(target_arch)/node.lib',
gyp info spawn args '-Dmodule_root_dir=/Users/ratulhasan/Desktop/Shoaib/inline/packages/accelerator',
gyp info spawn args '-Dnode_engine=v8',
gyp info spawn args '--depth=.',
gyp info spawn args '--no-parallel',
gyp info spawn args '--generator-output',
gyp info spawn args 'build',
gyp info spawn args '-Goutput_dir=.'
gyp info spawn args ]
gyp info ok 
gyp info it worked if it ends with ok
gyp info using node-gyp@12.1.0
gyp info using node@22.21.1 | darwin | arm64
gyp info spawn make
gyp info spawn args [ 'BUILDTYPE=Release', '-C', 'build' ]
make: Nothing to be done for `all'.
gyp info ok 

> inline@0.1.0 compile /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension
> node esbuild.js

[watch] build started
[watch] build finished

> inline@0.1.0 test /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension
> NODE_PATH=./node_modules node ./dist/test/runTest.js

- Resolving version...
✔ Validated version: 1.93.0
✔ Found existing install in /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0
[90m[main 2025-12-13T08:29:26.480Z][0m update#setState disabled
[90m[main 2025-12-13T08:29:26.481Z][0m update#ctor - updates are disabled by the environment
2025-12-13 14:29:26.683 Code Helper (Renderer)[68888:315949] CoreText note: Client requested name ".NewYork-Regular", it will get TimesNewRomanPSMT rather than the intended font. All system UI font access should be through proper APIs such as CTFontCreateUIFontForLanguage() or +[NSFont systemFontOfSize:].
2025-12-13 14:29:26.683 Code Helper (Renderer)[68888:315949] CoreText note: Set a breakpoint on CTFontLogSystemFontNameRequest to debug.
Loading development extension at /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension
Started local extension host with pid 69245.
[DEBUG] TreeSitterService file loaded
[LanguageConfigService] Loaded patterns for 6 languages from /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/src/resources/languages.json
[DEBUG] TreeSitterService constructor called
[DEBUG] TreeSitterService initialize called
[DEBUG] TreeSitterService file loaded
[0m[0m
[Telemetry] {
  name: 'extension_activated',
  properties: { platform: 'darwin', arch: 'arm64', version: '1.93.0' },
  timestamp: '2025-12-13T08:29:27.535Z',
  sessionId: '1765614567535-shrkpc6qj'
}
[0m  Webview E2E Test Suite[0m
[Telemetry] {
  name: 'model_manager_opened',
  properties: { platform: 'darwin', arch: 'arm64', version: '1.93.0' },
  timestamp: '2025-12-13T08:29:28.544Z',
  sessionId: '1765614567535-shrkpc6qj'
}
  [32m  ✔[0m[90m Webview Command should register and execute[0m[31m (1004ms)[0m
  [32m  ✔[0m[90m Webview HTML generation[0m
[0m  UI E2E Tests[0m
Failed to fetch chat participant registry {}
  [32m  ✔[0m[90m Status bar should be visible[0m[31m (501ms)[0m
  [32m  ✔[0m[90m Status bar should show model status[0m[31m (505ms)[0m
  [32m  ✔[0m[90m Status bar should be clickable[0m
[Telemetry] {
  name: 'model_manager_opened',
  properties: { platform: 'darwin', arch: 'arm64', version: '1.93.0' },
  timestamp: '2025-12-13T08:29:30.585Z',
  sessionId: '1765614567535-shrkpc6qj'
}
  [32m  ✔[0m[90m Model Manager UI should open[0m[31m (500ms)[0m
2025-12-13 14:29:31.094 Code Helper (Renderer)[68888:315949] CoreText note: Client requested name ".PingFangUIDisplaySC-Regular", it will get TimesNewRomanPSMT rather than the intended font. All system UI font access should be through proper APIs such as CTFontCreateUIFontForLanguage() or +[NSFont systemFontOfSize:].
[Telemetry] {
  name: 'settings_opened',
  properties: { platform: 'darwin', arch: 'arm64', version: '1.93.0' },
  timestamp: '2025-12-13T08:29:31.086Z',
  sessionId: '1765614567535-shrkpc6qj'
}
Method not found: toJSON: CodeExpectedError: Method not found: toJSON
    at Object.call (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:51:5399)
    at w.s (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:49:5468)
    at w.q (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:49:4923)
    at S.value (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:49:4232)
    at t.B (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:44:750)
    at t.C (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:44:825)
    at t.fire (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:44:1044)
    at S.value (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:39:29412)
    at t.B (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:44:750)
    at t.fire (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:44:973)
    at S.value (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:39:29615)
    at t.B (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:44:750)
    at t.fire (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:44:973)
    at he (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:39:32026)
    at IpcMainImpl.l (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:51:19715)
    at IpcMainImpl.emit (node:events:519:28)
    at WebContents.<anonymous> (node:electron/js2c/browser_init:2:82518)
    at WebContents.emit (node:events:519:28)
  [32m  ✔[0m[90m Settings should open correctly[0m[31m (506ms)[0m
  [32m  ✔[0m[90m Commands should be in command palette[0m
  [32m  ✔[0m[90m UI should respect VS Code theme[0m
  [32m  ✔[0m[90m UI should be responsive[0m
  [32m  ✔[0m[90m UI should show loading states[0m
  [32m  ✔[0m[90m UI should show error messages[0m
  [32m  ✔[0m[90m UI should be accessible[0m
[0m  Test Generator E2E Tests[0m
[DEBUG] TreeSitterService constructor called
  [32m  ✔[0m[90m Should detect Jest framework from package.json[0m
  [32m  ✔[0m[90m Should generate test structure for TypeScript function[0m
  [32m  ✔[0m[90m Should support multiple test frameworks[0m
  [32m  ✔[0m[90m Should extract imports from generated tests[0m
  [32m  ✔[0m[90m Should count tests in generated code[0m
[0m  Terminal Assistant E2E Tests[0m
  [32m  ✔[0m[90m Should provide git command suggestions[0m
  [32m  ✔[0m[90m Should provide npm command suggestions[0m
  [32m  ✔[0m[90m Should convert npm to pnpm commands[0m
  [32m  ✔[0m[90m Should provide Docker commands[0m
  [32m  ✔[0m[90m Should detect dangerous commands[0m
  [32m  ✔[0m[90m Should detect fork bomb[0m
  [32m  ✔[0m[90m Should manage command history[0m
  [32m  ✔[0m[90m Should search command history[0m
  [32m  ✔[0m[90m Should categorize commands correctly[0m
[0m  Smart Features E2E Tests[0m
  [36m  - Code Actions should be available for selection[0m
  [36m  - Hover should show AI options on selection[0m
[0m  Security Scanner E2E Tests[0m
  [32m  ✔[0m[90m Should detect SQL injection vulnerability[0m
  [32m  ✔[0m[90m Should detect XSS vulnerability[0m
  [32m  ✔[0m[90m Should detect hardcoded secrets[0m
  [32m  ✔[0m[90m Should detect path traversal[0m
  [32m  ✔[0m[90m Should generate security report[0m
  [32m  ✔[0m[90m Should provide CWE IDs for vulnerabilities[0m
[0m  Network Detection E2E Tests[0m
  [32m  ✔[0m[90m Network detector should initialize[0m[31m (501ms)[0m
  [32m  ✔[0m[90m Should detect online status[0m
[Telemetry] {
  name: 'offline_toggled',
  properties: {
    platform: 'darwin',
    arch: 'arm64',
    version: '1.93.0',
    offline: false
  },
  timestamp: '2025-12-13T08:29:34.191Z',
  sessionId: '1765614567535-shrkpc6qj'
}
[Telemetry] {
  name: 'offline_toggled',
  properties: {
    platform: 'darwin',
    arch: 'arm64',
    version: '1.93.0',
    offline: true
  },
  timestamp: '2025-12-13T08:29:34.392Z',
  sessionId: '1765614567535-shrkpc6qj'
}
  [32m  ✔[0m[90m Should handle offline mode toggle[0m[31m (406ms)[0m
[Telemetry] {
  name: 'offline_toggled',
  properties: {
    platform: 'darwin',
    arch: 'arm64',
    version: '1.93.0',
    offline: false
  },
  timestamp: '2025-12-13T08:29:34.598Z',
  sessionId: '1765614567535-shrkpc6qj'
}
  [32m  ✔[0m[90m Should update status bar on network change[0m[31m (300ms)[0m
  [36m  - Should activate offline mode automatically[0m
[Telemetry] {
  name: 'offline_toggled',
  properties: {
    platform: 'darwin',
    arch: 'arm64',
    version: '1.93.0',
    offline: true
  },
  timestamp: '2025-12-13T08:29:34.899Z',
  sessionId: '1765614567535-shrkpc6qj'
}
  [32m  ✔[0m[90m Should show notification on offline activation[0m[31m (206ms)[0m
[Telemetry] {
  name: 'offline_toggled',
  properties: {
    platform: 'darwin',
    arch: 'arm64',
    version: '1.93.0',
    offline: false
  },
  timestamp: '2025-12-13T08:29:35.105Z',
  sessionId: '1765614567535-shrkpc6qj'
}
[SemanticAnalyzer] Extracting decorators for: untitled:Untitled-9 (typescript)
[DEBUG] getParser called for typescript
[DEBUG] getParser called for typescript
[DEBUG] Created parser for typescript
[DEBUG] Loading queries for typescript from /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/resources/tree-sitter-queries/typescript
[DEBUG] Loaded query: imports
[DEBUG] Loaded query: functions
[DEBUG] Loaded query: classes
[DEBUG] Loaded query: decorators
[DEBUG] Loaded query: generics
[DEBUG] Loaded query: patternMatching
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for typescript
[DEBUG] No matches for typescript. Query: [(type_parameter) @generic]...
[DEBUG] Created parser for typescript
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for typescript
[DEBUG] No matches for typescript. Query: [(decorator) @decorator]...
[SemanticAnalyzer] Decorator matches found: 0
[SemanticAnalyzer] Tree for typescript: (program (comment))...
[SemanticAnalyzer] Total decorators extracted: 0
[Telemetry] {
  name: 'offline_toggled',
  properties: {
    platform: 'darwin',
    arch: 'arm64',
    version: '1.93.0',
    offline: true
  },
  timestamp: '2025-12-13T08:29:41.689Z',
  sessionId: '1765614567535-shrkpc6qj'
}
  [32m  ✔[0m[90m Should maintain functionality in offline mode[0m[31m (6584ms)[0m
  [32m  ✔[0m[90m Should monitor network continuously[0m[31m (1000ms)[0m
  [32m  ✔[0m[90m Should stop monitoring on deactivation[0m
[0m  Model Manager E2E Tests[0m
  [32m  ✔[0m[90m Model Manager should initialize[0m
  [32m  ✔[0m[90m Should list available models[0m
  [32m  ✔[0m[90m Should detect downloaded models[0m[31m (504ms)[0m
  [32m  ✔[0m[90m Should get best model for requirements[0m
  [32m  ✔[0m[90m Should validate model paths[0m
  [32m  ✔[0m[90m Should monitor system resources[0m
  [32m  ✔[0m[90m Should handle model download simulation[0m
  [32m  ✔[0m[90m Should handle model removal[0m
  [32m  ✔[0m[90m Should optimize model for language[0m
  [32m  ✔[0m[90m Should handle missing models gracefully[0m
  [32m  ✔[0m[90m Should support multiple model formats[0m
  [32m  ✔[0m[90m Should cache model metadata[0m
[0m  Model Import E2E Test[0m
  [32m  ✔[0m[90m Should validate and import GGUF model[0m
  [32m  ✔[0m[90m Should reject invalid files[0m
  [32m  ✔[0m[90m Should detect models in workspace/models directory[0m
[0m  Memory Management E2E Tests[0m
  [36m  - MemoryManager tracks extension-specific memory[0m
  [36m  - MemoryManager detects memory pressure correctly[0m
  [36m  - MemoryManager calculates safe cache sizes[0m
  [36m  - MemoryManager cleanup callbacks work[0m
[0m  Cache Management E2E Tests[0m
  [36m  - CacheManager stores and retrieves data[0m
  [36m  - CacheManager tracks hit rate[0m
  [36m  - CacheManager enforces size limits with LRU[0m
  [36m  - CacheManager cleanup removes old entries[0m
[0m  Parallel Processing E2E Tests[0m
  [36m  - ParallelProcessor executes tasks concurrently[0m
  [36m  - ParallelProcessor gathers context from multiple files[0m
[0m  User Pattern Detection E2E Tests[0m
  [36m  - UserPatternDetector records and retrieves patterns[0m
  [36m  - UserPatternDetector detects coding style[0m
  [36m  - UserPatternDetector provides suggestions[0m
  [36m  - UserPatternDetector cleanup removes old patterns[0m
[0m  Integration Tests[0m
  [36m  - Memory pressure triggers cache cleanup[0m
[0m  Extension E2E Tests[0m
  [32m  ✔[0m[90m Extension should be present[0m
  [32m  ✔[0m[90m Extension should activate[0m
  [32m  ✔[0m[90m All commands should be registered[0m
  [32m  ✔[0m[90m Status bar item should be created[0m[31m (505ms)[0m
  [36m  - Configuration should be loaded[0m
[Telemetry] {
  name: 'model_manager_opened',
  properties: { platform: 'darwin', arch: 'arm64', version: '1.93.0' },
  timestamp: '2025-12-13T08:29:46.737Z',
  sessionId: '1765614567535-shrkpc6qj'
}
  [32m  ✔[0m[90m Model Manager command should execute[0m
[Telemetry] {
  name: 'offline_toggled',
  properties: {
    platform: 'darwin',
    arch: 'arm64',
    version: '1.93.0',
    offline: false
  },
  timestamp: '2025-12-13T08:29:46.738Z',
  sessionId: '1765614567535-shrkpc6qj'
}
  [32m  ✔[0m[90m Toggle Offline command should execute[0m
  [32m  ✔[0m[90m Clear Cache command should execute[0m
[Telemetry] {
  name: 'settings_opened',
  properties: { platform: 'darwin', arch: 'arm64', version: '1.93.0' },
  timestamp: '2025-12-13T08:29:46.739Z',
  sessionId: '1765614567535-shrkpc6qj'
}
  [32m  ✔[0m[90m Settings command should execute[0m
  [32m  ✔[0m[90m Extension context should be set[0m
[0m  Download Manager E2E Tests[0m
Method not found: toJSON: CodeExpectedError: Method not found: toJSON
    at Object.call (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:51:5399)
    at w.s (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:49:5468)
    at w.q (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:49:4923)
    at S.value (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:49:4232)
    at t.B (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:44:750)
    at t.C (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:44:825)
    at t.fire (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:44:1044)
    at S.value (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:39:29412)
    at t.B (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:44:750)
    at t.fire (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:44:973)
    at S.value (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:39:29615)
    at t.B (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:44:750)
    at t.fire (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:44:973)
    at he (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:39:32026)
    at IpcMainImpl.l (/Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/.vscode-test/vscode-darwin-arm64-1.93.0/Visual Studio Code.app/Contents/Resources/app/out/vs/code/electron-main/main.js:51:19715)
    at IpcMainImpl.emit (node:events:519:28)
    at WebContents.<anonymous> (node:electron/js2c/browser_init:2:82518)
    at WebContents.emit (node:events:519:28)
  [32m  ✔[0m[90m Should handle download from URL[0m
[Telemetry] {
  name: 'models_folder_opened',
  properties: { platform: 'darwin', arch: 'arm64', version: '1.93.0' },
  timestamp: '2025-12-13T08:29:47.747Z',
  sessionId: '1765614567535-shrkpc6qj'
}
  [32m  ✔[0m[90m Should open models folder[0m
[Telemetry] {
  name: 'check_updates',
  properties: { platform: 'darwin', arch: 'arm64', version: '1.93.0' },
  timestamp: '2025-12-13T08:29:47.750Z',
  sessionId: '1765614567535-shrkpc6qj'
}
  [32m  ✔[0m[90m Should check for updates[0m
[0m  Documentation Generator E2E Tests[0m
  [32m  ✔[0m[90m Should detect JSDoc style for JavaScript[0m
  [32m  ✔[0m[90m Should detect TSDoc style for TypeScript[0m
  [32m  ✔[0m[90m Should detect Python docstring styles[0m
  [32m  ✔[0m[90m Should generate documentation structure[0m
  [32m  ✔[0m[90m Should support multiple documentation styles[0m
[0m  Completion Provider E2E Tests[0m
[MockLlamaEngine] Model "loaded": mock://test-model
✓ Mock inference engine injected
✓ Using mock inference engine for tests
  [32m  ✔[0m[90m Inline completion provider should be registered[0m
[SemanticAnalyzer] Extracting decorators for: untitled:Untitled-1 (typescript)
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for typescript
[DEBUG] No matches for typescript. Query: [(decorator) @decorator]...
[SemanticAnalyzer] Decorator matches found: 0
[SemanticAnalyzer] Tree for typescript: (program (comment))...
[SemanticAnalyzer] Total decorators extracted: 0
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for typescript
[DEBUG] No matches for typescript. Query: [(type_parameter) @generic]...
  [32m  ✔[0m[90m Should provide completions for function comment[0m[31m (255ms)[0m
[SemanticAnalyzer] Extracting decorators for: untitled:Untitled-1 (typescript)
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for typescript
[DEBUG] No matches for typescript. Query: [(decorator) @decorator]...
[SemanticAnalyzer] Decorator matches found: 0
[SemanticAnalyzer] Tree for typescript: (program (expression_statement (class name: (type_identifier) body: (class_body (MISSING "}")))))...
[SemanticAnalyzer] Total decorators extracted: 0
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for typescript
[DEBUG] No matches for typescript. Query: [(type_parameter) @generic]...
  [32m  ✔[0m[90m Should provide completions for class definition[0m[31m (161ms)[0m
[SemanticAnalyzer] Extracting decorators for: untitled:Untitled-1 (typescript)
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for typescript
[DEBUG] No matches for typescript. Query: [(decorator) @decorator]...
[SemanticAnalyzer] Decorator matches found: 0
[SemanticAnalyzer] Tree for typescript: (program (ERROR))...
[SemanticAnalyzer] Total decorators extracted: 0
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for typescript
[DEBUG] No matches for typescript. Query: [(type_parameter) @generic]...
  [32m  ✔[0m[90m Should provide completions for import statement[0m[31m (104ms)[0m
  [32m  ✔[0m[90m Should respect cancellation token[0m
  [32m  ✔[0m[90m Completion latency should be under 500ms[0m
  [32m  ✔[0m[90m Should work with Python files[0m
  [32m  ✔[0m[90m Should work with JavaScript files[0m
  [32m  ✔[0m[90m Should cache completions for same context[0m[31m (210ms)[0m
  [32m  ✔[0m[90m Should include .cursorrules in context[0m
  [32m  ✔[0m[90m Should provide fix code action[0m
[0m  Completion Performance Tests[0m
Completion took 0.09912500000064028ms
  [32m  ✔[0m[90m Completion latency should be under 500ms[0m
  [32m  ✔[0m[90m Streaming should trigger UI updates[0m
Cached completion took 0ms
  [32m  ✔[0m[90m Cache should be instant (<50ms)[0m
  [36m  - Predictive prefetching should cache next token[0m
[SemanticAnalyzer] Extracting decorators for: untitled:Untitled-1 (python)
[DEBUG] getParser called for python
[DEBUG] getParser called for python
[DEBUG] Created parser for python
[DEBUG] Loading queries for python from /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/resources/tree-sitter-queries/python
[DEBUG] Loaded query: imports
[DEBUG] Loaded query: functions
[DEBUG] Loaded query: classes
[DEBUG] Loaded query: decorators
[DEBUG] Loaded query: generics
[DEBUG] Loaded query: patternMatching
[DEBUG] matches: 0 for python
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] No matches for python. Query: [(decorator) @decorator]...
[SemanticAnalyzer] Decorator matches found: 0
[SemanticAnalyzer] Tree for python: (module (function_definition name: (identifier) parameters: (parameters (identifier) (identifier)) body: (block)))...
[SemanticAnalyzer] Total decorators extracted: 0
[DEBUG] Created parser for python
[DEBUG] matches: 0 for python
[DEBUG] No matches for python. Query: ; No generics queries for python...
Language.query is deprecated. Use new Query(language, source) instead.
  [32m  ✔[0m[90m Should support Python function definition[0m[31m (119ms)[0m
  [32m  ✔[0m[90m Should support Go function definition[0m
[SemanticAnalyzer] Extracting decorators for: untitled:Untitled-1 (typescript)
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for typescript
[DEBUG] No matches for typescript. Query: [(decorator) @decorator]...
[SemanticAnalyzer] Decorator matches found: 0
[SemanticAnalyzer] Tree for typescript: (program (expression_statement (call_expression function: (member_expression object: (identifier) property: (property_identifier)) arguments: (arguments (string (string_fragment))))))...
[SemanticAnalyzer] Total decorators extracted: 0
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for typescript
[DEBUG] No matches for typescript. Query: [(type_parameter) @generic]...
  [32m  ✔[0m[90m Stress Test: Rapid fire requests should be queued/debounced[0m[31m (166ms)[0m
Performance Report: Performance Report (0 samples)
===========================================

Total Latency:
  P50: 0ms
  P95: 0ms
  P99: 0ms
  Avg: 0ms
  Range: 0-0ms

Context Gathering:
  P50: 0ms
  P95: 0ms
  Avg: 0ms

Inference:
  P50: 0ms
  P95: 0ms
  Avg: 0ms

Rendering:
  P50: 0ms
  P95: 0ms
  Avg: 0ms

  P95: 0ms
  Avg: 0ms

Cache Hit Rate: 0.0%
Tokens/Sec: 0.0 T/s

Target: 210-325ms total
Status: ✅ PASSING
  [32m  ✔[0m[90m Performance report should contain valid metrics[0m
[0m  Advanced Completion Features E2E Tests[0m
  [36m  - Should auto-fix missing semicolon if validation enabled[0m
  [36m  - Should auto-close function block[0m
  [36m  - Should respect indentation in Python function[0m
  [32m  ✔[0m[90m Token optimization should run[0m
[0m  Code Suggestions E2E Test[0m
  [32m  ✔[0m[90m Should provide suggestions for python[0m
[SemanticAnalyzer] Extracting decorators for: untitled:Untitled-2 (javascript)
[DEBUG] getParser called for javascript
[DEBUG] getParser called for javascript
[DEBUG] Created parser for javascript
[DEBUG] Loading queries for javascript from /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/resources/tree-sitter-queries/javascript
[DEBUG] Loaded query: imports
[DEBUG] Loaded query: functions
[DEBUG] Loaded query: classes
[DEBUG] Loaded query: decorators
[DEBUG] Loaded query: generics
[DEBUG] Loaded query: patternMatching
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for javascript
[DEBUG] No matches for javascript. Query: [(decorator) @decorator]...
[SemanticAnalyzer] Decorator matches found: 0
[SemanticAnalyzer] Tree for javascript: (program (expression_statement (function_expression name: (identifier) parameters: (formal_parameters (identifier) (identifier)) body: (statement_block (MISSING "}")))))...
[SemanticAnalyzer] Total decorators extracted: 0
[DEBUG] Created parser for javascript
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for javascript
[DEBUG] No matches for javascript. Query: ; No generics queries for javascript...
  [32m  ✔[0m[90m Should provide suggestions for javascript[0m
[SemanticAnalyzer] Extracting decorators for: untitled:Untitled-3 (java)
[DEBUG] getParser called for java
[DEBUG] getParser called for java
[DEBUG] Created parser for java
[DEBUG] Loading queries for java from /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/resources/tree-sitter-queries/java
[DEBUG] Loaded query: imports
[DEBUG] Loaded query: functions
[DEBUG] Loaded query: classes
[DEBUG] Loaded query: decorators
[DEBUG] Loaded query: generics
[DEBUG] Loaded query: patternMatching
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for java
[DEBUG] No matches for java. Query: [(type_parameter) @generic]...
[DEBUG] Created parser for java
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for java
[DEBUG] No matches for java. Query: [(marker_annotation) (annotation)] @decorator...
[SemanticAnalyzer] Decorator matches found: 0
[SemanticAnalyzer] Tree for java: (program (class_declaration (modifiers) name: (identifier) body: (class_body (method_declaration (modifiers) type: (integral_type) name: (identifier) parameters: (formal_parameters (formal_parameter type: (integral_type) name: (identifier)) (formal_parameter type: (integral_type) name: (identifier))) body: (block (MISSING "}"))) (MISSING "}"))))...
[SemanticAnalyzer] Total decorators extracted: 0
  [32m  ✔[0m[90m Should provide suggestions for java[0m
[SemanticAnalyzer] Extracting decorators for: untitled:Untitled-4 (cpp)
[DEBUG] getParser called for cpp
[DEBUG] getParser called for cpp
[DEBUG] Created parser for cpp
[DEBUG] Loading queries for cpp from /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/resources/tree-sitter-queries/cpp
[DEBUG] Loaded query: imports
[DEBUG] Loaded query: functions
[DEBUG] Loaded query: classes
[DEBUG] Loaded query: decorators
[DEBUG] Loaded query: generics
[DEBUG] Loaded query: patternMatching
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for cpp
[DEBUG] No matches for cpp. Query: [(template_parameter_list) @generic]...
[DEBUG] Created parser for cpp
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for cpp
[DEBUG] No matches for cpp. Query: [(attribute_specifier) @decorator]...
[SemanticAnalyzer] Decorator matches found: 0
[SemanticAnalyzer] Tree for cpp: (translation_unit (function_definition type: (primitive_type) declarator: (function_declarator declarator: (identifier) parameters: (parameter_list (parameter_declaration type: (primitive_type) declarator: (identifier)) (parameter_declaration type: (primitive_type) declarator: (identifier)))) body: (compound_statement (MISSING "}"))))...
[SemanticAnalyzer] Total decorators extracted: 0
  [32m  ✔[0m[90m Should provide suggestions for cpp[0m[31m (100ms)[0m
[SemanticAnalyzer] Extracting decorators for: untitled:Untitled-5 (go)
[DEBUG] getParser called for go
[DEBUG] getParser called for go
[DEBUG] Created parser for go
[DEBUG] Loading queries for go from /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/resources/tree-sitter-queries/go
[DEBUG] Loaded query: imports
[DEBUG] Loaded query: functions
[DEBUG] Loaded query: classes
[DEBUG] Loaded query: decorators
[DEBUG] Loaded query: generics
[DEBUG] Loaded query: patternMatching
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for go
[DEBUG] No matches for go. Query: [(type_parameter_list) @generic]...
[DEBUG] Created parser for go
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for go
[DEBUG] No matches for go. Query: ; No decorators queries for go...
[SemanticAnalyzer] Decorator matches found: 0
[SemanticAnalyzer] Tree for go: (source_file (function_declaration name: (identifier) parameters: (parameter_list (parameter_declaration name: (identifier) type: (type_identifier)) (parameter_declaration name: (identifier) type: (type_identifier))) result: (type_identifier)) (ERROR))...
[SemanticAnalyzer] Total decorators extracted: 0
  [32m  ✔[0m[90m Should provide suggestions for go[0m
[SemanticAnalyzer] Extracting decorators for: untitled:Untitled-6 (rust)
[DEBUG] getParser called for rust
[DEBUG] getParser called for rust
[DEBUG] Created parser for rust
[DEBUG] Loading queries for rust from /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/resources/tree-sitter-queries/rust
[DEBUG] Loaded query: imports
[DEBUG] Loaded query: functions
[DEBUG] Loaded query: classes
[DEBUG] Loaded query: decorators
[DEBUG] Loaded query: generics
[DEBUG] Loaded query: patternMatching
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for rust
[DEBUG] No matches for rust. Query: [(attribute_item) @decorator]...
[SemanticAnalyzer] Decorator matches found: 0
[SemanticAnalyzer] Tree for rust: (ERROR (identifier) (parameters (parameter pattern: (identifier) type: (primitive_type)) (parameter pattern: (identifier) type: (primitive_type))) (primitive_type))...
[SemanticAnalyzer] Total decorators extracted: 0
[DEBUG] Created parser for rust
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for rust
[DEBUG] No matches for rust. Query: [(type_parameters) @generic]...
  [32m  ✔[0m[90m Should provide suggestions for rust[0m
[0m  LLM Benchmark Test[0m

📦 Using model: codellama-7b.gguf
📍 Path: /Users/ratulhasan/.inline/models/codellama-7b.gguf

⏳ Loading model...
⚠️  Model file not available or corrupted, skipping benchmark tests
Error: Error: Model file appears to be corrupted. Try re-downloading.
  [36m  - should verify model is loaded[0m
  [36m  - should benchmark streaming completion with sample prompt[0m
  [36m  - should test code improvement with streaming[0m
  [36m  - should test multiple rapid completions (stress test)[0m
[0m  Tree-sitter E2E Tests[0m
[DEBUG] TreeSitterService initialize called
[0m    TypeScript Decorator Detection[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test.ts (typescript)
[DEBUG] getParser called for typescript
[DEBUG] Created parser for typescript
[DEBUG] Loading queries for typescript from /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/resources/tree-sitter-queries/typescript
[DEBUG] Loaded query: imports
[DEBUG] Loaded query: functions
[DEBUG] Loaded query: classes
[DEBUG] Loaded query: decorators
[DEBUG] Loaded query: generics
[DEBUG] Loaded query: patternMatching
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 3 for typescript
[DEBUG] Capture names: decorator, decorator, decorator
[SemanticAnalyzer] Decorator matches found: 3
[SemanticAnalyzer] Found simple decorator: Component at line 1
[SemanticAnalyzer] Found simple decorator: Input at line 6
[SemanticAnalyzer] Found simple decorator: Output at line 7
[SemanticAnalyzer] Total decorators extracted: 3
    [32m  ✔[0m[90m Should detect @Component decorator[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test.ts (typescript)
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 1 for typescript
[DEBUG] Capture names: decorator
[SemanticAnalyzer] Decorator matches found: 1
[SemanticAnalyzer] Found simple decorator: Injectable at line 1
[SemanticAnalyzer] Total decorators extracted: 1
    [32m  ✔[0m[90m Should detect @Injectable decorator[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test.ts (typescript)
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 3 for typescript
[DEBUG] Capture names: decorator, decorator, decorator
[SemanticAnalyzer] Decorator matches found: 3
[SemanticAnalyzer] Found simple decorator: Required at line 2
[SemanticAnalyzer] Found simple decorator: MinLength at line 3
[SemanticAnalyzer] Found simple decorator: MaxLength at line 4
[SemanticAnalyzer] Total decorators extracted: 3
    [32m  ✔[0m[90m Should detect multiple decorators on same element[0m
[0m    TypeScript Generic Extraction[0m
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 1 for typescript
[DEBUG] Capture names: generic
    [32m  ✔[0m[90m Should extract simple generic[0m
    [36m  - Should extract generic with constraint[0m
    [36m  - Should extract class generics[0m
[0m    Python Decorator Detection[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test.py (python)
[DEBUG] getParser called for python
[DEBUG] Created parser for python
[DEBUG] Loading queries for python from /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/resources/tree-sitter-queries/python
[DEBUG] Loaded query: imports
[DEBUG] Loaded query: functions
[DEBUG] Loaded query: classes
[DEBUG] Loaded query: decorators
[DEBUG] Loaded query: generics
[DEBUG] Loaded query: patternMatching
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 2 for python
[DEBUG] Capture names: decorator, decorator
[SemanticAnalyzer] Decorator matches found: 2
[SemanticAnalyzer] Found simple decorator: property at line 2
[SemanticAnalyzer] Found simple decorator: value.setter at line 6
[SemanticAnalyzer] Total decorators extracted: 2
    [32m  ✔[0m[90m Should detect @property decorator[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test.py (python)
[DEBUG] getParser called for python
[DEBUG] Returning cached parser for python
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 2 for python
[DEBUG] Capture names: decorator, decorator
[SemanticAnalyzer] Decorator matches found: 2
[SemanticAnalyzer] Found simple decorator: app.route at line 1
[SemanticAnalyzer] Found simple decorator: login_required at line 2
[SemanticAnalyzer] Total decorators extracted: 2
    [32m  ✔[0m[90m Should detect Flask route decorator[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test.py (python)
[DEBUG] getParser called for python
[DEBUG] Returning cached parser for python
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 1 for python
[DEBUG] Capture names: decorator
[SemanticAnalyzer] Decorator matches found: 1
[SemanticAnalyzer] Found simple decorator: app.route at line 1
[SemanticAnalyzer] Total decorators extracted: 1
    [32m  ✔[0m[90m Should detect decorator with arguments[0m
[0m    Rust Attribute Detection[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test.rs (rust)
[DEBUG] getParser called for rust
[DEBUG] Created parser for rust
[DEBUG] Loading queries for rust from /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/resources/tree-sitter-queries/rust
[DEBUG] Loaded query: imports
[DEBUG] Loaded query: functions
[DEBUG] Loaded query: classes
[DEBUG] Loaded query: decorators
[DEBUG] Loaded query: generics
[DEBUG] Loaded query: patternMatching
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 1 for rust
[DEBUG] Capture names: decorator
[SemanticAnalyzer] Decorator matches found: 1
[SemanticAnalyzer] Found simple decorator: derive at line 1
[SemanticAnalyzer] Total decorators extracted: 1
    [32m  ✔[0m[90m Should detect #[derive] attribute[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test.rs (rust)
[DEBUG] getParser called for rust
[DEBUG] Returning cached parser for rust
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 3 for rust
[DEBUG] Capture names: decorator, decorator, decorator
[SemanticAnalyzer] Decorator matches found: 3
[SemanticAnalyzer] Found simple decorator: test at line 1
[SemanticAnalyzer] Found simple decorator: cfg at line 6
[SemanticAnalyzer] Found simple decorator: test at line 8
[SemanticAnalyzer] Total decorators extracted: 3
    [32m  ✔[0m[90m Should detect #[test] attribute[0m
[0m    Java Annotation Detection[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test.java (java)
[DEBUG] getParser called for java
[DEBUG] Created parser for java
[DEBUG] Loading queries for java from /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/resources/tree-sitter-queries/java
[DEBUG] Loaded query: imports
[DEBUG] Loaded query: functions
[DEBUG] Loaded query: classes
[DEBUG] Loaded query: decorators
[DEBUG] Loaded query: generics
[DEBUG] Loaded query: patternMatching
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 1 for java
[DEBUG] Capture names: decorator
[SemanticAnalyzer] Decorator matches found: 1
[SemanticAnalyzer] Found simple decorator: Override at line 2
[SemanticAnalyzer] Total decorators extracted: 1
    [32m  ✔[0m[90m Should detect @Override annotation[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test.java (java)
[DEBUG] getParser called for java
[DEBUG] Returning cached parser for java
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 5 for java
[DEBUG] Capture names: decorator, decorator, decorator, decorator, decorator
[SemanticAnalyzer] Decorator matches found: 5
[SemanticAnalyzer] Found simple decorator: RestController at line 1
[SemanticAnalyzer] Found simple decorator: RequestMapping at line 2
[SemanticAnalyzer] Found simple decorator: GetMapping at line 5
[SemanticAnalyzer] Found simple decorator: PostMapping at line 10
[SemanticAnalyzer] Found simple decorator: RequestBody at line 11
[SemanticAnalyzer] Total decorators extracted: 5
    [32m  ✔[0m[90m Should detect Spring annotations[0m
[0m    Multi-Language Parsing[0m
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
    [32m  ✔[0m[90m Should parse TypeScript correctly[0m
[DEBUG] getParser called for python
[DEBUG] Returning cached parser for python
    [32m  ✔[0m[90m Should parse Python correctly[0m
[DEBUG] getParser called for rust
[DEBUG] Returning cached parser for rust
    [32m  ✔[0m[90m Should parse Rust correctly[0m
[DEBUG] getParser called for java
[DEBUG] Returning cached parser for java
    [32m  ✔[0m[90m Should parse Java correctly[0m
[DEBUG] getParser called for go
[DEBUG] Created parser for go
    [32m  ✔[0m[90m Should parse Go correctly[0m
[0m    Performance Tests[0m
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
    [32m  ✔[0m[90m Should parse large file quickly[0m
    [36m  - Should cache parsers efficiently[0m
[0m  Tree-sitter Integration with LLM[0m
[DEBUG] TreeSitterService initialize called
[0m    Context Building with Decorators[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test-1765614599481.ts (typescript)
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 3 for typescript
[DEBUG] Capture names: decorator, decorator, decorator
[SemanticAnalyzer] Decorator matches found: 3
[SemanticAnalyzer] Found simple decorator: Component at line 3
[SemanticAnalyzer] Found simple decorator: Input at line 8
[SemanticAnalyzer] Found simple decorator: Output at line 9
[SemanticAnalyzer] Total decorators extracted: 3
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for typescript
[DEBUG] No matches for typescript. Query: [(type_parameter) @generic]...
    [32m  ✔[0m[90m Should include decorators in context for TypeScript[0m[33m (41ms)[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test-1765614599522.py (python)
[DEBUG] getParser called for python
[DEBUG] Returning cached parser for python
[DEBUG] getParser called for python
[DEBUG] Returning cached parser for python
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 3 for python
[DEBUG] Capture names: decorator, decorator, decorator
[SemanticAnalyzer] Decorator matches found: 3
[SemanticAnalyzer] Found simple decorator: app.route at line 6
[SemanticAnalyzer] Found simple decorator: login_required at line 7
[SemanticAnalyzer] Found simple decorator: app.route at line 12
[SemanticAnalyzer] Total decorators extracted: 3
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for python
[DEBUG] No matches for python. Query: ; No generics queries for python...
    [32m  ✔[0m[90m Should include decorators in context for Python[0m
[0m    Context Building with Generics[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test-1765614599528.ts (typescript)
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for typescript
[DEBUG] No matches for typescript. Query: [(decorator) @decorator]...
[SemanticAnalyzer] Decorator matches found: 0
[SemanticAnalyzer] Tree for typescript: (program (interface_declaration name: (type_identifier) type_parameters: (type_parameters (type_parameter name: (type_identifier))) body: (interface_body (method_signature name: (property_identifier) parameters: (formal_parameters) return_type: (type_annotation (generic_type name: (type_identifier) type_arguments: (type_arguments (array_type (type_identifier)))))) (method_signature name: (property_identifier) parameters: (formal_parameters (required_parameter pattern: (identifier) type: (type_an...
[SemanticAnalyzer] Total decorators extracted: 0
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 1 for typescript
[DEBUG] Capture names: generic
    [32m  ✔[0m[90m Should include generics in context for TypeScript[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test-1765614599539.java (java)
[DEBUG] getParser called for java
[DEBUG] Returning cached parser for java
[DEBUG] getParser called for java
[DEBUG] Returning cached parser for java
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for java
[DEBUG] No matches for java. Query: [(marker_annotation) (annotation)] @decorator...
[SemanticAnalyzer] Decorator matches found: 0
[SemanticAnalyzer] Tree for java: (program (import_declaration (scoped_identifier scope: (scoped_identifier scope: (identifier) name: (identifier)) name: (identifier))) (import_declaration (scoped_identifier scope: (scoped_identifier scope: (identifier) name: (identifier)) name: (identifier))) (class_declaration (modifiers) name: (identifier) type_parameters: (type_parameters (type_parameter (type_identifier) (type_bound (type_identifier)))) body: (class_body (field_declaration (modifiers) type: (generic_type (type_identifier) (...
[SemanticAnalyzer] Total decorators extracted: 0
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 1 for java
[DEBUG] Capture names: generic
    [32m  ✔[0m[90m Should include generics in context for Java[0m
[0m    Code Completion with Enhanced Context[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test-1765614599543.ts (typescript)
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 2 for typescript
[DEBUG] Capture names: decorator, decorator
[SemanticAnalyzer] Decorator matches found: 2
[SemanticAnalyzer] Found simple decorator: Component at line 3
[SemanticAnalyzer] Found simple decorator: Input at line 8
[SemanticAnalyzer] Total decorators extracted: 2
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for typescript
[DEBUG] No matches for typescript. Query: [(type_parameter) @generic]...
Decorators in context: [ 'Component', 'Input' ]
    [32m  ✔[0m[90m Should provide better completions with decorator context[0m[31m (123ms)[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test-1765614599666.ts (typescript)
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for typescript
[DEBUG] No matches for typescript. Query: [(decorator) @decorator]...
[SemanticAnalyzer] Decorator matches found: 0
[SemanticAnalyzer] Tree for typescript: (program (function_declaration name: (identifier) type_parameters: (type_parameters (type_parameter name: (type_identifier)) (type_parameter name: (type_identifier))) parameters: (formal_parameters (required_parameter pattern: (identifier) type: (type_annotation (array_type (type_identifier)))) (required_parameter pattern: (identifier) type: (type_annotation (function_type parameters: (formal_parameters (required_parameter pattern: (identifier) type: (type_annotation (type_identifier)))) return_...
[SemanticAnalyzer] Total decorators extracted: 0
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 2 for typescript
[DEBUG] Capture names: generic, generic
Generics in context: [ 'T', 'U' ]
    [32m  ✔[0m[90m Should provide better completions with generic context[0m
[0m    Real-World Code Examples[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test-1765614599675.ts (typescript)
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 4 for typescript
[DEBUG] Capture names: decorator, decorator, decorator, decorator
[SemanticAnalyzer] Decorator matches found: 4
[SemanticAnalyzer] Found simple decorator: Component at line 4
[SemanticAnalyzer] Found simple decorator: Input at line 10
[SemanticAnalyzer] Found simple decorator: Output at line 11
[SemanticAnalyzer] Found simple decorator: ViewChild at line 12
[SemanticAnalyzer] Total decorators extracted: 4
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for typescript
[DEBUG] No matches for typescript. Query: [(type_parameter) @generic]...
[SemanticAnalyzer] Extracting decorators for: untitled:test-1765614599675.ts (typescript)
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 4 for typescript
[DEBUG] Capture names: decorator, decorator, decorator, decorator
[SemanticAnalyzer] Decorator matches found: 4
[SemanticAnalyzer] Found simple decorator: Component at line 4
[SemanticAnalyzer] Found simple decorator: Input at line 10
[SemanticAnalyzer] Found simple decorator: Output at line 11
[SemanticAnalyzer] Found simple decorator: ViewChild at line 12
[SemanticAnalyzer] Total decorators extracted: 4
Found decorators: [ 'Component', 'Input', 'Output', 'ViewChild' ]
    [32m  ✔[0m[90m Angular Component with multiple decorators[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test-1765614599689.ts (typescript)
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 7 for typescript
[DEBUG] Capture names: decorator, decorator, decorator, decorator, decorator, decorator, decorator
[SemanticAnalyzer] Decorator matches found: 7
[SemanticAnalyzer] Found simple decorator: Controller at line 4
[SemanticAnalyzer] Found simple decorator: UseGuards at line 5
[SemanticAnalyzer] Found simple decorator: Get at line 9
[SemanticAnalyzer] Found simple decorator: Get at line 14
[SemanticAnalyzer] Found simple decorator: Param at line 15
[SemanticAnalyzer] Found simple decorator: Post at line 19
[SemanticAnalyzer] Found simple decorator: Body at line 20
[SemanticAnalyzer] Total decorators extracted: 7
    [32m  ✔[0m[90m NestJS Controller with decorators[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test-1765614599696.py (python)
[DEBUG] getParser called for python
[DEBUG] Returning cached parser for python
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 4 for python
[DEBUG] Capture names: decorator, decorator, decorator, decorator
[SemanticAnalyzer] Decorator matches found: 4
[SemanticAnalyzer] Found simple decorator: require_http_methods at line 6
[SemanticAnalyzer] Found simple decorator: login_required at line 7
[SemanticAnalyzer] Found simple decorator: csrf_exempt at line 16
[SemanticAnalyzer] Found simple decorator: require_http_methods at line 17
[SemanticAnalyzer] Total decorators extracted: 4
    [32m  ✔[0m[90m Django View with decorators[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test-1765614599701.rs (rust)
[DEBUG] getParser called for rust
[DEBUG] Returning cached parser for rust
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 4 for rust
[DEBUG] Capture names: decorator, decorator, decorator, decorator
[SemanticAnalyzer] Decorator matches found: 4
[SemanticAnalyzer] Found simple decorator: derive at line 3
[SemanticAnalyzer] Found simple decorator: derive at line 10
[SemanticAnalyzer] Found simple decorator: inline at line 18
[SemanticAnalyzer] Found simple decorator: cfg at line 23
[SemanticAnalyzer] Total decorators extracted: 4
    [32m  ✔[0m[90m Rust with derive attributes[0m
[0m    Error Handling[0m
[SemanticAnalyzer] Extracting decorators for: untitled:test-1765614599707.ts (typescript)
[DEBUG] getParser called for typescript
[DEBUG] Returning cached parser for typescript
Language.query is deprecated. Use new Query(language, source) instead.
[DEBUG] matches: 0 for typescript
[DEBUG] No matches for typescript. Query: [(decorator) @decorator]...
[SemanticAnalyzer] Decorator matches found: 0
[SemanticAnalyzer] Tree for typescript: (program (ERROR (identifier) (property_identifier) (ERROR (string (string_fragment)) (comment)) (identifier)))...
[SemanticAnalyzer] Total decorators extracted: 0
    [32m  ✔[0m[90m Should gracefully handle invalid code[0m
    [32m  ✔[0m[90m Should handle unsupported language gracefully[0m
[92m [0m[32m 127 passing[0m[90m (32s)[0m
[36m [0m[36m 30 pending[0m
[0m[0m
[0m  SmartFilter Unit Tests[0m
  [36m  - Should block suggestions inside strings[0m
  [36m  - Should allow suggestions in code[0m
  [36m  - Should block rapid typing[0m
  [36m  - Should always allow Invoke trigger[0m
[0m  ModelManager Unit Tests[0m
[0m    Model Selection[0m
    [32m  ✔[0m[90m should select best model for language[0m
    [32m  ✔[0m[90m should consider hardware requirements[0m
    [32m  ✔[0m[90m should prioritize GPU models when available[0m
[0m    Model Validation[0m
    [32m  ✔[0m[90m should validate model info structure[0m
    [32m  ✔[0m[90m should validate model requirements[0m
    [32m  ✔[0m[90m should validate language support[0m
[0m    Model Metadata[0m
    [32m  ✔[0m[90m should have correct model size[0m
    [32m  ✔[0m[90m should track download status[0m
    [32m  ✔[0m[90m should have model path when downloaded[0m
[0m    Resource Monitoring[0m
    [32m  ✔[0m[90m should calculate memory requirements[0m
    [32m  ✔[0m[90m should identify CPU-only models[0m
[0m  DuplicationDetector[0m
[0m    Exact Duplicate Detection[0m
    [32m  ✔[0m[90m should detect exact duplicate blocks[0m
    [32m  ✔[0m[90m should not flag unique blocks as duplicates[0m
[0m    Near-Duplicate Detection[0m
    [32m  ✔[0m[90m should detect near-duplicate blocks[0m
[0m    Distributed Repetition Detection[0m
    [32m  ✔[0m[90m should detect A-B-A-B patterns[0m
    [32m  ✔[0m[90m should not detect patterns in unique sequences[0m
[0m    Fingerprint Generation[0m
    [32m  ✔[0m[90m should generate consistent fingerprints[0m
    [32m  ✔[0m[90m should generate different fingerprints for different code[0m
[0m    Similarity Calculation[0m
    [32m  ✔[0m[90m should return 1.0 for identical strings[0m
    [32m  ✔[0m[90m should return high similarity for similar strings[0m
    [32m  ✔[0m[90m should return low similarity for different strings[0m
[0m    Code Cleaning[0m
    [32m  ✔[0m[90m should remove duplicate blocks from code[0m
[0m  ASTParser[0m
[0m    JavaScript Parsing[0m
    [36m  - should parse JavaScript functions[0m
    [36m  - should parse JavaScript classes[0m
[0m    Python Parsing[0m
    [36m  - should parse Python functions[0m
    [36m  - should parse Python classes[0m
[0m    Code Block Extraction[0m
    [36m  - should extract function blocks from JavaScript[0m
    [36m  - should extract class blocks from JavaScript[0m
[0m    AST Normalization[0m
    [36m  - should normalize AST for comparison[0m
[0m  ContextEngine Unit Tests[0m
[0m    Context Building[0m
    [32m  ✔[0m[90m should extract imports from code[0m
    [32m  ✔[0m[90m should extract functions from code[0m
    [32m  ✔[0m[90m should extract classes from code[0m
    [32m  ✔[0m[90m should extract comments from code[0m
[0m    Prompt Generation[0m
    [32m  ✔[0m[90m should generate prompt from context[0m
    [32m  ✔[0m[90m should include language in prompt[0m
    [32m  ✔[0m[90m should include relevant imports[0m
    [32m  ✔[0m[90m should use default FIM template when none specified[0m
    [32m  ✔[0m[90m should use StarCoder FIM template[0m
    [32m  ✔[0m[90m should use Qwen FIM template[0m
    [32m  ✔[0m[90m should use CodeGemma FIM template[0m
    [32m  ✔[0m[90m should use Codestral FIM template[0m
[0m    Comment Analysis[0m
    [32m  ✔[0m[90m should extract intent from comments[0m
    [32m  ✔[0m[90m should extract requirements from comments[0m
    [32m  ✔[0m[90m should identify task keywords[0m
[0m    Pattern Extraction[0m
    [32m  ✔[0m[90m should identify naming conventions[0m
    [32m  ✔[0m[90m should identify code style[0m
    [32m  ✔[0m[90m should identify common patterns[0m
[0m  Language Configuration & Context Verifiction[0m
  [36m  - LanguageConfigService should load comment prefixes correctly[0m
  [36m  - ContextEngine should use configured comment prefixes[0m
[0m  Completion Filtering Unit Tests[0m
  [36m  - Should remove markdown code blocks[0m
  [36m  - Should remove single letter tags like <B> <A>[0m
  [36m  - Should remove FIM tags like <PRE> <SUF>[0m
  [36m  - Should preserve valid code that looks like tags but isn't (lowercase)[0m
  [36m  - Should remove extensive leading newlines[0m
  [36m  - Should remove spaced FIM tokens and artifacts[0m
  [36m  - Should remove duplicate consecutive lines[0m
  [36m  - Should remove repeated header blocks[0m
[0m  Event Collectors[0m
[0m    DiagnosticCollector[0m
    [36m  - should emit diagnostic events when diagnostics change[0m
[0m    TerminalCollector[0m
    [36m  - should emit terminal session start event[0m
[0m  Code Action Provider Tests[0m
  [36m  - Should provide Fix Action when diagnostics exist[0m
  [36m  - Should provide Optimize/Explain actions when selection exists[0m
  [36m  - Should return organize imports action even with no selection and no errors[0m
[0m  LanguageConfigService[0m
[LanguageConfigService] Loaded patterns for 6 languages from /Users/ratulhasan/Desktop/Shoaib/inline/packages/extension/src/resources/languages.json
  [32m  ✔[0m[90m should be a singleton[0m
  [32m  ✔[0m[90m should load patterns for typescript[0m
  [32m  ✔[0m[90m should load patterns for python[0m
  [32m  ✔[0m[90m should return fallback for unknown language[0m
  [32m  ✔[0m[90m should have regex strings that act as valid RegExps[0m
[92m [0m[32m 45 passing[0m[90m (14ms)[0m
[36m [0m[36m 26 pending[0m
[92m [0m[32m 0 passing[0m[90m (0ms)[0m
[90m[main 2025-12-13T08:29:59.765Z][0m Extension host with pid 69245 exited with code: 0, signal: unknown.
[91m[main 2025-12-13T08:29:59.784Z][0m [UtilityProcessWorker]: terminated unexpectedly with code 1831908736, signal: unknown
Exit code:   0
