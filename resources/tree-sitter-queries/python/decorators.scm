(decorator
  (identifier) @decorator.name)

(decorator
  (call
    function: (identifier) @decorator.name
    arguments: (argument_list) @decorator.args))

(decorator
  (call
    function: (attribute) @decorator.name
    arguments: (argument_list) @decorator.args))
