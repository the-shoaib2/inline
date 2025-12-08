; Solidity import statements and contract definitions
; Matches: import "./MyContract.sol";
;          contract MyContract is ERC20

(import_directive
  (string) @import.path) @import

(contract_declaration
  name: (identifier) @contract.name
  (inheritance_specifier)? @contract.inheritance) @contract

(interface_declaration
  name: (identifier) @interface.name) @interface
