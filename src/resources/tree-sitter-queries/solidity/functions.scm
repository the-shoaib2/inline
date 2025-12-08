; Solidity function declarations
; Matches: function foo() public returns (uint)
;          function bar() private view

(function_definition
  name: (identifier) @function.name
  parameters: (parameter_list) @function.params
  (visibility)? @function.visibility
  (state_mutability)? @function.mutability
  returns: (return_parameters)? @function.returns) @function
