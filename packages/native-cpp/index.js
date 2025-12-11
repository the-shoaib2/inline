const path = require('path');

let nativeModule;

try {
    // Try to load the native module from the build directory
    nativeModule = require(path.join(__dirname, 'build', 'Release', 'inline_native_cpp.node'));
} catch (error) {
    console.warn('Failed to load C++ native module:', error.message);
    // Provide stub implementations as fallback
    nativeModule = {
        simdSearch: (text, pattern) => {
            // Fallback to standard JavaScript indexOf
            return text.indexOf(pattern);
        },
        mmapRead: (filePath) => {
            // Not available without native module
            throw new Error('mmapRead requires native C++ module');
        }
    };
}

module.exports = nativeModule;
