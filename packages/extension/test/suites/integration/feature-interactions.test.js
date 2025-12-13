"use strict";
/**
 * Integration Tests
 * Tests feature interactions and workflows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runIntegrationTests = runIntegrationTests;
const crud_generator_1 = require("@inline/completion/generation/crud-generator");
const api_generator_1 = require("@inline/completion/generation/api-generator");
const dto_generator_1 = require("@inline/completion/generation/dto-generator");
const mock_data_generator_1 = require("@inline/completion/generation/mock-data-generator");
const syntax_validator_1 = require("@inline/language/parsers/syntax-validator");
const complexity_analyzer_1 = require("@inline/language/validation/complexity-analyzer");
async function runIntegrationTests() {
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
    const crudGen = new crud_generator_1.CRUDGenerator({});
    const apiGen = new api_generator_1.APIGenerator();
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
    const dtoGen = new dto_generator_1.DTOGenerator();
    const validator = new syntax_validator_1.SyntaxValidator();
    // Generate DTO
    const dto = dtoGen.generateDTO('User', [
        { name: 'email', type: 'string' },
        { name: 'age', type: 'number' }
    ], 'typescript');
    assert(dto.includes('UserDTO'), 'Should generate DTO');
    assert(dto.includes('email: string'), 'Should include email field');
    // Validate generated code
    const mockDoc = {
        getText: () => dto,
        languageId: 'typescript',
        lineAt: (line) => ({ text: dto.split('\n')[line] || '' })
    };
    const diagnostics = await validator.validateSyntax(mockDoc);
    // Generated code should have minimal syntax issues
    assert(diagnostics.length < 5, 'Generated DTO should have minimal syntax issues');
    console.log('  ✓ DTO generation produces valid code');
}
async function testMockDataWithDTO() {
    console.log('Testing Mock Data + DTO Integration...');
    const mockGen = new mock_data_generator_1.MockDataGenerator();
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
    const crudGen = new crud_generator_1.CRUDGenerator({});
    const validator = new syntax_validator_1.SyntaxValidator();
    // Generate CRUD code
    const code = await crudGen.generateCRUD('Order', [
        { name: 'id', type: 'number' },
        { name: 'total', type: 'number' }
    ], 'typescript');
    // Validate generated code
    const mockDoc = {
        getText: () => code,
        languageId: 'typescript',
        lineAt: (line) => ({ text: code.split('\n')[line] || '' })
    };
    const diagnostics = await validator.validateSyntax(mockDoc);
    // Generated code should be syntactically valid
    const criticalErrors = diagnostics.filter((d) => d.message.includes('error'));
    assert(criticalErrors.length === 0, 'Generated code should have no critical errors');
    console.log('  ✓ Generated code passes validation');
}
async function testComplexityAnalysisWorkflow() {
    console.log('Testing Complexity Analysis Workflow...');
    const analyzer = new complexity_analyzer_1.ComplexityAnalyzer();
    const crudGen = new crud_generator_1.CRUDGenerator({});
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
    assert(analysis.timeComplexity.includes('O(1)') || analysis.timeComplexity.includes('O(n)'), 'CRUD operations should be efficient');
    console.log('  ✓ Complexity analysis on generated code');
}
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}
// Run tests if executed directly
if (require.main === module) {
    runIntegrationTests();
}
//# sourceMappingURL=feature-interactions.test.js.map