
import { CompletionStrategyRegistry, StrategyType } from './services/strategy-registry';

// DTO Strategies
import { TypeScriptDTOStrategy } from './generation/strategies/dto/typescript-dto-strategy';
import { PythonDTOStrategy } from './generation/strategies/dto/python-dto-strategy';
import { JavaDTOStrategy } from './generation/strategies/dto/java-dto-strategy';

// Mock Strategies
import { TypeScriptMockStrategy } from './generation/strategies/mock/typescript-mock-strategy';
import { PythonMockStrategy } from './generation/strategies/mock/python-mock-strategy';

// CRUD Strategies
import { TypeScriptCRUDStrategy } from './generation/strategies/crud/typescript-crud-strategy';
import { PythonCRUDStrategy } from './generation/strategies/crud/python-crud-strategy';

// Integration Test Strategies
import { TypeScriptIntegrationTestStrategy } from './generation/strategies/integration-test/typescript-integration-test-strategy';
import { PythonIntegrationTestStrategy } from './generation/strategies/integration-test/python-integration-test-strategy';

// Class Scaffolding Strategies
import { TypeScriptClassScaffoldingStrategy } from './generation/strategies/class/typescript-class-scaffolding-strategy';
import { PythonClassScaffoldingStrategy } from './generation/strategies/class/python-class-scaffolding-strategy';
import { JavaClassScaffoldingStrategy } from './generation/strategies/class/java-class-scaffolding-strategy';

// Utils Strategies
import { TypeScriptUtilsStrategy } from './generation/strategies/utils/typescript-utils-strategy';
import { PythonUtilsStrategy } from './generation/strategies/utils/python-utils-strategy';
import { JavaUtilsStrategy } from './generation/strategies/utils/java-utils-strategy';

// Test Strategies
import { TypeScriptTestStrategy } from './generation/strategies/test/typescript-test-strategy';
// (PythonTestStrategy was generic or not implemented fully yet? Checking existence)
import { PythonTestStrategy } from './generation/strategies/test/python-test-strategy';

export function registerAllStrategies(): void {
    const registry = CompletionStrategyRegistry.getInstance();
    
    // Clear existing to avoid duplicates in hot reload/tests
    registry.clear();

    // DTO
    registry.register(StrategyType.DTO, new TypeScriptDTOStrategy());
    registry.register(StrategyType.DTO, new PythonDTOStrategy());
    registry.register(StrategyType.DTO, new JavaDTOStrategy());

    // Mock
    registry.register(StrategyType.MOCK, new TypeScriptMockStrategy());
    registry.register(StrategyType.MOCK, new PythonMockStrategy());

    // CRUD
    registry.register(StrategyType.CRUD, new TypeScriptCRUDStrategy());
    registry.register(StrategyType.CRUD, new PythonCRUDStrategy());

    // Integration Test
    registry.register(StrategyType.INTEGRATION_TEST, new TypeScriptIntegrationTestStrategy());
    registry.register(StrategyType.INTEGRATION_TEST, new PythonIntegrationTestStrategy());

    // Class Scaffolding
    registry.register(StrategyType.CLASS_SCAFFOLDING, new TypeScriptClassScaffoldingStrategy());
    registry.register(StrategyType.CLASS_SCAFFOLDING, new PythonClassScaffoldingStrategy());
    registry.register(StrategyType.CLASS_SCAFFOLDING, new JavaClassScaffoldingStrategy());

    // Utils
    registry.register(StrategyType.CODE_GENERATOR_UTILS, new TypeScriptUtilsStrategy());
    registry.register(StrategyType.CODE_GENERATOR_UTILS, new PythonUtilsStrategy());
    registry.register(StrategyType.CODE_GENERATOR_UTILS, new JavaUtilsStrategy());
    
    // Test
    registry.register(StrategyType.TEST, new TypeScriptTestStrategy());
    registry.register(StrategyType.TEST, new PythonTestStrategy());
}
