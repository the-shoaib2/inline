; Scala class and trait declarations
; Matches: class Foo extends Bar
;          trait MyTrait

(class_definition
  name: (identifier) @class.name
  (extends_clause)? @class.extends) @class

(trait_definition
  name: (identifier) @trait.name) @trait

(object_definition
  name: (identifier) @object.name) @object
