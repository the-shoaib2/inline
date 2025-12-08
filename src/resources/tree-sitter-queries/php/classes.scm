; PHP class declarations
; Matches: class Foo extends Bar implements Baz

(class_declaration
  name: (name) @class.name
  base_clause: (base_clause)? @class.extends
  class_interface_clause: (class_interface_clause)? @class.implements) @class
