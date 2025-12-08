; C/C++ function declarations
; Matches: int foo(int x, int y)
;          void* bar()

(function_definition
  type: (primitive_type)? @function.return_type
  declarator: (function_declarator
    declarator: (identifier) @function.name
    parameters: (parameter_list) @function.params)) @function

(declaration
  type: (primitive_type)? @function_decl.return_type
  declarator: (function_declarator
    declarator: (identifier) @function_decl.name)) @function_declaration
