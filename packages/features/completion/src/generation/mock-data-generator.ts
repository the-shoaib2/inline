/**
 * Mock Data Generator
 * Generates realistic test data
 */
export class MockDataGenerator {
    
    private firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'];
    private lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    private companies = ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovation Labs', 'Digital Dynamics'];
    private cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];
    private domains = ['example.com', 'test.com', 'demo.com', 'sample.org'];

    generateMockData(type: string, count: number = 1): any[] {
        const generators: Record<string, () => any> = {
            'user': () => this.generateUser(),
            'product': () => this.generateProduct(),
            'order': () => this.generateOrder(),
            'address': () => this.generateAddress(),
            'email': () => this.generateEmail(),
            'phone': () => this.generatePhone(),
            'date': () => this.generateDate(),
            'number': () => this.generateNumber(),
            'boolean': () => this.generateBoolean(),
            'uuid': () => this.generateUUID()
        };

        const generator = generators[type.toLowerCase()];
        if (!generator) {
            throw new Error(`Unknown mock data type: ${type}`);
        }

        return Array.from({ length: count }, () => generator());
    }

    private generateUser() {
        const firstName = this.random(this.firstNames);
        const lastName = this.random(this.lastNames);
        return {
            id: this.generateNumber(1, 10000),
            firstName,
            lastName,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${this.random(this.domains)}`,
            age: this.generateNumber(18, 80),
            active: this.generateBoolean()
        };
    }

    private generateProduct() {
        return {
            id: this.generateNumber(1, 1000),
            name: `Product ${this.generateNumber(1, 100)}`,
            price: parseFloat((Math.random() * 1000).toFixed(2)),
            category: this.random(['Electronics', 'Clothing', 'Food', 'Books', 'Toys']),
            inStock: this.generateBoolean(),
            quantity: this.generateNumber(0, 100)
        };
    }

    private generateOrder() {
        return {
            id: this.generateUUID(),
            userId: this.generateNumber(1, 1000),
            total: parseFloat((Math.random() * 500).toFixed(2)),
            status: this.random(['pending', 'processing', 'shipped', 'delivered']),
            createdAt: this.generateDate()
        };
    }

    private generateAddress() {
        return {
            street: `${this.generateNumber(1, 9999)} ${this.random(['Main', 'Oak', 'Pine', 'Maple'])} St`,
            city: this.random(this.cities),
            state: this.random(['CA', 'NY', 'TX', 'FL', 'IL']),
            zipCode: this.generateNumber(10000, 99999).toString(),
            country: 'USA'
        };
    }

    private generateEmail(): string {
        const name = this.random(this.firstNames).toLowerCase();
        return `${name}${this.generateNumber(1, 999)}@${this.random(this.domains)}`;
    }

    private generatePhone(): string {
        return `+1-${this.generateNumber(200, 999)}-${this.generateNumber(100, 999)}-${this.generateNumber(1000, 9999)}`;
    }

    private generateDate(): string {
        const start = new Date(2020, 0, 1);
        const end = new Date();
        const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        return date.toISOString();
    }

    private generateNumber(min: number = 0, max: number = 100): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private generateBoolean(): boolean {
        return Math.random() > 0.5;
    }

    /**
     * Generate RFC 4122 compliant UUID v4
     * @returns UUID v4 string
     */
    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            // For 'x': use random hex digit (0-f)
            // For 'y': set variant bits to 10xx (8, 9, a, or b)
            const v = c === 'x' ? r : ((r & 0x3) | 0x8);
            return v.toString(16);
        });
    }

    private random<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)];
    }
}
