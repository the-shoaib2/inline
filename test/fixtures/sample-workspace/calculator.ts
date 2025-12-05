// Sample TypeScript file for testing
export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  subtract(a: number, b: number): number {
    return a - b;

  }

  
  multiply(a: number, b: number): number {
    return a * b;
  }

  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    return a / b;
  }
}

// Helper function
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

// Async function example
export async function fetchData(url: string): Promise<any> {
  const response = await fetch(url);
  return response.json();
}


