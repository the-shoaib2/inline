; Go function declarations
; Matches: func foo() int
;          func (r *Receiver) method() error

(function_declaration
  name: (identifier) @function.name
  parameters: (parameter_list) @function.params
  result: (parameter_list)? @function.return) @function

(method_declaration
  receiver: (parameter_list) @method.receiver
  name: (field_identifier) @method.name
  parameters: (parameter_list) @method.params) @method
