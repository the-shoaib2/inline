
import os
import shutil

# Root directory for resources
RESOURCES_DIR = os.path.join(os.path.dirname(__file__), '../resources/tree-sitter-queries')

# Languages to generate queries for
LANGUAGES = [
    # Most Popular
    'javascript', 'typescript', 'python', 'java', 'c_sharp', 'php',
    
    # Systems & Performance
    'go', 'rust', 'cpp', 'c', 'fortran', 'cobol',
    
    # Mobile & Cross-Platform
    'swift', 'kotlin', 'dart', 'objective_c',
    
    # Functional & Academic
    'scala', 'haskell', 'elixir', 'erlang', 'clojure', 'ocaml', 'f_sharp',
    
    # Data Science & Analytics
    'r', 'julia', 'sql',
    
    # Web & Markup
    'html', 'css', 'json', 'yaml', 'toml',
    
    # Scripting & Automation
    'bash', 'powershell', 'perl', 'ruby', 'lua', 'groovy',
    
    # Modern & Emerging
    'zig', 'nim', 'crystal', 'solidity', 'vb'
]

# Common queries (defaults)
QUERIES = {
    'imports': '',
    'functions': '',
    'classes': '',
    'decorators': '',
    'generics': '',
    'patternMatching': ''
}

# Language-specific query definitions
DEFINITIONS = {
    'typescript': {
        'imports': '[(import_statement) (import_require)] @import',
        'functions': '[(function_declaration) (method_definition) (arrow_function)] @function',
        'classes': '[(class_declaration) (interface_declaration) (type_alias_declaration)] @class',
        'decorators': '[(decorator) @decorator]',
        'generics': '[(type_parameter) @generic]',
    },
    'javascript': {
        'imports': '[(import_statement) (import_require)] @import',
        'functions': '[(function_declaration) (method_definition) (arrow_function)] @function',
        'classes': '[(class_declaration)] @class',
        'decorators': '[(decorator) @decorator]',
    },
    'python': {
        'imports': '[(import_statement) (import_from_statement)] @import',
        'functions': '[(function_definition)] @function',
        'classes': '[(class_definition)] @class',
        'decorators': '[(decorator) @decorator]',
    },
    'java': {
        'imports': '[(import_declaration)] @import',
        'functions': '[(method_declaration) (constructor_declaration)] @function',
        'classes': '[(class_declaration) (interface_declaration) (enum_declaration)] @class',
        'decorators': '[(marker_annotation) (annotation)] @decorator',
        'generics': '[(type_parameter) @generic]',
    },
    'c_sharp': {
        'imports': '[(using_directive)] @import',
        'functions': '[(method_declaration)] @function',
        'classes': '[(class_declaration) (interface_declaration) (struct_declaration)] @class',
        'decorators': '[(attribute_list) @decorator]',
        'generics': '[(type_parameter_list) @generic]',
    },
    'php': {
        'imports': '[(namespace_use_declaration)] @import',
        'functions': '[(function_definition) (method_declaration)] @function',
        'classes': '[(class_declaration) (interface_declaration) (trait_declaration)] @class',
        'decorators': '[(attribute_group) @decorator]',
    },
    'rust': {
        'imports': '[(use_declaration)] @import',
        'functions': '[(function_item)] @function',
        'classes': '[(struct_item) (enum_item) (trait_item) (impl_item)] @class',
        'decorators': '[(attribute_item) @decorator]',
        'generics': '[(type_parameters) @generic]',
        'patternMatching': '[(match_expression)] @match'
    },
    'go': {
        'imports': '[(import_spec)] @import',
        'functions': '[(function_declaration) (method_declaration)] @function',
        'classes': '[(type_spec)] @class',
        'generics': '[(type_parameter_list) @generic]',
    },
    'cpp': {
        'imports': '[(preproc_include)] @import',
        'functions': '[(function_definition)] @function',
        'classes': '[(class_specifier) (struct_specifier)] @class',
        'decorators': '[(attribute_specifier) @decorator]',
        'generics': '[(template_parameter_list) @generic]',
    },
    'c': {
        'imports': '[(preproc_include)] @import',
        'functions': '[(function_definition)] @function',
        'classes': '[(struct_specifier) (enum_specifier)] @class',
    },
    'bash': {
        'functions': '[(function_definition)] @function',
    },
    'ruby': {
        'imports': '[(call method: (identifier) @method (#match? @method "^(require|include|extend)$"))] @import',
        'functions': '[(method)] @function',
        'classes': '[(class) (module)] @class',
    },
    'kotlin': {
        'imports': '[(import_header)] @import',
        'functions': '[(function_declaration)] @function',
        'classes': '[(class_declaration) (object_declaration)] @class',
        'decorators': '[(annotation) @decorator]',
        'generics': '[(type_parameter) @generic]',
    },
    'swift': {
        'imports': '[(import_declaration)] @import',
        'functions': '[(function_declaration)] @function',
        'classes': '[(class_declaration) (struct_declaration) (protocol_declaration) (extension_declaration)] @class',
        'decorators': '[(attribute) @decorator]',
        'generics': '[(generic_parameter) @generic]',
    },
    'lua': {
        'functions': '[(function_call) (function_definition)] @function',
    },
    'scala': {
        'imports': '[(import_declaration)] @import',
        'functions': '[(function_definition)] @function',
        'classes': '[(class_definition) (object_definition) (trait_definition)] @class',
        'generics': '[(type_parameters) @generic]',
    },
    'dart': {
        'imports': '[(import_or_export)] @import',
        'functions': '[(function_signature)] @function',
        'classes': '[(class_definition)] @class',
        'decorators': '[(annotation) @decorator]',
    },
    'elixir': {
        'functions': '[(call target: (identifier) @def (#match? @def "^(def|defp)$"))] @function',
        'classes': '[(call target: (identifier) @defmodule (#match? @defmodule "^defmodule$"))] @class',
    }
}

def main():
    print(f"Generating queries in {RESOURCES_DIR}...")
    
    if not os.path.exists(RESOURCES_DIR):
        os.makedirs(RESOURCES_DIR)
    
    for lang in LANGUAGES:
        lang_dir = os.path.join(RESOURCES_DIR, lang)
        if not os.path.exists(lang_dir):
            os.makedirs(lang_dir)
            print(f"Created directory: {lang}")
        
        # Get definitions for this language, fallback to empty strings
        lang_defs = DEFINITIONS.get(lang, {})
        
        for query_type, default_content in QUERIES.items():
            content = lang_defs.get(query_type, default_content)
            
            # If content is empty check if we should add a comment to avoid empty file issues if any
            if not content:
                content = f"; No {query_type} queries for {lang}"
            
            file_path = os.path.join(lang_dir, f"{query_type}.scm")
            
            # Write file
            with open(file_path, 'w') as f:
                f.write(content)
            
            # print(f"Generated {lang}/{query_type}.scm")

    print(f"Done generating queries for {len(LANGUAGES)} languages.")

if __name__ == '__main__':
    main()
