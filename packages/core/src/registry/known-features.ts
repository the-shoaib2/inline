
import { FeatureMetadata } from '../types/feature';

export const FEATURE_REGISTRY: FeatureMetadata[] = [
    { 
        id: 'events', 
        name: 'Event System', 
        description: 'Central event bus and telemetry',
        enabled: true
    },
    { 
        id: 'storage', 
        name: 'Storage Service', 
        description: 'Persistent storage and cache management',
        dependencies: ['events'],
        enabled: true
    },
    { 
        id: 'intelligence', 
        name: 'Intelligence Engine', 
        description: 'LLM inference and model management',
        dependencies: ['events', 'storage'],
        enabled: true
    },
    { 
        id: 'context', 
        name: 'Context Engine', 
        description: 'Code context analysis and retrieval',
        dependencies: ['intelligence'],
        enabled: true
    },
    { 
        id: 'language', 
        name: 'Language Services', 
        description: 'AST parsing and language analysis',
        dependencies: ['context'],
        enabled: true
    },
    { 
        id: 'completion', 
        name: 'Completion Provider', 
        description: 'Inline code completion',
        dependencies: ['language', 'intelligence', 'context'],
        enabled: true
    },
    { 
        id: 'ui', 
        name: 'UI Components', 
        description: 'Webviews and status bar',
        dependencies: ['intelligence', 'completion'],
        enabled: true
    }
];
