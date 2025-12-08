; Scala function declarations
; Matches: def foo(x: Int): Int
;          def bar[T](x: T): T

(function_definition
  name: (identifier) @function.name
  parameters: (parameters) @function.params
  type: (type)? @function.return_type) @function
