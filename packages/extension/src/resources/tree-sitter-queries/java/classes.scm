; Java class and interface declarations
; Matches: public class Foo extends Bar implements Baz
;          interface MyInterface

(class_declaration
  (modifiers)? @class.modifiers
  name: (identifier) @class.name
  superclass: (superclass)? @class.extends
  interfaces: (super_interfaces)? @class.implements) @class

(interface_declaration
  (modifiers)? @interface.modifiers
  name: (identifier) @interface.name
  extends: (extends_interfaces)? @interface.extends) @interface

(enum_declaration
  name: (identifier) @enum.name) @enum
