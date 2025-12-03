#!/bin/bash

###############################################################################
# Inline Extension - Automated Release Script
# 
# This script automates the entire release process:
# - Version bumping (major, minor, patch)
# - Changelog generation and updates
# - Catalog updates
# - Building and packaging
# - Git tagging and pushing
# - GitHub release creation (optional)
#
# Usage:
#   ./release.sh [major|minor|patch] [release-notes]
#
# Examples:
#   ./release.sh patch "Bug fixes and improvements"
#   ./release.sh minor "New model support added"
#   ./release.sh major "Breaking changes in API"
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

###############################################################################
# Helper Functions
###############################################################################

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

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Validate prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("node")
    fi
    
    if ! command_exists pnpm; then
        missing_deps+=("pnpm")
    fi
    
    if ! command_exists git; then
        missing_deps+=("git")
    fi
    
    if ! command_exists jq; then
        print_warning "jq not found - JSON parsing will be limited"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        exit 1
    fi
    
    print_success "All prerequisites satisfied"
}

# Get current version from package.json
get_current_version() {
    if command_exists jq; then
        jq -r '.version' package.json
    else
        grep -o '"version": *"[^"]*"' package.json | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+'
    fi
}

# Bump version
bump_version() {
    local bump_type=$1
    local current_version=$(get_current_version)
    
    print_info "Current version: $current_version"
    
    # Parse version
    IFS='.' read -r -a version_parts <<< "$current_version"
    local major="${version_parts[0]}"
    local minor="${version_parts[1]}"
    local patch="${version_parts[2]}"
    
    # Bump based on type
    case $bump_type in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
        *)
            print_error "Invalid bump type: $bump_type (use: major, minor, or patch)"
            exit 1
            ;;
    esac
    
    NEW_VERSION="$major.$minor.$patch"
    print_success "New version: $NEW_VERSION"
}

# Update package.json version
update_package_version() {
    print_info "Updating package.json..."
    
    if command_exists jq; then
        # Use jq for clean JSON manipulation
        local temp_file=$(mktemp)
        jq ".version = \"$NEW_VERSION\"" package.json > "$temp_file"
        mv "$temp_file" package.json
    else
        # Fallback to sed
        sed -i.bak "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" package.json
        rm package.json.bak
    fi
    
    print_success "package.json updated"
}

# Update CHANGELOG.md
update_changelog() {
    local release_notes=$1
    local release_date=$(date +%Y-%m-%d)
    
    print_info "Updating CHANGELOG.md..."
    
    # Create temporary file
    local temp_file=$(mktemp)
    
    # Read existing changelog
    if [ -f "CHANGELOG.md" ]; then
        # Insert new version after "## [Unreleased]" section
        awk -v version="$NEW_VERSION" -v date="$release_date" -v notes="$release_notes" '
        /## \[Unreleased\]/ {
            print $0
            print ""
            print "### Planned"
            print "- Future enhancements"
            print ""
            print "---"
            print ""
            print "## [" version "] - " date
            print ""
            print "### Changed"
            print notes
            print ""
            next
        }
        /## Release Catalog/ {
            print $0
            print ""
            print "| Version | Release Date | Type | Status | Download |"
            print "|---------|--------------|------|--------|----------|"
            print "| " version " | " date " | Release | Stable | [Download](https://github.com/inline/inline/releases/tag/v" version ") |"
            # Skip the existing table header
            getline; getline; getline
            next
        }
        { print }
        ' CHANGELOG.md > "$temp_file"
        
        mv "$temp_file" CHANGELOG.md
        print_success "CHANGELOG.md updated"
    else
        print_warning "CHANGELOG.md not found, skipping"
    fi
}

# Update CATALOG.md
update_catalog() {
    local release_date=$(date +%Y-%m-%d)
    
    print_info "Updating CATALOG.md..."
    
    if [ -f "CATALOG.md" ]; then
        local temp_file=$(mktemp)
        
        # Update version history and statistics
        awk -v version="$NEW_VERSION" -v date="$release_date" '
        /## Release History/ {
            print $0
            print ""
            print "### Version " version " (" date ")"
            print "**Status**: Stable | **Type**: Release"
            print ""
            print "#### Downloads"
            print "- **VSIX Package**: inline-" version ".vsix"
            print "- **Source Code**: [v" version "](https://github.com/inline/inline/releases/tag/v" version ")"
            print ""
            print "---"
            print ""
            next
        }
        /\*\*Last Updated\*\*:/ {
            print "**Last Updated**: " date
            next
        }
        { print }
        ' CATALOG.md > "$temp_file"
        
        mv "$temp_file" CATALOG.md
        print_success "CATALOG.md updated"
    else
        print_warning "CATALOG.md not found, skipping"
    fi
}

# Run tests
run_tests() {
    print_header "Running Tests"
    
    print_info "Running linter..."
    pnpm run lint || {
        print_warning "Linting warnings detected"
    }
    
    print_info "Running unit tests..."
    pnpm run test:unit || {
        print_error "Unit tests failed"
        exit 1
    }
    
    print_success "All tests passed"
}

# Build extension
build_extension() {
    print_header "Building Extension"
    
    print_info "Cleaning previous build..."
    pnpm run clean || true
    
    print_info "Installing dependencies..."
    pnpm install
    
    print_info "Compiling TypeScript..."
    pnpm run build
    
    print_success "Build completed"
}

# Package extension
package_extension() {
    print_header "Packaging Extension"
    
    # Check if vsce is installed
    if ! command_exists vsce; then
        print_info "Installing vsce..."
        pnpm install -g @vscode/vsce
    fi
    
    print_info "Creating VSIX package..."
    vsce package
    
    local vsix_file="inline-${NEW_VERSION}.vsix"
    if [ -f "$vsix_file" ]; then
        print_success "Package created: $vsix_file"
        VSIX_FILE="$vsix_file"
    else
        print_error "Package creation failed"
        exit 1
    fi
}

# Git operations
git_operations() {
    print_header "Git Operations"
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_info "Staging changes..."
        git add package.json CHANGELOG.md CATALOG.md
        
        print_info "Committing changes..."
        git commit -m "chore: release v${NEW_VERSION}"
        
        print_success "Changes committed"
    fi
    
    # Create git tag
    print_info "Creating git tag v${NEW_VERSION}..."
    git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}"
    
    print_success "Git tag created"
    
    # Ask to push
    read -p "Push changes to remote? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Pushing to remote..."
        git push origin main
        git push origin "v${NEW_VERSION}"
        print_success "Changes pushed to remote"
    else
        print_warning "Skipped pushing to remote"
        print_info "To push manually, run:"
        print_info "  git push origin main"
        print_info "  git push origin v${NEW_VERSION}"
    fi
}

# Create GitHub release
create_github_release() {
    print_header "GitHub Release"
    
    if ! command_exists gh; then
        print_warning "GitHub CLI (gh) not found - skipping GitHub release"
        print_info "Install gh: https://cli.github.com/"
        return
    fi
    
    read -p "Create GitHub release? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Creating GitHub release..."
        
        gh release create "v${NEW_VERSION}" \
            "$VSIX_FILE" \
            --title "v${NEW_VERSION}" \
            --notes "Release v${NEW_VERSION}" \
            --latest
        
        print_success "GitHub release created"
    else
        print_warning "Skipped GitHub release"
    fi
}

# Generate release summary
generate_summary() {
    print_header "Release Summary"
    
    echo -e "${GREEN}Release v${NEW_VERSION} completed successfully!${NC}\n"
    echo "📦 Package: $VSIX_FILE"
    echo "🏷️  Git Tag: v${NEW_VERSION}"
    echo "📝 Changelog: Updated"
    echo "📚 Catalog: Updated"
    echo ""
    echo "Next steps:"
    echo "  1. Review the changes"
    echo "  2. Test the VSIX package"
    echo "  3. Publish to VS Code Marketplace (if ready)"
    echo ""
    echo "To publish to marketplace:"
    echo "  vsce publish"
    echo ""
}

###############################################################################
# Main Script
###############################################################################

main() {
    # Parse arguments
    local bump_type=${1:-patch}
    local release_notes=${2:-"Release updates and improvements"}
    
    # Print banner
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║          Inline Extension - Automated Release                ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Run release process
    check_prerequisites
    bump_version "$bump_type"
    
    # Confirm release
    echo ""
    read -p "Proceed with release v${NEW_VERSION}? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Release cancelled"
        exit 1
    fi
    
    update_package_version
    update_changelog "$release_notes"
    update_catalog
    run_tests
    build_extension
    package_extension
    git_operations
    create_github_release
    generate_summary
    
    print_success "Release process completed! 🎉"
}

# Run main function
main "$@"
