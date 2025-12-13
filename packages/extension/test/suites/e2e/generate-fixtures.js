"use strict";
/**
 * Generate Language Fixtures Script
 * Creates sample code files for all supported languages
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const language_fixture_generator_1 = require("./helpers/language-fixture-generator");
async function main() {
    console.log('Generating language fixtures for all supported languages...\n');
    const workspaceRoot = path.join(__dirname, '../../..');
    const fixturesDir = path.join(workspaceRoot, 'test/fixtures/languages');
    const generator = new language_fixture_generator_1.LanguageFixtureGenerator(fixturesDir);
    await generator.generateAllFixtures();
    console.log('\n✓ All language fixtures generated successfully!');
    console.log(`Location: ${fixturesDir}`);
}
main().catch(error => {
    console.error('Failed to generate fixtures:', error);
    process.exit(1);
});
//# sourceMappingURL=generate-fixtures.js.map