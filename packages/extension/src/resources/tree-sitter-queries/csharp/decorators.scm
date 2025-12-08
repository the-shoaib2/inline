; C# attributes (decorators)
; Matches: [Serializable]
;          [HttpGet("/api/users")]

(attribute_list
  (attribute
    name: (identifier) @attribute.name
    (attribute_argument_list)? @attribute.args)) @attribute
