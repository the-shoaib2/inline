# Release Guide

This guide explains how to use the automated release system for the Inline extension.

## Quick Start

```bash
# Patch release (bug fixes)
./release.sh patch "Fixed completion cache bug"

# Minor release (new features)
./release.sh minor "Added new model support"

# Major release (breaking changes)
./release.sh major "Redesigned model management API"
```

## What the Release Script Does

The `release.sh` script automates the entire release process:

1. **Version Bumping** - Automatically increments version in `package.json`
2. **Changelog Update** - Adds new version entry to `CHANGELOG.md`
3. **Catalog Update** - Updates `CATALOG.md` with release information
4. **Testing** - Runs linter and all test suites
5. **Building** - Compiles TypeScript and builds the extension
6. **Packaging** - Creates `.vsix` package file
7. **Git Operations** - Commits changes and creates git tags
8. **GitHub Release** - Optionally creates GitHub release (requires `gh` CLI)

## Prerequisites

### Required
- Node.js 18.x or higher
- npm
- git

### Optional
- `jq` - For better JSON parsing (recommended)
- `gh` - GitHub CLI for automated GitHub releases

### Installing Optional Tools

```bash
# macOS
brew install jq gh

# Ubuntu/Debian
sudo apt-get install jq gh

# Windows (using Chocolatey)
choco install jq gh
```

## Release Types

### Patch Release (0.1.0 → 0.1.1)
Use for bug fixes and minor improvements that don't add new features.

```bash
./release.sh patch "Bug fixes and improvements"
```

**Examples:**
- Fixed completion latency issue
- Corrected model download error handling
- Updated dependencies

### Minor Release (0.1.0 → 0.2.0)
Use for new features that don't break existing functionality.

```bash
./release.sh minor "Added support for new models"
```

**Examples:**
- Added new model support
- Implemented new UI features
- Enhanced performance optimizations

### Major Release (0.1.0 → 1.0.0)
Use for breaking changes or significant rewrites.

```bash
./release.sh major "Redesigned model management system"
```

**Examples:**
- Breaking API changes
- Complete UI redesign
- Major architecture changes

## Step-by-Step Process

### 1. Prepare Your Changes

Ensure all your changes are committed:

```bash
git status
git add .
git commit -m "Your changes"
```

### 2. Run Release Script

```bash
./release.sh [patch|minor|major] "Release notes"
```

### 3. Review and Confirm

The script will show you:
- Current version
- New version
- Changes to be made

Confirm to proceed.

### 4. Automated Steps

The script will automatically:
- Update `package.json`
- Update `CHANGELOG.md`
- Update `CATALOG.md`
- Run tests
- Build extension
- Create `.vsix` package

### 5. Git Operations

The script will ask if you want to:
- Push changes to remote
- Create GitHub release

## Manual Release Process

If you prefer manual control:

### 1. Update Version

```bash
# Edit package.json manually
# Change "version": "0.1.0" to "0.2.0"
```

### 2. Update Changelog

```bash
# Edit CHANGELOG.md
# Add new version section with changes
```

### 3. Update Catalog

```bash
# Edit CATALOG.md
# Add new release entry
```

### 4. Build and Test

```bash
npm run lint
npm test
npm run build
npm run package
```

### 5. Git Tag and Push

```bash
git add .
git commit -m "chore: release v0.2.0"
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin main
git push origin v0.2.0
```

### 6. Create GitHub Release

```bash
gh release create v0.2.0 \
  inline-0.2.0.vsix \
  --title "v0.2.0" \
  --notes "Release notes here"
```

## Publishing to VS Code Marketplace

After creating a release, publish to the marketplace:

### 1. Get Publisher Access Token

1. Go to https://dev.azure.com/
2. Create a Personal Access Token (PAT)
3. Set scope to "Marketplace (Manage)"

### 2. Login to vsce

```bash
vsce login inline-ai
# Enter your PAT when prompted
```

### 3. Publish

```bash
# Publish current version
vsce publish

# Or publish specific version
vsce publish 0.2.0
```

## Troubleshooting

### Script Permission Denied

```bash
chmod +x release.sh
```

### Tests Failing

Fix tests before releasing:

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

### Git Push Rejected

Ensure you have push access and pull latest changes:

```bash
git pull origin main
./release.sh patch "Your changes"
```

### Package Creation Failed

Check for build errors:

```bash
npm run build
npm run lint
```

## Best Practices

1. **Always test before releasing**
   ```bash
   npm test
   ```

2. **Write meaningful release notes**
   - Be specific about changes
   - Mention breaking changes
   - Credit contributors

3. **Follow semantic versioning**
   - MAJOR: Breaking changes
   - MINOR: New features
   - PATCH: Bug fixes

4. **Review generated files**
   - Check `CHANGELOG.md`
   - Verify `CATALOG.md`
   - Review `package.json`

5. **Tag releases properly**
   - Use `v` prefix (v0.1.0)
   - Include release notes
   - Sign tags if possible

## Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md reviewed
- [ ] Version number correct
- [ ] Git tags created
- [ ] GitHub release created
- [ ] Marketplace published
- [ ] Release announced

## Examples

### Bug Fix Release

```bash
./release.sh patch "Fixed model download timeout issue"
```

### Feature Release

```bash
./release.sh minor "Added support for CodeGemma-2B model and improved caching"
```

### Breaking Change Release

```bash
./release.sh major "Redesigned model management API - see migration guide"
```

## Rollback

If you need to rollback a release:

```bash
# Delete local tag
git tag -d v0.2.0

# Delete remote tag
git push origin :refs/tags/v0.2.0

# Revert commit
git revert HEAD

# Delete GitHub release
gh release delete v0.2.0
```

## Support

For issues with the release process:
- Check the script output for errors
- Review the troubleshooting section
- Open an issue on GitHub
