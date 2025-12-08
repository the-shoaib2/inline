; Java method declarations
; Matches: public void foo()
;          private static int bar(String s)

(method_declaration
  (modifiers)? @method.modifiers
  type: (type_identifier)? @method.return_type
  name: (identifier) @method.name
  parameters: (formal_parameters) @method.params) @method

(constructor_declaration
  (modifiers)? @constructor.modifiers
  name: (identifier) @constructor.name
  parameters: (formal_parameters) @constructor.params) @constructor
