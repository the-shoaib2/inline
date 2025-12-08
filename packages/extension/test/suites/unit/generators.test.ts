/**
 * Unit Tests for Code Generators
 */

import { CRUDGenerator } from '@completion/generation/crud-generator';
import { APIGenerator } from '@completion/generation/api-generator';
import { SQLGenerator } from '@completion/generation/sql-generator';
import { MockDataGenerator } from '@completion/generation/mock-data-generator';
import { RegexGenerator } from '@completion/generation/regex-generator';
import { DTOGenerator } from '@completion/generation/dto-generator';
import { BoilerplateGenerator } from '@completion/generation/boilerplate-generator';
import { ConfigGenerator } from '@completion/generation/config-generator';

export async function runGeneratorTests() {
    console.log('🧪 Running Generator Tests...\n');

    await testCRUDGenerator();
    await testAPIGenerator();
    await testSQLGenerator();
    await testMockDataGenerator();
    await testRegexGenerator();
    await testDTOGenerator();
    await testBoilerplateGenerator();
    await testConfigGenerator();

    console.log('\n✅ All Generator Tests Passed!\n');
}

async function testCRUDGenerator() {
    console.log('Testing CRUDGenerator...');
    const generator = new CRUDGenerator({} as any);

    // Test TypeScript CRUD
    const tsResult = await generator.generateCRUD('User', [
        { name: 'id', type: 'number' },
        { name: 'name', type: 'string' }
    ], 'typescript');

    assert(tsResult.includes('interface User'), 'Should include User interface');
    assert(tsResult.includes('create'), 'Should include create method');
    assert(tsResult.includes('getById'), 'Should include getById method');
    assert(tsResult.includes('update'), 'Should include update method');
    assert(tsResult.includes('delete'), 'Should include delete method');

    console.log('  ✓ TypeScript CRUD generation');

    // Test Python CRUD
    const pyResult = await generator.generateCRUD('Product', [
        { name: 'id', type: 'number' },
        { name: 'price', type: 'number' }
    ], 'python');

    assert(pyResult.includes('class Product'), 'Should include Product class');
    assert(pyResult.includes('def create'), 'Should include create method');

    console.log('  ✓ Python CRUD generation');
}

function testAPIGenerator() {
    console.log('Testing APIGenerator...');
    const generator = new APIGenerator();

    // Test Express API
    const expressResult = generator.generateRESTAPI('Product', [
        { name: 'name', type: 'string' },
        { name: 'price', type: 'number' }
    ], 'express');

    assert(expressResult.includes('router.get'), 'Should include GET route');
    assert(expressResult.includes('router.post'), 'Should include POST route');
    assert(expressResult.includes('router.put'), 'Should include PUT route');
    assert(expressResult.includes('router.delete'), 'Should include DELETE route');

    console.log('  ✓ Express API generation');

    // Test FastAPI
    const fastapiResult = generator.generateRESTAPI('User', [
        { name: 'email', type: 'string' }
    ], 'fastapi');

    assert(fastapiResult.includes('@router.get'), 'Should include GET decorator');
    assert(fastapiResult.includes('BaseModel'), 'Should include BaseModel');

    console.log('  ✓ FastAPI generation');
}

function testSQLGenerator() {
    console.log('Testing SQLGenerator...');
    const generator = new SQLGenerator();

    // Test CREATE TABLE
    const createTable = generator.generateCreateTable('users', [
        { name: 'id', type: 'INTEGER', primaryKey: true },
        { name: 'email', type: 'VARCHAR(255)', nullable: false }
    ]);

    assert(createTable.includes('CREATE TABLE users'), 'Should create table');
    assert(createTable.includes('PRIMARY KEY'), 'Should include primary key');
    assert(createTable.includes('NOT NULL'), 'Should include NOT NULL');

    console.log('  ✓ CREATE TABLE generation');

    // Test SELECT
    const select = generator.generateSelect('users', ['id', 'email'], 'id = 1');
    assert(select.includes('SELECT id, email'), 'Should select columns');
    assert(select.includes('WHERE id = 1'), 'Should include WHERE clause');

    console.log('  ✓ SELECT query generation');

    // Test JOIN
    const join = generator.generateJoin('users', 'orders', 'user_id', 'INNER');
    assert(join.includes('INNER JOIN'), 'Should include INNER JOIN');

    console.log('  ✓ JOIN query generation');
}

function testMockDataGenerator() {
    console.log('Testing MockDataGenerator...');
    const generator = new MockDataGenerator();

    // Test user generation
    const users = generator.generateMockData('user', 5);
    assert(users.length === 5, 'Should generate 5 users');
    assert(users[0].hasOwnProperty('firstName'), 'Should have firstName');
    assert(users[0].hasOwnProperty('email'), 'Should have email');
    assert(users[0].email.includes('@'), 'Email should contain @');

    console.log('  ✓ User mock data generation');

    // Test product generation
    const products = generator.generateMockData('product', 3);
    assert(products.length === 3, 'Should generate 3 products');
    assert(products[0].hasOwnProperty('name'), 'Should have name');
    assert(products[0].hasOwnProperty('price'), 'Should have price');

    console.log('  ✓ Product mock data generation');

    // Test UUID generation
    const uuids = generator.generateMockData('uuid', 1);
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    assert(uuidPattern.test(uuids[0]), 'Should generate valid UUID');

    console.log('  ✓ UUID generation');
}

function testRegexGenerator() {
    console.log('Testing RegexGenerator...');
    const generator = new RegexGenerator();

    // Test email regex
    const emailResult = generator.generateFromDescription('email');
    assert(emailResult !== null, 'Should generate email regex');
    assert(generator.testPattern(emailResult!.pattern, 'test@example.com', emailResult!.flags), 'Should match valid email');

    console.log('  ✓ Email regex generation');

    // Test custom pattern
    const customResult = generator.generateFromDescription('starts with "test"');
    assert(customResult !== null, 'Should generate custom regex');
    assert(customResult!.pattern.includes('^test'), 'Should include start anchor');

    console.log('  ✓ Custom regex generation');
}

function testDTOGenerator() {
    console.log('Testing DTOGenerator...');
    const generator = new DTOGenerator();

    // Test TypeScript DTO
    const tsDTO = generator.generateDTO('User', [
        { name: 'id', type: 'number' },
        { name: 'name', type: 'string', optional: true }
    ], 'typescript');

    assert(tsDTO.includes('interface UserDTO'), 'Should include interface');
    assert(tsDTO.includes('name?: string'), 'Should include optional field');
    assert(tsDTO.includes('toJSON'), 'Should include toJSON method');

    console.log('  ✓ TypeScript DTO generation');

    // Test Python DTO
    const pyDTO = generator.generateDTO('Product', [
        { name: 'price', type: 'number' }
    ], 'python');

    assert(pyDTO.includes('@dataclass'), 'Should include dataclass decorator');
    assert(pyDTO.includes('to_dict'), 'Should include to_dict method');

    console.log('  ✓ Python DTO generation');
}

function testBoilerplateGenerator() {
    console.log('Testing BoilerplateGenerator...');
    const generator = new BoilerplateGenerator();

    // Test Express boilerplate
    const express = generator.generateProjectBoilerplate('express', 'test-app');
    assert(express['src/index.ts'] !== undefined, 'Should include index.ts');
    assert(express['src/index.ts'].includes('express'), 'Should use Express');

    console.log('  ✓ Express boilerplate generation');

    // Test React boilerplate
    const react = generator.generateProjectBoilerplate('react', 'test-app');
    assert(react['src/App.tsx'] !== undefined, 'Should include App.tsx');

    console.log('  ✓ React boilerplate generation');
}

function testConfigGenerator() {
    console.log('Testing ConfigGenerator...');
    const generator = new ConfigGenerator();

    // Test package.json
    const packageJson = generator.generateConfig('package.json', { name: 'test-app', version: '1.0.0' });
    const parsed = JSON.parse(packageJson);
    assert(parsed.name === 'test-app', 'Should set name');
    assert(parsed.scripts.build, 'Should include build script');

    console.log('  ✓ package.json generation');

    // Test tsconfig.json
    const tsconfig = generator.generateConfig('tsconfig.json', { target: 'ES2020' });
    const tsParsed = JSON.parse(tsconfig);
    assert(tsParsed.compilerOptions.target === 'ES2020', 'Should set target');

    console.log('  ✓ tsconfig.json generation');

    // Test .gitignore
    const gitignore = generator.generateConfig('.gitignore');
    assert(gitignore.includes('node_modules'), 'Should include node_modules');
    assert(gitignore.includes('.env'), 'Should include .env');

    console.log('  ✓ .gitignore generation');
}

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

// Run tests if executed directly
if (require.main === module) {
    runGeneratorTests();
}
