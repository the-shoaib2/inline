; Scala import statements
; Matches: import scala.collection.mutable._
;          import java.util.{List, Map}

(import_declaration
  (stable_identifier) @import.path) @import
