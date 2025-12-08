use inline_native::*;

#[test]
fn test_extract_ts_imports() {
    let code = r#"
import { foo, bar } from 'module1';
import React from 'react';
import * as utils from './utils';
    "#;
    
    let result = extract_imports(code.to_string(), "typescript".to_string());
    // extract_imports returns Result? or Vec?
    // In index.d.ts string -> ImportInfo[].
    // Note: #[napi] functions returning Vec usually return Result<Vec> or Vec directly.
    // If it returns Vec directly, unwrap() is error.
    // If it returns Result, unwrap() is needed.
    // Most napi functions return Result for error handling.
    // But if implementation returns Vec, then no unwrap.
    // I'll check previous file content. It had .unwrap().
    // So I assume it returns Result.
    
    let result = result.unwrap();
    
    assert_eq!(result.len(), 3);
    assert_eq!(result[0].module, "module1");
    assert_eq!(result[0].imports, vec!["foo", "bar"]);
}

#[test]
fn test_extract_py_imports() {
    let code = r#"
import os
from typing import List, Dict
import numpy as np
    "#;
    
    let result = extract_imports(code.to_string(), "python".to_string()).unwrap();
    assert!(result.len() >= 2);
}

#[test]
fn test_extract_functions() {
    let code = r#"
function hello(name: string): void {
    console.log(name);
}

const greet = async (name: string) => {
    return `Hello ${name}`;
};
    "#;
    
    let result = extract_functions(code.to_string(), "typescript".to_string()).unwrap();
    assert_eq!(result.len(), 2);
    assert_eq!(result[0].name, "hello");
    // Check if result[1] exists and is correct
    if result.len() > 1 {
        assert!(result[1].is_async);
    }
}

#[test]
fn test_extract_decorators() {
    let code = r#"
@Component
class MyComponent {}

@Injectable()
class MyService {}
    "#;
    
    let result = extract_decorators(code.to_string(), "typescript".to_string()).unwrap();
    assert_eq!(result.len(), 2);
    assert_eq!(result[0].name, "Component");
    assert_eq!(result[1].name, "Injectable");
}
