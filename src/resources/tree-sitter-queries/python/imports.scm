; Query for import statements in Python
; Matches: import foo
;          from foo import bar
;          from foo.bar import baz as qux

(import_statement
  name: (dotted_name) @import.module) @import

(import_from_statement
  module_name: (dotted_name) @import.from_module
  name: (dotted_name) @import.name) @import.from

(import_from_statement
  module_name: (dotted_name) @import.from_module
  name: (aliased_import
    name: (dotted_name) @import.name
    alias: (identifier) @import.alias)) @import.from_aliased
