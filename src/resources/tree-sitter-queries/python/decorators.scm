; Query for decorators in Python
; Matches: @property
;          @staticmethod
;          @decorator(args)
;          @app.route('/path')

(decorator
  "@" @decorator.at
  (identifier) @decorator.name) @decorator.simple

(decorator
  "@" @decorator.at
  (call
    function: (identifier) @decorator.name
    arguments: (argument_list) @decorator.args)?) @decorator.call

(decorator
  "@" @decorator.at
  (attribute
    object: (identifier) @decorator.object
    attribute: (identifier) @decorator.attribute)) @decorator.attribute
