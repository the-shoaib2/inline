(decorator
  (identifier) @decorator.name)

(decorator
  (call_expression
    function: (identifier) @decorator.name
    arguments: (arguments) @decorator.args))

(decorator
  (call_expression
    function: (member_expression) @decorator.name
    arguments: (arguments) @decorator.args))
