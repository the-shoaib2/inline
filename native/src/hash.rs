// use napi::bindgen_prelude::*;
use napi_derive::napi;
use xxhash_rust::xxh3::Xxh3;

/// Generate fast hash for cache keys
/// 
/// Uses xxHash3 which is 10-20x faster than JavaScript's simple hash
/// and provides excellent distribution for cache keys
#[napi]
pub fn hash_prompt(prompt: String) -> String {
    let mut hasher = Xxh3::new();
    hasher.update(prompt.as_bytes());
    format!("{:x}", hasher.digest())
}

/// Generate hash from multiple strings (for composite keys)
#[napi]
pub fn hash_composite(parts: Vec<String>) -> String {
    let mut hasher = Xxh3::new();
    for part in parts {
        hasher.update(part.as_bytes());
    }
    format!("{:x}", hasher.digest())
}

/// Generate 128-bit hash for extra collision resistance
#[napi]
pub fn hash_prompt_128(prompt: String) -> String {
    let mut hasher = Xxh3::new();
    hasher.update(prompt.as_bytes());
    format!("{:032x}", hasher.digest128())
}

/// Streaming hash for large inputs
/// 
/// Useful for hashing large files without loading entirely into memory
#[napi]
pub struct StreamingHasher {
    hasher: Xxh3,
}

#[napi]
impl StreamingHasher {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            hasher: Xxh3::new(),
        }
    }
    
    #[napi]
    pub fn update(&mut self, data: String) {
        self.hasher.update(data.as_bytes());
    }
    
    #[napi]
    pub fn digest(&self) -> String {
        format!("{:x}", self.hasher.digest())
    }
    
    #[napi]
    pub fn digest128(&self) -> String {
        format!("{:032x}", self.hasher.digest128())
    }
    
    #[napi]
    pub fn reset(&mut self) {
        self.hasher = Xxh3::new();
    }
}
