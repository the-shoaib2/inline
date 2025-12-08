; PHP function declarations
; Matches: function foo($x, $y)
;          public function bar()

(function_definition
  name: (name) @function.name
  parameters: (formal_parameters) @function.params) @function

(method_declaration
  (visibility_modifier)? @method.visibility
  name: (name) @method.name
  parameters: (formal_parameters) @method.params) @method
