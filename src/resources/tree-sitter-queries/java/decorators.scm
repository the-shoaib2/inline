; Java annotations (decorators)
; Matches: @Override
;          @Deprecated
;          @SuppressWarnings("unchecked")

(marker_annotation
  "@" @annotation.at
  name: (identifier) @annotation.name) @annotation

(annotation
  "@" @annotation.at
  name: (identifier) @annotation.name
  arguments: (annotation_argument_list)? @annotation.args) @annotation.with_args
