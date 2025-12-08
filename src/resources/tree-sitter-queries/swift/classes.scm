; Swift class, struct, and protocol declarations
; Matches: class Foo: Bar
;          struct Point { }
;          protocol MyProtocol { }

(class_declaration
  name: (type_identifier) @class.name
  (type_inheritance_clause)? @class.inheritance) @class

(struct_declaration
  name: (type_identifier) @struct.name) @struct

(protocol_declaration
  name: (type_identifier) @protocol.name) @protocol
