; Ruby class definitions
; Matches: class Foo < Bar
;          module MyModule

(class
  name: (constant) @class.name
  superclass: (superclass)? @class.superclass) @class

(module
  name: (constant) @module.name) @module
