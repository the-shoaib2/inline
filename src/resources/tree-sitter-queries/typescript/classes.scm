; Query for class declarations in TypeScript
; Matches: class Foo {}
;          class Foo extends Bar {}
;          class Foo implements IFoo {}
;          export class Foo {}

(class_declaration
  name: (type_identifier) @class.name
  (class_heritage
    (extends_clause
      value: (identifier) @class.extends))?) @class

(class_declaration
  name: (type_identifier) @class_with_implements.name
  (class_heritage
    (implements_clause
      (type_identifier) @class.implements))) @class_with_implements

(interface_declaration
  name: (type_identifier) @interface.name) @interface

(type_alias_declaration
  name: (type_identifier) @type_alias.name) @type_alias
