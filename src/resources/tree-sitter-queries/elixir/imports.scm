; Elixir import/alias statements
; Matches: import Foo
;          alias Bar.Baz

(call
  target: (identifier) @import_keyword (#eq? @import_keyword "import")
  (arguments
    (alias) @import.module)) @import

(call
  target: (identifier) @alias_keyword (#eq? @alias_keyword "alias")
  (arguments
    (alias) @import.alias)) @alias
