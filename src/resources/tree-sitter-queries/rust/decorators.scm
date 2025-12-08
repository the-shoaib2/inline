; Rust attributes (decorators)
; Matches: #[derive(Debug, Clone)]
;          #[test]
;          #[cfg(test)]

(attribute_item
  "#" @attribute.hash
  (attribute
    (identifier) @attribute.name
    (token_tree)? @attribute.args)) @attribute

(attribute_item
  "#" @attribute.hash
  (attribute
    (scoped_identifier) @attribute.scoped_name)) @attribute.scoped
