; Query for class declarations in Python
; Matches: class Foo:
;          class Foo(Bar):
;          class Foo(Bar, Baz):

(class_definition
  name: (identifier) @class.name
  superclasses: (argument_list)? @class.superclasses) @class
