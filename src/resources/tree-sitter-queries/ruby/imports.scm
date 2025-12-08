; Ruby require/import statements
; Matches: require 'foo'
;          require_relative './bar'

(call
  method: (identifier) @require_method (#eq? @require_method "require")
  arguments: (argument_list
    (string) @import.path)) @import

(call
  method: (identifier) @require_relative (#eq? @require_relative "require_relative")
  arguments: (argument_list
    (string) @import.relative_path)) @import.relative
