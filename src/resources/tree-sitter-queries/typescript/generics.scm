; Query for generics in TypeScript
; Matches: <T extends Base>
;          <T, U>
;          Array<string>

(type_parameters
  (type_parameter
    name: (type_identifier) @generic.param
    constraint: (type_annotation
      (type_identifier) @generic.constraint)?)?) @generic.type_params

(type_arguments
  (type_identifier) @generic.type_arg) @generic.type_args
