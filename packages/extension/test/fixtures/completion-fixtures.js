"use strict";
/**
 * Pre-defined completion fixtures for E2E testing.
 * Provides realistic, deterministic completions for common scenarios.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMPLETION_FIXTURES = void 0;
exports.getFixture = getFixture;
exports.getLanguageFixtures = getLanguageFixtures;
exports.getSupportedLanguages = getSupportedLanguages;
exports.COMPLETION_FIXTURES = {
    typescript: {
        functionFromComment: {
            prompt: '// Create a function that adds two numbers\n',
            completion: 'function add(a: number, b: number): number {\n  return a + b;\n}',
            description: 'Generate function from comment'
        },
        asyncFunction: {
            prompt: '// Create an async function\n',
            completion: 'async function fetchData(url: string): Promise<any> {\n  const response = await fetch(url);\n  return response.json();\n}',
            description: 'Generate async function'
        },
        classMethod: {
            prompt: 'class Calculator {\n  ',
            completion: 'add(a: number, b: number): number {\n    return a + b;\n  }',
            description: 'Complete class method'
        },
        interface: {
            prompt: 'interface User {\n  ',
            completion: 'id: string;\n  name: string;\n  email: string;',
            description: 'Complete interface definition'
        },
        importStatement: {
            prompt: 'import ',
            completion: "{ useState, useEffect } from 'react';",
            description: 'Complete import statement'
        },
        arrowFunction: {
            prompt: 'const handleClick = ',
            completion: '(event: React.MouseEvent) => {\n  console.log(event);\n};',
            description: 'Complete arrow function'
        }
    },
    python: {
        functionFromComment: {
            prompt: '# Create a function that sorts a list\n',
            completion: 'def sort_list(items: list) -> list:\n    return sorted(items)',
            description: 'Generate function from comment'
        },
        classMethod: {
            prompt: 'class Calculator:\n    ',
            completion: 'def add(self, a: int, b: int) -> int:\n        return a + b',
            description: 'Complete class method'
        },
        importStatement: {
            prompt: 'import ',
            completion: 'numpy as np',
            description: 'Complete import statement'
        },
        decorator: {
            prompt: '@',
            completion: 'property\ndef value(self):\n    return self._value',
            description: 'Complete decorator'
        },
        listComprehension: {
            prompt: 'squares = ',
            completion: '[x**2 for x in range(10)]',
            description: 'Complete list comprehension'
        }
    },
    javascript: {
        functionFromComment: {
            prompt: '// Create an async function\n',
            completion: 'async function fetchData(url) {\n  const response = await fetch(url);\n  return response.json();\n}',
            description: 'Generate async function'
        },
        classMethod: {
            prompt: 'class Calculator {\n  ',
            completion: 'add(a, b) {\n    return a + b;\n  }',
            description: 'Complete class method'
        },
        arrowFunction: {
            prompt: 'const sum = ',
            completion: '(a, b) => a + b;',
            description: 'Complete arrow function'
        },
        promiseChain: {
            prompt: 'fetch(url)\n  .',
            completion: 'then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error(error));',
            description: 'Complete promise chain'
        }
    },
    java: {
        functionFromComment: {
            prompt: '// Create a method that adds two numbers\n',
            completion: 'public int add(int a, int b) {\n    return a + b;\n}',
            description: 'Generate method from comment'
        },
        classConstructor: {
            prompt: 'public class Calculator {\n    ',
            completion: 'public Calculator() {\n        // Initialize\n    }',
            description: 'Complete constructor'
        },
        getter: {
            prompt: 'private String name;\n\n',
            completion: 'public String getName() {\n    return name;\n}',
            description: 'Generate getter method'
        }
    },
    go: {
        functionFromComment: {
            prompt: '// Create a function that adds two numbers\n',
            completion: 'func add(a int, b int) int {\n\treturn a + b\n}',
            description: 'Generate function from comment'
        },
        structMethod: {
            prompt: 'type Calculator struct {}\n\n',
            completion: 'func (c *Calculator) Add(a, b int) int {\n\treturn a + b\n}',
            description: 'Complete struct method'
        },
        errorHandling: {
            prompt: 'result, err := ',
            completion: 'doSomething()\nif err != nil {\n\treturn err\n}',
            description: 'Complete error handling'
        }
    },
    rust: {
        functionFromComment: {
            prompt: '// Create a function that adds two numbers\n',
            completion: 'fn add(a: i32, b: i32) -> i32 {\n    a + b\n}',
            description: 'Generate function from comment'
        },
        implBlock: {
            prompt: 'impl Calculator {\n    ',
            completion: 'fn add(&self, a: i32, b: i32) -> i32 {\n        a + b\n    }',
            description: 'Complete impl block'
        }
    },
    cpp: {
        functionFromComment: {
            prompt: '// Create a function that adds two numbers\n',
            completion: 'int add(int a, int b) {\n    return a + b;\n}',
            description: 'Generate function from comment'
        },
        classMethod: {
            prompt: 'class Calculator {\npublic:\n    ',
            completion: 'int add(int a, int b) {\n        return a + b;\n    }',
            description: 'Complete class method'
        }
    },
    php: {
        functionFromComment: {
            prompt: '// Create a function that adds two numbers\n',
            completion: 'function add($a, $b) {\n    return $a + $b;\n}',
            description: 'Generate function from comment'
        },
        classMethod: {
            prompt: 'class Calculator {\n    ',
            completion: 'public function add($a, $b) {\n        return $a + $b;\n    }',
            description: 'Complete class method'
        }
    },
    ruby: {
        functionFromComment: {
            prompt: '# Create a method that adds two numbers\n',
            completion: 'def add(a, b)\n  a + b\nend',
            description: 'Generate method from comment'
        },
        classMethod: {
            prompt: 'class Calculator\n  ',
            completion: 'def add(a, b)\n    a + b\n  end',
            description: 'Complete class method'
        }
    }
};
/**
 * Get a completion fixture by language and scenario
 */
function getFixture(language, scenario) {
    const langFixtures = exports.COMPLETION_FIXTURES[language];
    if (!langFixtures) {
        return null;
    }
    return langFixtures[scenario] || null;
}
/**
 * Get all fixtures for a language
 */
function getLanguageFixtures(language) {
    return exports.COMPLETION_FIXTURES[language] || null;
}
/**
 * Get all supported languages
 */
function getSupportedLanguages() {
    return Object.keys(exports.COMPLETION_FIXTURES);
}
//# sourceMappingURL=completion-fixtures.js.map