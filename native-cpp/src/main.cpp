#include <napi.h>
#include "simd_utils.h"
#include "mmap_utils.h"

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "simdSearch"), Napi::Function::New(env, SimdSearch));
  exports.Set(Napi::String::New(env, "mmapRead"), Napi::Function::New(env, MmapRead));
  return exports;
}

NODE_API_MODULE(inline_native_cpp, Init)
