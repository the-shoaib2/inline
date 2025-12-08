; Query for function declarations in TypeScript
; Matches: function foo() {}
;          async function foo() {}
;          const foo = () => {}
;          const foo = async () => {}

(function_declaration
  name: (identifier) @function.name
  parameters: (formal_parameters) @function.params) @function

(method_definition
  name: (property_identifier) @method.name
  parameters: (formal_parameters) @method.params) @method

(arrow_function
  parameters: (formal_parameters) @arrow.params) @arrow_function

(variable_declarator
  name: (identifier) @var_function.name
  value: (arrow_function) @var_function.value) @var_function

(variable_declarator
  name: (identifier) @async_var_function.name
  value: (arrow_function
    async: "async" @async_marker)) @async_var_function
