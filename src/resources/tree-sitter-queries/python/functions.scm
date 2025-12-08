; Query for function declarations in Python
; Matches: def foo():
;          async def foo():
;          def foo(a, b):
;          def foo() -> int:

(function_definition
  name: (identifier) @function.name
  parameters: (parameters) @function.params
  return_type: (type)? @function.return_type) @function

(function_definition
  "async" @async_marker
  name: (identifier) @async_function.name
  parameters: (parameters) @async_function.params) @async_function
