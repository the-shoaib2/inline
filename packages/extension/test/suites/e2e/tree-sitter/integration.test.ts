import * as assert from 'assert';
import * as vscode from 'vscode';
import { ContextEngine } from '@context/context-engine';
import { SemanticAnalyzer } from '@language/analysis/semantic-analyzer';

suite('Tree-sitter Integration with LLM', () => {
    let contextEngine: ContextEngine;
    let semanticAnalyzer: SemanticAnalyzer;

    suiteSetup(async function() {
        this.timeout(60000); // 60 seconds for LLM initialization
        
        contextEngine = new ContextEngine();
        semanticAnalyzer = new SemanticAnalyzer();
        
        // Wait for extension to activate
        await new Promise(resolve => setTimeout(resolve, 2000));
    });

    suite('Context Building with Decorators', () => {
        test('Should include decorators in context for TypeScript', async () => {
            const code = `
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'user-profile',
  template: '<div>{{name}}</div>'
})
export class UserProfileComponent {
  @Input() name: string;
  @Output() nameChange = new EventEmitter<string>();
  
  updateName(newName: string) {
    this.name = newName;
    this.nameChange.emit(newName);
  }
}
            `;

            const document = await createTestDocument(code, 'typescript');
            const position = new vscode.Position(10, 0); // Inside updateName method
            
            const context = await contextEngine.buildContext(document, position);

            // Verify decorators are included
            assert.ok(context.decorators, 'Context should have decorators');
            assert.ok(context.decorators.length >= 3, 'Should find at least 3 decorators');
            
            const componentDecorator = context.decorators.find(d => d.name === 'Component');
            const inputDecorator = context.decorators.find(d => d.name === 'Input');
            const outputDecorator = context.decorators.find(d => d.name === 'Output');
            
            assert.ok(componentDecorator, 'Should find @Component');
            assert.ok(inputDecorator, 'Should find @Input');
            assert.ok(outputDecorator, 'Should find @Output');
        });

        test('Should include decorators in context for Python', async () => {
            const code = `
from flask import Flask, jsonify
from flask_login import login_required

app = Flask(__name__)

@app.route('/api/users')
@login_required
def get_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])

@app.route('/api/users/<int:user_id>')
def get_user(user_id):
    user = User.query.get(user_id)
    return jsonify(user.to_dict())
            `;

            const document = await createTestDocument(code, 'python');
            const position = new vscode.Position(8, 0);
            
            const context = await contextEngine.buildContext(document, position);

            assert.ok(context.decorators, 'Context should have decorators');
            assert.ok(context.decorators.length >= 2, 'Should find at least 2 decorators');
        });
    });

    suite('Context Building with Generics', () => {
        test('Should include generics in context for TypeScript', async () => {
            const code = `
interface Repository<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
}

class UserRepository implements Repository<User> {
  async findAll(): Promise<User[]> {
    // Implementation
    return [];
  }
  
  async findById(id: string): Promise<User | null> {
    // Implementation
    return null;
  }
  
  async save(entity: User): Promise<User> {
    // Implementation
    return entity;
  }
}
            `;

            const document = await createTestDocument(code, 'typescript');
            const position = new vscode.Position(10, 0);
            
            const context = await contextEngine.buildContext(document, position);

            assert.ok(context.generics, 'Context should have generics');
            assert.ok(context.generics.length >= 1, 'Should find at least 1 generic');
            
            const tGeneric = context.generics.find(g => g.name === 'T');
            assert.ok(tGeneric, 'Should find generic T');
        });

        test('Should include generics in context for Java', async () => {
            const code = `
import java.util.List;
import java.util.Optional;

public class GenericRepository<T extends Entity> {
    private List<T> items;
    
    public Optional<T> findById(Long id) {
        return items.stream()
            .filter(item -> item.getId().equals(id))
            .findFirst();
    }
    
    public List<T> findAll() {
        return new ArrayList<>(items);
    }
}
            `;

            const document = await createTestDocument(code, 'java');
            const position = new vscode.Position(8, 0);
            
            const context = await contextEngine.buildContext(document, position);

            assert.ok(context.generics, 'Context should have generics');
        });
    });

    suite('Code Completion with Enhanced Context', () => {
        test('Should provide better completions with decorator context', async function() {
            this.timeout(30000); // 30 seconds for LLM response
            
            const code = `
import { Component, Input } from '@angular/core';

@Component({
  selector: 'user-card',
  template: '<div>{{user.name}}</div>'
})
export class UserCardComponent {
  @Input() user: User;
  
  // Add a method to update user
  
}
            `;

            const document = await createTestDocument(code, 'typescript');
            const position = new vscode.Position(10, 0); // After comment
            
            // Trigger completion
            const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                document.uri,
                position
            );

            // Context should include decorator information
            const context = await contextEngine.buildContext(document, position);
            assert.ok(context.decorators.length > 0, 'Should have decorator context');
            
            console.log('Decorators in context:', context.decorators.map(d => d.name));
        });

        test('Should provide better completions with generic context', async function() {
            this.timeout(30000);
            
            const code = `
function map<T, U>(array: T[], transform: (item: T) => U): U[] {
  const result: U[] = [];
  for (const item of array) {
    result.push(transform(item));
  }
  return result;
}

// Use the map function
const numbers = [1, 2, 3, 4, 5];
const strings = map(numbers, (n) => 
            `;

            const document = await createTestDocument(code, 'typescript');
            const position = new vscode.Position(11, 40); // After arrow
            
            const context = await contextEngine.buildContext(document, position);
            assert.ok(context.generics.length > 0, 'Should have generic context');
            
            console.log('Generics in context:', context.generics.map(g => `${g.name}${g.constraint ? ` extends ${g.constraint}` : ''}`));
        });
    });

    suite('Real-World Code Examples', () => {
        test('Angular Component with multiple decorators', async () => {
            const code = `
import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit {
  @Input() user: User;
  @Output() userSaved = new EventEmitter<User>();
  @ViewChild('form') formElement: ElementRef;
  
  userForm: FormGroup;
  
  constructor(private fb: FormBuilder) {}
  
  ngOnInit() {
    this.userForm = this.fb.group({
      name: [this.user?.name || '', Validators.required],
      email: [this.user?.email || '', [Validators.required, Validators.email]],
      age: [this.user?.age || 0, [Validators.min(0), Validators.max(150)]]
    });
  }
  
  onSubmit() {
    if (this.userForm.valid) {
      this.userSaved.emit(this.userForm.value);
    }
  }
}
            `;

            const document = await createTestDocument(code, 'typescript');
            const position = new vscode.Position(15, 0);
            
            const context = await contextEngine.buildContext(document, position);
            const decorators = await semanticAnalyzer.extractDecorators(document);

            assert.ok(decorators.length >= 4, `Should find at least 4 decorators, found ${decorators.length}`);
            console.log('Found decorators:', decorators.map(d => d.name));
        });

        test('NestJS Controller with decorators', async () => {
            const code = `
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private usersService: UsersService) {}
  
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }
  
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
  
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
            `;

            const document = await createTestDocument(code, 'typescript');
            const decorators = await semanticAnalyzer.extractDecorators(document);

            assert.ok(decorators.length >= 6, `Should find at least 6 decorators, found ${decorators.length}`);
            
            const controllerDecorator = decorators.find(d => d.name === 'Controller');
            const getDecorators = decorators.filter(d => d.name === 'Get');
            const postDecorator = decorators.find(d => d.name === 'Post');
            
            assert.ok(controllerDecorator, 'Should find @Controller');
            assert.ok(getDecorators.length >= 2, 'Should find @Get decorators');
            assert.ok(postDecorator, 'Should find @Post');
        });

        test('Django View with decorators', async () => {
            const code = `
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt

@require_http_methods(["GET", "POST"])
@login_required
def user_list(request):
    if request.method == 'GET':
        users = User.objects.all()
        return JsonResponse({'users': list(users.values())})
    elif request.method == 'POST':
        # Create user
        pass

@csrf_exempt
@require_http_methods(["POST"])
def api_webhook(request):
    # Handle webhook
    pass
            `;

            const document = await createTestDocument(code, 'python');
            const decorators = await semanticAnalyzer.extractDecorators(document);

            assert.ok(decorators.length >= 4, `Should find at least 4 decorators, found ${decorators.length}`);
        });

        test('Rust with derive attributes', async () => {
            const code = `
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub email: String,
}

#[derive(Debug)]
pub enum UserRole {
    Admin,
    User,
    Guest,
}

impl User {
    #[inline]
    pub fn new(id: u64, name: String, email: String) -> Self {
        User { id, name, email }
    }
    
    #[cfg(test)]
    fn test_helper() -> Self {
        User::new(1, "Test".to_string(), "test@example.com".to_string())
    }
}
            `;

            const document = await createTestDocument(code, 'rust');
            const decorators = await semanticAnalyzer.extractDecorators(document);

            assert.ok(decorators.length >= 3, `Should find at least 3 attributes, found ${decorators.length}`);
        });
    });

    suite('Error Handling', () => {
        test('Should gracefully handle invalid code', async () => {
            const code = `
@Component({
  selector: 'broken'
  // Missing closing brace
export class BrokenComponent {
            `;

            const document = await createTestDocument(code, 'typescript');
            
            // Should not throw
            const decorators = await semanticAnalyzer.extractDecorators(document);
            
            // May or may not find decorators in broken code, but shouldn't crash
            assert.ok(Array.isArray(decorators), 'Should return array even for broken code');
        });

        test('Should handle unsupported language gracefully', async () => {
            const code = 'Some random text';
            const document = await createTestDocument(code, 'plaintext');
            
            const decorators = await semanticAnalyzer.extractDecorators(document);
            const generics = await semanticAnalyzer.extractGenerics(document);
            
            assert.strictEqual(decorators.length, 0, 'Should return empty for unsupported language');
            assert.strictEqual(generics.length, 0, 'Should return empty for unsupported language');
        });
    });
});

// Helper function
async function createTestDocument(content: string, languageId: string): Promise<vscode.TextDocument> {
    const extensions: Record<string, string> = {
        'typescript': 'ts',
        'javascript': 'js',
        'python': 'py',
        'rust': 'rs',
        'java': 'java',
        'go': 'go',
        'plaintext': 'txt'
    };
    
    const ext = extensions[languageId] || 'txt';
    const uri = vscode.Uri.parse(`untitled:test-${Date.now()}.${ext}`);
    const document = await vscode.workspace.openTextDocument(uri);
    
    const edit = new vscode.WorkspaceEdit();
    edit.insert(uri, new vscode.Position(0, 0), content);
    await vscode.workspace.applyEdit(edit);
    
    return document;
}
