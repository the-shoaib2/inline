; Kotlin class declarations
; Matches: class Foo : Bar
;          data class Point(val x: Int)

(class_declaration
  (modifiers)? @class.modifiers
  name: (type_identifier) @class.name
  (delegation_specifiers)? @class.inheritance) @class

(object_declaration
  name: (type_identifier) @object.name) @object
