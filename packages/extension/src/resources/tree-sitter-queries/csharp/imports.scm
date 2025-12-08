; C# using directives
; Matches: using System;
;          using static System.Math;

(using_directive
  (qualified_name) @import.namespace) @import

(using_directive
  "static" @import.static
  (qualified_name) @import.static_namespace) @import.static_using
