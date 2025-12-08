import * as assert from 'assert';
import * as vscode from 'vscode';
import { TreeSitterService } from '../../../src/analysis/tree-sitter-service';
import { SemanticAnalyzer } from '../../../src/analysis/semantic-analyzer';

suite('Tree-sitter E2E Tests', () => {
    let treeSitterService: TreeSitterService;
    let semanticAnalyzer: SemanticAnalyzer;

    suiteSetup(async function() {
        this.timeout(30000); // 30 seconds for initialization
        
        // Get extension context
        const extension = vscode.extensions.getExtension('your-extension-id');
        if (!extension) {
            throw new Error('Extension not found');
        }
        
        await extension.activate();
        
        treeSitterService = TreeSitterService.getInstance();
        semanticAnalyzer = new SemanticAnalyzer();
        
        // Initialize Tree-sitter
        const context = (global as any).extensionContext;
        if (context) {
            await treeSitterService.initialize(context);
        }
    });

    suite('TypeScript Decorator Detection', () => {
        test('Should detect @Component decorator', async () => {
            const code = `
@Component({
  selector: 'app-root',
  template: '<div>Hello</div>'
})
class AppComponent {
  @Input() name: string;
  @Output() change = new EventEmitter();
}
            `;

            const document = await createTestDocument(code, 'typescript');
            const decorators = await semanticAnalyzer.extractDecorators(document);

            assert.strictEqual(decorators.length, 3, 'Should find 3 decorators');
            assert.strictEqual(decorators[0].name, 'Component');
            assert.strictEqual(decorators[1].name, 'Input');
            assert.strictEqual(decorators[2].name, 'Output');
        });

        test('Should detect @Injectable decorator', async () => {
            const code = `
@Injectable({
  providedIn: 'root'
})
class UserService {
  constructor() {}
}
            `;

            const document = await createTestDocument(code, 'typescript');
            const decorators = await semanticAnalyzer.extractDecorators(document);

            assert.strictEqual(decorators.length, 1);
            assert.strictEqual(decorators[0].name, 'Injectable');
            assert.ok(decorators[0].arguments?.includes('providedIn'));
        });

        test('Should detect multiple decorators on same element', async () => {
            const code = `
class MyClass {
  @Required()
  @MinLength(5)
  @MaxLength(100)
  name: string;
}
            `;

            const document = await createTestDocument(code, 'typescript');
            const decorators = await semanticAnalyzer.extractDecorators(document);

            assert.strictEqual(decorators.length, 3);
        });
    });

    suite('TypeScript Generic Extraction', () => {
        test('Should extract simple generic', async () => {
            const code = `
function identity<T>(arg: T): T {
  return arg;
}
            `;

            const document = await createTestDocument(code, 'typescript');
            const generics = await semanticAnalyzer.extractGenerics(document);

            assert.strictEqual(generics.length, 1);
            assert.strictEqual(generics[0].name, 'T');
        });

        test('Should extract generic with constraint', async () => {
            const code = `
function merge<T extends object, U extends object>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}
            `;

            const document = await createTestDocument(code, 'typescript');
            const generics = await semanticAnalyzer.extractGenerics(document);

            assert.ok(generics.length >= 2);
            const tGeneric = generics.find(g => g.name === 'T');
            const uGeneric = generics.find(g => g.name === 'U');
            
            assert.ok(tGeneric);
            assert.ok(uGeneric);
            assert.ok(tGeneric?.constraint?.includes('object'));
            assert.ok(uGeneric?.constraint?.includes('object'));
        });

        test('Should extract class generics', async () => {
            const code = `
class Container<T extends Serializable> {
  private value: T;
  
  constructor(value: T) {
    this.value = value;
  }
}
            `;

            const document = await createTestDocument(code, 'typescript');
            const generics = await semanticAnalyzer.extractGenerics(document);

            assert.ok(generics.length >= 1);
            const tGeneric = generics.find(g => g.name === 'T');
            assert.ok(tGeneric);
            assert.ok(tGeneric?.constraint?.includes('Serializable'));
        });
    });

    suite('Python Decorator Detection', () => {
        test('Should detect @property decorator', async () => {
            const code = `
class MyClass:
    @property
    def value(self):
        return self._value
    
    @value.setter
    def value(self, val):
        self._value = val
            `;

            const document = await createTestDocument(code, 'python');
            const decorators = await semanticAnalyzer.extractDecorators(document);

            assert.ok(decorators.length >= 1);
            const propertyDecorator = decorators.find(d => d.name === 'property');
            assert.ok(propertyDecorator);
        });

        test('Should detect Flask route decorator', async () => {
            const code = `
@app.route('/api/users')
@login_required
def get_users():
    return jsonify(users)
            `;

            const document = await createTestDocument(code, 'python');
            const decorators = await semanticAnalyzer.extractDecorators(document);

            assert.ok(decorators.length >= 2);
        });

        test('Should detect decorator with arguments', async () => {
            const code = `
@app.route('/api/users/<int:user_id>', methods=['GET', 'POST'])
def user_detail(user_id):
    pass
            `;

            const document = await createTestDocument(code, 'python');
            const decorators = await semanticAnalyzer.extractDecorators(document);

            assert.ok(decorators.length >= 1);
            const routeDecorator = decorators.find(d => d.name.includes('route'));
            assert.ok(routeDecorator);
        });
    });

    suite('Rust Attribute Detection', () => {
        test('Should detect #[derive] attribute', async () => {
            const code = `
#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}
            `;

            const document = await createTestDocument(code, 'rust');
            const decorators = await semanticAnalyzer.extractDecorators(document);

            assert.ok(decorators.length >= 1);
            const deriveAttr = decorators.find(d => d.name === 'derive');
            assert.ok(deriveAttr);
        });

        test('Should detect #[test] attribute', async () => {
            const code = `
#[test]
fn test_addition() {
    assert_eq!(2 + 2, 4);
}

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert!(true);
    }
}
            `;

            const document = await createTestDocument(code, 'rust');
            const decorators = await semanticAnalyzer.extractDecorators(document);

            assert.ok(decorators.length >= 2);
        });
    });

    suite('Java Annotation Detection', () => {
        test('Should detect @Override annotation', async () => {
            const code = `
public class MyClass extends BaseClass {
    @Override
    public void method() {
        super.method();
    }
}
            `;

            const document = await createTestDocument(code, 'java');
            const decorators = await semanticAnalyzer.extractDecorators(document);

            assert.ok(decorators.length >= 1);
            const overrideAnnotation = decorators.find(d => d.name === 'Override');
            assert.ok(overrideAnnotation);
        });

        test('Should detect Spring annotations', async () => {
            const code = `
@RestController
@RequestMapping("/api")
public class UserController {
    
    @GetMapping("/users")
    public List<User> getUsers() {
        return userService.findAll();
    }
    
    @PostMapping("/users")
    public User createUser(@RequestBody User user) {
        return userService.save(user);
    }
}
            `;

            const document = await createTestDocument(code, 'java');
            const decorators = await semanticAnalyzer.extractDecorators(document);

            assert.ok(decorators.length >= 4);
        });
    });

    suite('Multi-Language Parsing', () => {
        test('Should parse TypeScript correctly', async () => {
            const code = `
import { Component } from '@angular/core';

@Component({
  selector: 'app-root'
})
export class AppComponent {
  title = 'My App';
}
            `;

            const document = await createTestDocument(code, 'typescript');
            const tree = await treeSitterService.parse(code, 'typescript');

            assert.ok(tree, 'Should parse TypeScript');
            assert.ok(tree.rootNode, 'Should have root node');
        });

        test('Should parse Python correctly', async () => {
            const code = `
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

class Calculator:
    def add(self, a, b):
        return a + b
            `;

            const document = await createTestDocument(code, 'python');
            const tree = await treeSitterService.parse(code, 'python');

            assert.ok(tree, 'Should parse Python');
            assert.ok(tree.rootNode, 'Should have root node');
        });

        test('Should parse Rust correctly', async () => {
            const code = `
fn main() {
    println!("Hello, world!");
}

struct Point {
    x: i32,
    y: i32,
}

impl Point {
    fn new(x: i32, y: i32) -> Self {
        Point { x, y }
    }
}
            `;

            const document = await createTestDocument(code, 'rust');
            const tree = await treeSitterService.parse(code, 'rust');

            assert.ok(tree, 'Should parse Rust');
            assert.ok(tree.rootNode, 'Should have root node');
        });

        test('Should parse Java correctly', async () => {
            const code = `
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
            `;

            const document = await createTestDocument(code, 'java');
            const tree = await treeSitterService.parse(code, 'java');

            assert.ok(tree, 'Should parse Java');
            assert.ok(tree.rootNode, 'Should have root node');
        });

        test('Should parse Go correctly', async () => {
            const code = `
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}

type Point struct {
    X int
    Y int
}
            `;

            const document = await createTestDocument(code, 'go');
            const tree = await treeSitterService.parse(code, 'go');

            assert.ok(tree, 'Should parse Go');
            assert.ok(tree.rootNode, 'Should have root node');
        });
    });

    suite('Performance Tests', () => {
        test('Should parse large file quickly', async function() {
            this.timeout(5000);
            
            // Generate large TypeScript file
            const lines = [];
            for (let i = 0; i < 1000; i++) {
                lines.push(`
@Component({ selector: 'comp-${i}' })
class Component${i} {
  @Input() prop${i}: string;
  method${i}() { return ${i}; }
}
                `);
            }
            const code = lines.join('\n');

            const start = Date.now();
            const document = await createTestDocument(code, 'typescript');
            const tree = await treeSitterService.parse(code, 'typescript');
            const elapsed = Date.now() - start;

            assert.ok(tree, 'Should parse large file');
            assert.ok(elapsed < 1000, `Should parse in <1s (took ${elapsed}ms)`);
        });

        test('Should cache parsers efficiently', async () => {
            const code = 'const x = 1;';
            
            // First parse
            const start1 = Date.now();
            await treeSitterService.parse(code, 'typescript');
            const elapsed1 = Date.now() - start1;
            
            // Second parse (should use cached parser)
            const start2 = Date.now();
            await treeSitterService.parse(code, 'typescript');
            const elapsed2 = Date.now() - start2;
            
            assert.ok(elapsed2 < elapsed1, 'Cached parse should be faster');
        });
    });
});

// Helper function to create test document
async function createTestDocument(content: string, languageId: string): Promise<vscode.TextDocument> {
    const uri = vscode.Uri.parse(`untitled:test.${getExtension(languageId)}`);
    const document = await vscode.workspace.openTextDocument(uri);
    
    const edit = new vscode.WorkspaceEdit();
    edit.insert(uri, new vscode.Position(0, 0), content);
    await vscode.workspace.applyEdit(edit);
    
    return document;
}

function getExtension(languageId: string): string {
    const extensions: Record<string, string> = {
        'typescript': 'ts',
        'javascript': 'js',
        'python': 'py',
        'rust': 'rs',
        'java': 'java',
        'go': 'go',
        'cpp': 'cpp',
        'c': 'c',
        'ruby': 'rb',
        'php': 'php',
        'csharp': 'cs',
        'swift': 'swift',
        'kotlin': 'kt',
        'scala': 'scala',
        'solidity': 'sol',
        'elixir': 'ex'
    };
    return extensions[languageId] || 'txt';
}
