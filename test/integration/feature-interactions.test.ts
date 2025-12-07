/**
 * Integration Tests
 * Tests feature interactions and workflows
 */

import { CRUDGenerator } from '../../src/features/code-generation/crud-generator';
import { APIGenerator } from '../../src/features/code-generation/api-generator';
import { DTOGenerator } from '../../src/features/code-generation/dto-generator';
import { MockDataGenerator } from '../../src/features/code-generation/mock-data-generator';
import { SyntaxValidator } from '../../src/analysis/syntax-validator';
import { ComplexityAnalyzer } from '../../src/analysis/complexity-analyzer';

export async function runIntegrationTests() {
    console.log('🧪 Running Integration Tests...\n');

    await testCRUDWithAPI();
    await testDTOWithValidation();
    await testMockDataWithDTO();
    await testGeneratedCodeValidation();
    await testComplexityAnalysisWorkflow();

    console.log('\n✅ All Integration Tests Passed!\n');
}

async function testCRUDWithAPI() {
    console.log('Testing CRUD + API Integration...');
    
    const crudGen = new CRUDGenerator({} as any);
    const apiGen = new APIGenerator();
    
    const entity = 'Product';
    const fields = [
        { name: 'id', type: 'number' },
        { name: 'name', type: 'string' },
        { name: 'price', type: 'number' }
    ];
    
    // Generate CRUD operations
    const crud = await crudGen.generateCRUD(entity, fields, 'typescript');
    assert(crud.includes('ProductService'), 'CRUD should include service class');
    assert(crud.includes('create'), 'CRUD should include create method');
    
    // Generate API endpoints
    const api = apiGen.generateRESTAPI(entity, fields, 'express');
    assert(api.includes('/products'), 'API should include resource route');
    assert(api.includes('ProductService'), 'API should reference service');
    
    // Verify they work together
    assert(crud.includes('create') && api.includes('router.post'), 'CRUD and API should be compatible');
    
    console.log('  ✓ CRUD and API work together');
}

async function testDTOWithValidation() {
    console.log('Testing DTO + Validation Integration...');
    
    const dtoGen = new DTOGenerator();
    const validator = new SyntaxValidator();
    
    // Generate DTO
    const dto = dtoGen.generateDTO('User', [
        { name: 'email', type: 'string' },
        { name: 'age', type: 'number' }
    ], 'typescript');
    
    assert(dto.includes('UserDTO'), 'Should generate DTO');
    assert(dto.includes('email: string'), 'Should include email field');
    
    // Validate generated code
    const mockDoc: any = {
        getText: () => dto,
        languageId: 'typescript',
        lineAt: (line: number) => ({ text: dto.split('\n')[line] || '' })
    };
    
    const diagnostics = await validator.validateSyntax(mockDoc);
    // Generated code should have minimal syntax issues
    assert(diagnostics.length < 5, 'Generated DTO should have minimal syntax issues');
    
    console.log('  ✓ DTO generation produces valid code');
}

async function testMockDataWithDTO() {
    console.log('Testing Mock Data + DTO Integration...');
    
    const mockGen = new MockDataGenerator();
    
    // Generate mock users
    const users = mockGen.generateMockData('user', 10);
    
    assert(users.length === 10, 'Should generate 10 users');
    
    // Verify structure matches DTO expectations
    users.forEach(user => {
        assert(user.hasOwnProperty('email'), 'User should have email');
        assert(typeof user.email === 'string', 'Email should be string');
        assert(user.email.includes('@'), 'Email should be valid format');
        assert(user.hasOwnProperty('firstName'), 'User should have firstName');
        assert(user.hasOwnProperty('lastName'), 'User should have lastName');
    });
    
    console.log('  ✓ Mock data matches DTO structure');
}

async function testGeneratedCodeValidation() {
    console.log('Testing Generated Code Validation...');
    
    const crudGen = new CRUDGenerator({} as any);
    const validator = new SyntaxValidator();
    
    // Generate CRUD code
    const code = await crudGen.generateCRUD('Order', [
        { name: 'id', type: 'number' },
        { name: 'total', type: 'number' }
    ], 'typescript');
    
    // Validate generated code
    const mockDoc: any = {
        getText: () => code,
        languageId: 'typescript',
        lineAt: (line: number) => ({ text: code.split('\n')[line] || '' })
    };
    
    const diagnostics = await validator.validateSyntax(mockDoc);
    
    // Generated code should be syntactically valid
    const criticalErrors = diagnostics.filter((d: any) => d.message.includes('error'));
    assert(criticalErrors.length === 0, 'Generated code should have no critical errors');
    
    console.log('  ✓ Generated code passes validation');
}

async function testComplexityAnalysisWorkflow() {
    console.log('Testing Complexity Analysis Workflow...');
    
    const analyzer = new ComplexityAnalyzer();
    const crudGen = new CRUDGenerator({} as any);
    
    // Generate CRUD code
    const code = await crudGen.generateCRUD('Item', [
        { name: 'id', type: 'number' }
    ], 'typescript');
    
    // Analyze complexity
    const analysis = analyzer.analyzeComplexity(code, 'typescript');
    
    assert(analysis.timeComplexity !== undefined && analysis.timeComplexity.length > 0, 'Should provide time complexity');
    assert(analysis.spaceComplexity !== undefined && analysis.spaceComplexity.length > 0, 'Should provide space complexity');
    assert(analysis.explanation !== undefined && analysis.explanation.length > 0, 'Should provide explanation');
    
    // CRUD operations should be efficient (O(n) or better)
    assert(
        analysis.timeComplexity.includes('O(1)') || analysis.timeComplexity.includes('O(n)'),
        'CRUD operations should be efficient'
    );
    
    console.log('  ✓ Complexity analysis on generated code');
}

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

// Run tests if executed directly
if (require.main === module) {
    runIntegrationTests();
}
