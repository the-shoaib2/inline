; Query for decorators in TypeScript
; Matches: @Component({ ... })
;          @Injectable()
;          @Input()

(decorator
  "@" @decorator.at
  (call_expression
    function: (identifier) @decorator.name
    arguments: (arguments) @decorator.args)?) @decorator

(decorator
  "@" @decorator.at
  (identifier) @decorator.simple_name) @decorator.simple
