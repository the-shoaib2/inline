import React, { useState } from 'react';

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
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="c">C</option>
                    <option value="csharp">C#</option>
                    <option value="shell">Shell</option>
                    <option value="ruby">Ruby</option>
                    <option value="php">PHP</option>
                    <option value="swift">Swift</option>
                    <option value="kotlin">Kotlin</option>
                    <option value="scala">Scala</option>
                    <option value="r">R</option>
                    <option value="matlab">MATLAB</option>
                    <option value="sql">SQL</option>
                    <option value="dart">Dart</option>
                    <option value="groovy">Groovy</option>
                    <option value="perl">Perl</option>
                    <option value="lua">Lua</option>
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
