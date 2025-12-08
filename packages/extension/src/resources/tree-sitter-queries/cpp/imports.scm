; C/C++ include directives
; Matches: #include <stdio.h>
;          #include "myheader.h"

(preproc_include
  path: (system_lib_string) @include.system) @include.system_lib

(preproc_include
  path: (string_literal) @include.local) @include.local_file
