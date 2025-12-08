; C/C++ class and struct definitions
; Matches: class Foo { };
;          struct Bar { int x; };

(class_specifier
  name: (type_identifier) @class.name
  body: (field_declaration_list)? @class.body) @class

(struct_specifier
  name: (type_identifier) @struct.name
  body: (field_declaration_list)? @struct.body) @struct
