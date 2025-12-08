; Java generics
; Matches: class Foo<T extends Bar>
;          List<String>

(type_parameters
  (type_parameter
    name: (type_identifier) @generic.param
    (type_bound)? @generic.constraint)) @generic.declaration

(type_arguments
  (type_identifier) @generic.argument) @generic.usage
