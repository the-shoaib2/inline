; Ruby method definitions
; Matches: def foo(x, y)
;          def self.bar

(method
  name: (identifier) @method.name
  parameters: (method_parameters)? @method.params) @method

(singleton_method
  object: (self) @singleton.self
  name: (identifier) @singleton.name) @singleton_method
