; Rust struct and impl definitions
; Matches: struct Point { x: i32, y: i32 }
;          impl Trait for Type {}
;          struct Generic<T> { value: T }

(struct_item
  name: (type_identifier) @struct.name
  body: (field_declaration_list)? @struct.fields) @struct

(impl_item
  trait: (type_identifier)? @impl.trait
  type: (type_identifier) @impl.type) @impl

(enum_item
  name: (type_identifier) @enum.name) @enum
