; Swift function declarations
; Matches: func foo() -> Int
;          public func bar<T>(x: T) -> T

(function_declaration
  (modifiers)? @function.modifiers
  name: (simple_identifier) @function.name
  parameters: (parameter)* @function.params
  result: (type_annotation)? @function.return_type) @function
