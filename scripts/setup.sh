#!/bin/bash

###############################################################################
# Inline Extension - Quick Setup Script
# 
# This script automates the complete setup process:
# - Install dependencies
# - Build extension
# - Run tests
# - Package extension
# - Install in VS Code
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║          Inline Extension - Quick Setup                      ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Install Dependencies
print_header "Step 1: Installing Dependencies"
print_info "Running: npm install"
npm install
print_success "Dependencies installed"

# Step 2: Clean Previous Builds
print_header "Step 2: Cleaning Previous Builds"
print_info "Running: pnpm run clean"
pnpm run clean
print_success "Build artifacts cleaned"

# Step 3: Build Extension
print_header "Step 3: Building Extension"
print_info "Running build..."
pnpm run build
print_success "Extension built successfully"

# Step 4: Run Linter
print_header "Step 4: Running Linter"
print_info "Running linter..."
pnpm run lint || {
    print_warning "Linting warnings detected"
    print_info "Attempting to fix linting issues..."
    pnpm run lint:fix
}
print_success "Linting complete"

# Step 5: Run Tests
print_header "Step 5: Running Tests"
print_info "This may take a few minutes..."

echo ""
read -p "Run tests? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pnpm test || {
        print_error "Some tests failed, but continuing..."
    }
    print_success "Tests completed"
else
    print_info "Skipping tests"
fi

# Step 6: Package Extension
print_header "Step 6: Packaging Extension"
print_info "Running: pnpm run package"

# Check if vsce is installed
if ! command_exists vsce; then
    print_info "Installing vsce..."
    pnpm install -g @vscode/vsce
fi

pnpm run package
print_success "Extension packaged"

# Find the .vsix file
VSIX_FILE=$(ls -t *.vsix 2>/dev/null | head -1)

if [ -z "$VSIX_FILE" ]; then
    print_error "No .vsix file found"
    exit 1
fi

print_success "Created: $VSIX_FILE"

# Step 7: Install in VS Code
print_header "Step 7: Installing in VS Code"

echo ""
read -p "Install extension in VS Code? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v code &> /dev/null; then
        print_info "Installing extension..."
        code --install-extension "$VSIX_FILE"
        print_success "Extension installed in VS Code"
    else
        print_error "VS Code CLI not found"
        print_info "Install manually: code --install-extension $VSIX_FILE"
    fi
else
    print_info "Skipping installation"
    print_info "To install manually: code --install-extension $VSIX_FILE"
fi

# Step 8: Summary
print_header "Setup Complete! 🎉"

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo -e "${GREEN}✓ Extension built${NC}"
echo -e "${GREEN}✓ Extension packaged${NC}"
echo ""
echo "📦 Package: $VSIX_FILE"
echo ""
echo "Next steps:"
echo "  1. Reload VS Code window"
echo "  2. Open Model Manager: Ctrl+Shift+P → 'Inline: Model Manager'"
echo "  3. Download a model (recommended: DeepSeek-Coder-6.7B)"
echo "  4. Start coding with AI completions!"
echo ""
echo "Documentation:"
echo "  - Quick Start: README.md"
echo "  - E2E Testing: docs/guides/E2E_TESTING_SETUP.md"
echo "  - Release Guide: docs/guides/RELEASE.md"
echo ""
print_success "Setup completed successfully! 🚀"
