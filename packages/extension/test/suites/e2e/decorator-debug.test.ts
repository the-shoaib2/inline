import * as assert from 'assert';
import * as vscode from 'vscode';
import { SemanticAnalyzer } from '@inline/language/analysis/semantic-analyzer';
import { TreeSitterService } from '@inline/language/parsers/tree-sitter-service';

suite('Decorator Extraction Debug Test', () => {
    let semanticAnalyzer: SemanticAnalyzer;
    let treeSitterService: TreeSitterService;

    suiteSetup(async function() {
        this.timeout(30000);
        
        // Get extension context
        const extension = vscode.extensions.getExtension('inline.inline');
        if (!extension) {
            throw new Error('Extension not found');
        }
        
        await extension.activate();
        
        // Initialize Tree-sitter
        treeSitterService = TreeSitterService.getInstance();
        const mockContext = {
            extensionUri: extension.extensionUri,
            extensionPath: extension.extensionPath
        } as vscode.ExtensionContext;
        
        await treeSitterService.initialize(mockContext);
        semanticAnalyzer = new SemanticAnalyzer();
    });

    test('Debug: Extract decorators from TypeScript', async () => {
        const code = `
@Component({
    selector: 'app-test',
    template: '<div>Test</div>'
})
export class TestComponent {
    @Input() name: string;
    @Output() clicked = new EventEmitter();
}
        `;

        console.log('=== STARTING DECORATOR EXTRACTION DEBUG TEST ===');
        console.log('Creating test document...');
        
        const uri = vscode.Uri.parse('untitled:test-decorators.ts');
        const document = await vscode.workspace.openTextDocument({
            language: 'typescript',
            content: code
        });

        console.log('Document created:', {
            uri: document.uri.toString(),
            languageId: document.languageId,
            lineCount: document.lineCount,
            length: document.getText().length
        });

        console.log('Calling extractDecorators...');
        const decorators = await semanticAnalyzer.extractDecorators(document);

        console.log('=== EXTRACTION COMPLETE ===');
        console.log('Decorators found:', decorators.length);
        if (decorators.length > 0) {
            decorators.forEach((dec, i) => {
                console.log(`  ${i + 1}. ${dec.name} at line ${dec.lineNumber}`);
                if (dec.arguments) {
                    console.log(`     Args: ${dec.arguments}`);
                }
            });
        }

        // This test is for debugging, so we don't assert - just log
        console.log('Test complete. Check logs above for details.');
    });
});
