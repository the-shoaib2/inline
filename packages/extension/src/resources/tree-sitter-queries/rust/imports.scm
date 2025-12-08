; Rust import statements (use declarations)
; Matches: use std::collections::HashMap;
;          use std::io::{self, Write};
;          use super::*;

(use_declaration
  argument: (scoped_identifier) @import.path) @import

(use_declaration
  argument: (use_wildcard
    (scoped_identifier) @import.wildcard_path)) @import.wildcard

(use_declaration
  argument: (use_list) @import.list) @import.multiple
