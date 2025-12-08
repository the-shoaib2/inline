/**
 * Boilerplate Generator
 * Generates project boilerplate code
 */
export class BoilerplateGenerator {
    
    generateProjectBoilerplate(projectType: string, projectName: string): Record<string, string> {
        const generators: Record<string, () => Record<string, string>> = {
            'express': () => this.generateExpressBoilerplate(projectName),
            'react': () => this.generateReactBoilerplate(projectName),
            'node-cli': () => this.generateNodeCLIBoilerplate(projectName),
            'python-flask': () => this.generateFlaskBoilerplate(projectName)
        };

        const generator = generators[projectType.toLowerCase()];
        return generator ? generator() : {};
    }

    private generateExpressBoilerplate(name: string): Record<string, string> {
        return {
            'src/index.ts': `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
});`,
            'src/routes/index.ts': `import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.json({ message: 'Welcome to ${name} API' });
});

export default router;`,
            'src/middleware/errorHandler.ts': `import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
};`,
            '.env.example': `PORT=3000
NODE_ENV=development`
        };
    }

    private generateReactBoilerplate(name: string): Record<string, string> {
        return {
            'src/App.tsx': `import React from 'react';
import './App.css';

function App() {
    return (
        <div className="App">
            <h1>Welcome to ${name}</h1>
        </div>
    );
}

export default App;`,
            'src/index.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);`,
            'src/App.css': `.App {
    text-align: center;
    padding: 20px;
}

h1 {
    color: #333;
}`
        };
    }

    private generateNodeCLIBoilerplate(name: string): Record<string, string> {
        return {
            'src/cli.ts': `#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
    .name('${name}')
    .description('CLI tool for ${name}')
    .version('1.0.0');

program
    .command('hello <name>')
    .description('Say hello')
    .action((name: string) => {
        console.log(\`Hello, \${name}!\`);
    });

program.parse();`,
            'src/utils/logger.ts': `export const logger = {
    info: (msg: string) => console.log(\`[INFO] \${msg}\`),
    error: (msg: string) => console.error(\`[ERROR] \${msg}\`),
    warn: (msg: string) => console.warn(\`[WARN] \${msg}\`)
};`
        };
    }

    private generateFlaskBoilerplate(name: string): Record<string, string> {
        return {
            'app.py': `from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

@app.route('/')
def index():
    return jsonify({'message': 'Welcome to ${name} API'})

if __name__ == '__main__':
    app.run(debug=True)`,
            'requirements.txt': `Flask==2.3.0
flask-cors==4.0.0`,
            'config.py': `import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    DEBUG = os.environ.get('DEBUG', 'True') == 'True'`
        };
    }
}
