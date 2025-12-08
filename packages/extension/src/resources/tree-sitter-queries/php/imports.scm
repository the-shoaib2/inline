; PHP use/require statements
; Matches: use Foo\Bar;
;          require 'file.php';

(namespace_use_declaration
  (namespace_use_clause
    (qualified_name) @import.namespace)) @import

(require_expression
  (string) @import.require_path) @import.require

(include_expression
  (string) @import.include_path) @import.include
