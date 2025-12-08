; Go struct and interface definitions
; Matches: type Foo struct { x int }
;          type Bar interface { Method() }

(type_declaration
  (type_spec
    name: (type_identifier) @struct.name
    type: (struct_type) @struct.body)) @struct

(type_declaration
  (type_spec
    name: (type_identifier) @interface.name
    type: (interface_type) @interface.body)) @interface
