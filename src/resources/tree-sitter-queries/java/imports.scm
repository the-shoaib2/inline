; Java import statements
; Matches: import java.util.List;
;          import static java.lang.Math.*;

(import_declaration
  (scoped_identifier) @import.path) @import

(import_declaration
  "static" @import.static
  (scoped_identifier) @import.static_path) @import.static_import
