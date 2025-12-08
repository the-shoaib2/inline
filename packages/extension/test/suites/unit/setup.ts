import moduleAlias from 'module-alias';
import * as path from 'path';

// Register alias for vscode
moduleAlias.addAlias('vscode', path.join(process.cwd(), 'test/unit/vscode-mock.ts'));
