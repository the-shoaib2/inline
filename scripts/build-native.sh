#!/bin/bash

# Build script for Inline extension with native modules

set -e

echo "🚀 Building Inline Extension with Native Modules"
echo "================================================"

# Colors
GREEN='\033[0.32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo -e "${RED}❌ Rust is not installed${NC}"
    echo "Please install Rust from https://rustup.rs/"
    exit 1
fi

echo -e "${GREEN}✓${NC} Rust found: $(rustc --version)"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js found: $(node --version)"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm is not installed${NC}"
    echo "Installing pnpm..."
    npm install -g pnpm
fi

echo -e "${GREEN}✓${NC} pnpm found: $(pnpm --version)"

# Install dependencies
echo ""
echo -e "${BLUE}📦 Installing dependencies...${NC}"
pnpm install

# Build native modules
echo ""
echo -e "${BLUE}🦀 Building native analyzer (Rust)...${NC}"
cd packages/analyzer
pnpm run build
cd ../..

echo ""
echo -e "${BLUE}🚀 Building native accelerator (C++)...${NC}"
cd packages/accelerator
pnpm run build
cd ../..

echo -e "${GREEN}✓${NC} Native modules built successfully"

# Build TypeScript
echo ""
echo -e "${BLUE}📝 Building TypeScript...${NC}"
pnpm run compile

echo -e "${GREEN}✓${NC} TypeScript compiled successfully"

# Build webview
echo ""
echo -e "${BLUE}🎨 Building webview...${NC}"
cd packages/webview
pnpm run build
cd ../..

echo -e "${GREEN}✓${NC} Webview built successfully"

# Run tests (optional)
if [ "$1" == "--test" ]; then
    echo ""
    echo -e "${BLUE}🧪 Running tests...${NC}"
    
    # Test native modules
    cd packages/analyzer
    cargo test
    cd ../..
    
    # Test TypeScript
    pnpm test
    
    echo -e "${GREEN}✓${NC} All tests passed"
fi

echo ""
echo -e "${GREEN}✅ Build complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Press F5 in VS Code to launch extension"
echo "  2. Or run: pnpm run package"
echo ""
