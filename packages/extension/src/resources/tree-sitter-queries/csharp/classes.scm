; C# class and interface declarations
; Matches: public class Foo : Bar, IBaz
;          interface IMyInterface

(class_declaration
  (modifier)* @class.modifiers
  name: (identifier) @class.name
  bases: (base_list)? @class.bases) @class

(interface_declaration
  (modifier)* @interface.modifiers
  name: (identifier) @interface.name) @interface

(record_declaration
  name: (identifier) @record.name) @record
