/**
 * Unit Tests for Validators and Analyzers
 */

import { SyntaxValidator } from '@inline/language/parsers/syntax-validator';
import { SemanticValidator } from '@inline/language/validation/semantic-validator';
import { TypeChecker } from '@inline/language/analysis/type-checker';
import { Linter } from '@inline/language/validation/linter';
import { ComplexityAnalyzer } from '@inline/language/validation/complexity-analyzer';
import { VulnerabilityScanner } from '@inline/shared';

export async function runValidatorTests() {
    console.log('🧪 Running Validator Tests...\n');

    await testSyntaxValidator();
    await testSemanticValidator();
    await testTypeChecker();
    await testLinter();
    await testComplexityAnalyzer();
    await testVulnerabilityScanner();

    console.log('\n✅ All Validator Tests Passed!\n');
}

async function testSyntaxValidator() {
    console.log('Testing SyntaxValidator...');
    const validator = new SyntaxValidator();

    // Test missing semicolons
    const mockDoc1 = createMockDocument('const x = 5\nconst y = 10', 'typescript');
    const diagnostics1 = await validator.validateSyntax(mockDoc1);
    assert(diagnostics1.length > 0, 'Should detect missing semicolons');

    console.log('  ✓ Missing semicolon detection');

    // Test unclosed brackets
    const mockDoc2 = createMockDocument('function test() {\n  console.log("test")', 'javascript');
    const diagnostics2 = await validator.validateSyntax(mockDoc2);
    assert(diagnostics2.some((d: any) => d.message.includes('bracket')), 'Should detect unclosed brackets');

    console.log('  ✓ Unclosed bracket detection');
}

async function testSemanticValidator() {
    console.log('Testing SemanticValidator...');
    const validator = new SemanticValidator();

    // Test unreachable code
    const mockDoc = createMockDocument('function test() {\n  return 42;\n  console.log("unreachable");\n}', 'typescript');
    const diagnostics = await validator.validateSemantics(mockDoc);
    assert(diagnostics.some((d: any) => d.message.includes('Unreachable')), 'Should detect unreachable code');

    console.log('  ✓ Unreachable code detection');
}

async function testTypeChecker() {
    console.log('Testing TypeChecker...');
    const checker = new TypeChecker();

    // Test type mismatches
    const mockDoc = createMockDocument('const x: string = 123;', 'typescript');
    const diagnostics = await checker.checkTypes(mockDoc);
    assert(diagnostics.some((d: any) => d.message.includes('not assignable')), 'Should detect type mismatches');

    console.log('  ✓ Type mismatch detection');
}

async function testLinter() {
    console.log('Testing Linter...');
    const linter = new Linter();

    // Test long lines
    const longLine = 'const x = ' + 'a'.repeat(150) + ';';
    const mockDoc1 = createMockDocument(longLine, 'typescript');
    const diagnostics1 = await linter.lint(mockDoc1);
    assert(diagnostics1.some((d: any) => d.message.includes('exceeds maximum length')), 'Should detect long lines');

    console.log('  ✓ Long line detection');

    // Test console.log
    const mockDoc2 = createMockDocument('console.log("debug");', 'typescript');
    const diagnostics2 = await linter.lint(mockDoc2);
    assert(diagnostics2.some((d: any) => d.message.includes('console.log')), 'Should detect console.log');

    console.log('  ✓ console.log detection');

    // Test var usage
    const mockDoc3 = createMockDocument('var x = 5;', 'typescript');
    const diagnostics3 = await linter.lint(mockDoc3);
    assert(diagnostics3.some((d: any) => d.message.includes('let or const')), 'Should detect var usage');

    console.log('  ✓ var usage detection');
}

function testComplexityAnalyzer() {
    console.log('Testing ComplexityAnalyzer...');
    const analyzer = new ComplexityAnalyzer();

    // Test O(1) complexity
    const simple = 'function simple() { return 42; }';
    const result1 = analyzer.analyzeComplexity(simple, 'typescript');
    assert(result1.timeComplexity === 'O(1)', 'Should detect O(1) complexity');

    console.log('  ✓ O(1) complexity detection');

    // Test O(n) complexity
    const linear = 'for (let i = 0; i < n; i++) { sum += i; }';
    const result2 = analyzer.analyzeComplexity(linear, 'typescript');
    assert(result2.timeComplexity === 'O(n)', 'Should detect O(n) complexity');

    console.log('  ✓ O(n) complexity detection');

    // Test O(n²) complexity
    const quadratic = 'for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) { } }';
    const result3 = analyzer.analyzeComplexity(quadratic, 'typescript');
    assert(result3.timeComplexity === 'O(n²)', 'Should detect O(n²) complexity');
    assert(result3.suggestions.length > 0, 'Should provide optimization suggestions');

    console.log('  ✓ O(n²) complexity detection with suggestions');
}

async function testVulnerabilityScanner() {
    console.log('Testing VulnerabilityScanner...');
    const scanner = new VulnerabilityScanner();

    // Test hardcoded credentials
    const code1 = 'const password = "secret123";';
    const issues1 = await scanner.scanCode(code1);
    assert(issues1.some((i: any) => i.issue.includes('credentials')), 'Should detect hardcoded credentials');

    console.log('  ✓ Hardcoded credentials detection');

    // Test eval usage
    const code2 = 'eval(userInput);';
    const issues2 = await scanner.scanCode(code2);
    assert(issues2.some((i: any) => i.issue.includes('eval')), 'Should detect eval usage');

    console.log('  ✓ eval() usage detection');

    // Test SQL injection risk
    const code3 = 'const query = `SELECT * FROM users WHERE id = ${userId}`;';
    const issues3 = await scanner.scanCode(code3);
    assert(issues3.some((i: any) => i.issue.includes('SQL injection')), 'Should detect SQL injection risk');

    console.log('  ✓ SQL injection detection');

    // Test insecure random
    const code4 = 'const token = Math.random();';
    const issues4 = await scanner.scanCode(code4);
    assert(issues4.some((i: any) => i.issue.includes('not cryptographically secure')), 'Should detect insecure random');

    console.log('  ✓ Insecure random detection');
}

function createMockDocument(text: string, languageId: string): any {
    return {
        getText: () => text,
        languageId,
        lineAt: (line: number) => ({
            text: text.split('\n')[line] || ''
        })
    };
}

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

// Run tests if executed directly
if (require.main === module) {
    runValidatorTests();
}
