; Elixir function definitions
; Matches: def foo(x, y)
;          defp bar()

(call
  target: (identifier) @def_keyword (#match? @def_keyword "^def")
  (arguments
    (call
      target: (identifier) @function.name))) @function
