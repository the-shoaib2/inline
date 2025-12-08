; Query for import statements in TypeScript
; Matches: import { foo } from 'bar'
;          import * as foo from 'bar'
;          import foo from 'bar'

(import_statement
  source: (string) @import.source) @import

(import_clause
  (named_imports
    (import_specifier
      name: (identifier) @import.name))) @import.named

(import_clause
  (namespace_import
    (identifier) @import.namespace)) @import.namespace_import

(import_clause
  name: (identifier) @import.default) @import.default_import
