; Go import statements
; Matches: import "fmt"
;          import ( "fmt"; "os" )

(import_declaration
  (import_spec
    path: (interpreted_string_literal) @import.path)) @import

(import_declaration
  (import_spec_list
    (import_spec
      path: (interpreted_string_literal) @import.list_path))) @import.multiple
