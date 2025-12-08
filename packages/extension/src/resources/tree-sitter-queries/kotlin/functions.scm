; Kotlin function declarations
; Matches: fun foo(): Int
;          suspend fun bar()

(function_declaration
  (modifiers)? @function.modifiers
  name: (simple_identifier) @function.name
  parameters: (function_value_parameters) @function.params
  type: (user_type)? @function.return_type) @function
