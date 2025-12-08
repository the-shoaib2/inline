; C# method declarations
; Matches: public void Foo()
;          private async Task<int> Bar()

(method_declaration
  (modifier)* @method.modifiers
  type: (predefined_type)? @method.return_type
  name: (identifier) @method.name
  parameters: (parameter_list) @method.params) @method

(constructor_declaration
  (modifier)* @constructor.modifiers
  name: (identifier) @constructor.name
  parameters: (parameter_list) @constructor.params) @constructor
