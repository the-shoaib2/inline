#!/bin/bash

###############################################################################
# Memory Optimization Quick Fix Script
# 
# This script applies immediate fixes for high memory usage
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

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║          Memory Optimization - Quick Fix                     ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Clear Extension Cache
print_header "Step 1: Clearing Extension Cache"
CACHE_DIR="$HOME/.vscode/extensions/inline.inline-*/resources/cache"
if [ -d "$CACHE_DIR" ]; then
    rm -rf $CACHE_DIR/*
    print_success "Cache cleared"
else
    print_info "No cache directory found"
fi

# Step 2: Rebuild Extension
print_header "Step 2: Rebuilding Extension"
pnpm run clean
pnpm run build
print_success "Extension rebuilt"

# Step 3: Update Settings
print_header "Step 3: Applying Optimized Settings"

SETTINGS_FILE="$HOME/.vscode/settings.json"
BACKUP_FILE="$HOME/.vscode/settings.json.backup"

# Backup existing settings
if [ -f "$SETTINGS_FILE" ]; then
    cp "$SETTINGS_FILE" "$BACKUP_FILE"
    print_success "Settings backed up to $BACKUP_FILE"
fi

# Add optimized settings
cat >> "$SETTINGS_FILE" << 'EOF'
{
  "inline.maxCacheSize": 50,
  "inline.maxTokens": 256,
  "inline.memoryLimit": 500,
  "inline.network.timeout": 1000,
  "inline.network.autoSelectFamilyAttemptTimeout": 1000,
  "inline.resourceMonitoring": true,
  "inline.autoCleanup": true
}
EOF

print_success "Optimized settings applied"

# Step 4: Summary
print_header "Quick Fix Complete! 🎉"

echo -e "${GREEN}✓ Cache cleared${NC}"
echo -e "${GREEN}✓ Extension rebuilt${NC}"
echo -e "${GREEN}✓ Settings optimized${NC}"
echo ""
echo "Next steps:"
echo "  1. Restart VS Code: Ctrl+Shift+P → 'Developer: Reload Window'"
echo "  2. Monitor memory: Ctrl+Shift+P → 'Developer: Show Running Extensions'"
echo "  3. Check logs: Ctrl+Shift+P → 'Inline: Show Logs'"
echo ""
echo "If memory issues persist:"
echo "  - See docs/guides/MEMORY_OPTIMIZATION.md"
echo "  - Reduce model size"
echo "  - Disable resource-intensive features"
echo ""
print_success "Memory optimization applied! 🚀"
