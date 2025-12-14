import React, { useState, useMemo } from 'react';

// Import centralized language configuration
// Note: This will be available once the language package is built
// For now, we'll use a local constant that matches the centralized config
const SUPPORTED_LANGUAGES = [
    { id: 'typescript', name: 'TypeScript' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'python', name: 'Python' },
    { id: 'java', name: 'Java' },
    { id: 'cpp', name: 'C++' },
    { id: 'c', name: 'C' },
    { id: 'csharp', name: 'C#' },
    { id: 'go', name: 'Go' },
    { id: 'rust', name: 'Rust' },
    { id: 'php', name: 'PHP' },
    { id: 'ruby', name: 'Ruby' },
    { id: 'swift', name: 'Swift' },
    { id: 'kotlin', name: 'Kotlin' },
    { id: 'scala', name: 'Scala' },
    { id: 'dart', name: 'Dart' },
    { id: 'lua', name: 'Lua' },
    { id: 'shell', name: 'Shell' },
    { id: 'bash', name: 'Bash' },
    { id: 'elixir', name: 'Elixir' },
    { id: 'elm', name: 'Elm' },
    { id: 'ocaml', name: 'OCaml' },
    { id: 'solidity', name: 'Solidity' },
    { id: 'zig', name: 'Zig' },
    { id: 'objectivec', name: 'Objective-C' },
].sort((a, b) => a.name.localeCompare(b.name));

interface ModelSearchProps {
    onSearch: (query: string) => void;
    onFilterLanguage: (language: string) => void;
    onSort: (sortBy: string) => void;
}

export const ModelSearch: React.FC<ModelSearchProps> = ({ onSearch, onFilterLanguage, onSort }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearch(query);
    };

    return (
        <div className="model-search">
            <input
                type="text"
                className="search-input"
                placeholder="Search models..."
                value={searchQuery}
                onChange={handleSearchChange}
            />
            <div className="search-filters">
                <select onChange={(e) => onFilterLanguage(e.target.value)}>
                    <option value="">All Languages</option>
                    {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang.id} value={lang.id}>
                            {lang.name}
                        </option>
                    ))}
                </select>
                <select onChange={(e) => onSort(e.target.value)}>
                    <option value="name">Sort by Name</option>
                    <option value="size">Sort by Size</option>
                    <option value="date">Sort by Date</option>
                </select>
            </div>
        </div>
    );
};
