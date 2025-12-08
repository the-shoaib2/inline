; Rust function declarations
; Matches: fn foo() -> i32
;          pub fn bar<T>(x: T) -> T
;          async fn baz()

(function_item
  name: (identifier) @function.name
  parameters: (parameters) @function.params
  return_type: (type_identifier)? @function.return_type) @function

(function_item
  "pub" @visibility
  name: (identifier) @public_function.name) @public_function

(function_item
  "async" @async_marker
  name: (identifier) @async_function.name) @async_function
