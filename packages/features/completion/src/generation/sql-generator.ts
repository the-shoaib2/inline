/**
 * SQL Generator
 * Generates common SQL queries
 */
export class SQLGenerator {
    
    generateCreateTable(tableName: string, columns: Array<{ name: string; type: string; nullable?: boolean; primaryKey?: boolean }>): string {
        const columnDefs = columns.map(col => {
            let def = `    ${col.name} ${col.type}`;
            if (col.primaryKey) def += ' PRIMARY KEY';
            if (!col.nullable && !col.primaryKey) def += ' NOT NULL';
            return def;
        }).join(',\n');

        return `CREATE TABLE ${tableName} (\n${columnDefs}\n);`;
    }

    generateSelect(tableName: string, columns: string[] = ['*'], where?: string): string {
        const cols = columns.join(', ');
        let query = `SELECT ${cols}\nFROM ${tableName}`;
        if (where) {
            query += `\nWHERE ${where}`;
        }
        return query + ';';
    }

    generateInsert(tableName: string, data: Record<string, any>): string {
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data).map(v => 
            typeof v === 'string' ? `'${v}'` : v
        ).join(', ');

        return `INSERT INTO ${tableName} (${columns})\nVALUES (${values});`;
    }

    generateUpdate(tableName: string, data: Record<string, any>, where: string): string {
        const sets = Object.entries(data).map(([key, val]) => 
            `${key} = ${typeof val === 'string' ? `'${val}'` : val}`
        ).join(', ');

        return `UPDATE ${tableName}\nSET ${sets}\nWHERE ${where};`;
    }

    generateDelete(tableName: string, where: string): string {
        return `DELETE FROM ${tableName}\nWHERE ${where};`;
    }

    generateJoin(
        table1: string,
        table2: string,
        joinColumn: string,
        type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' = 'INNER'
    ): string {
        return `SELECT *\nFROM ${table1}\n${type} JOIN ${table2}\n    ON ${table1}.${joinColumn} = ${table2}.${joinColumn};`;
    }

    generateIndex(tableName: string, columnName: string, unique: boolean = false): string {
        const uniqueStr = unique ? 'UNIQUE ' : '';
        return `CREATE ${uniqueStr}INDEX idx_${tableName}_${columnName}\nON ${tableName}(${columnName});`;
    }
}
