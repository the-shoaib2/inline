#![deny(clippy::all)]

use napi_derive::napi;

mod ast_parser;
mod semantic_analyzer;
mod text_processor;
mod hash;
mod duplication;

pub use ast_parser::*;
pub use semantic_analyzer::*;
pub use text_processor::*;
pub use hash::*;
pub use duplication::*;

/// Initialize the native module
#[napi]
pub fn init() -> String {
    "Inline native module initialized".to_string()
}

/// Get module version
#[napi]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Check if native module is available
#[napi]
pub fn is_available() -> bool {
    true
}
