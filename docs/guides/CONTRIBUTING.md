# Contributing to Inline

Thank you for your interest in contributing to Inline! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 18.x or higher
- VS Code 1.85.0 or higher
- Git

### Getting Started

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/inline.git
   cd inline
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Compile**
   ```bash
   npm run compile
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## Project Structure

See [docs/FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md) for detailed folder structure.

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write code in `src/`
- Add tests in `test/`
- Update documentation in `docs/`

### 3. Test Your Changes

```bash
npm run compile
npm test
npm run lint
```

### 4. Commit

Follow conventional commits:

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
git commit -m "docs: update readme"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style

- Use TypeScript
- Follow ESLint rules (`.eslintrc.yml`)
- Write tests for new features
- Document public APIs

## Testing

See [guides/testing.md](guides/testing.md) for testing guide.

## Questions?

- Open an issue on GitHub
- Join our Discord community
- Check existing documentation

Thank you for contributing! 🎉
