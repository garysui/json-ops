# Contributing to JSON-OPS

Thank you for your interest in contributing to JSON-OPS! 🎉

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/json-ops.git
   cd json-ops
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Run tests** to ensure everything works:
   ```bash
   npm test
   ```

## Development Workflow

### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and ensure they follow the project conventions

3. **Add tests** for any new functionality:
   - Add unit tests to `src/index.test.ts`
   - Ensure all tests pass: `npm test`
   - Aim for comprehensive coverage of edge cases

4. **Build the project**:
   ```bash
   npm run build
   ```

5. **Commit your changes** with a descriptive message:
   ```bash
   git commit -m "feat: add support for custom path separators"
   ```

### Commit Message Convention

We follow a simple convention for commit messages:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `test:` for adding tests
- `refactor:` for code refactoring
- `perf:` for performance improvements

### Testing

- **Run all tests**: `npm test`
- **Run tests in watch mode**: `npm run test:watch`
- **Build project**: `npm run build`

Please ensure:
- ✅ All existing tests pass
- ✅ New functionality has corresponding tests
- ✅ Code builds without TypeScript errors
- ✅ Tests cover edge cases and real-world scenarios

## Types of Contributions

### 🐛 Bug Reports

When filing a bug report, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Minimal code example
- Environment details (Node.js version, etc.)

### 💡 Feature Requests

For feature requests, please:
- Describe the use case
- Explain why it would be valuable
- Consider backward compatibility
- Provide example usage if possible

### 📝 Documentation

Documentation improvements are always welcome:
- Fix typos or unclear explanations
- Add more examples
- Improve API documentation
- Enhance README sections

### 🧪 Tests

Help us improve test coverage:
- Add edge case tests
- Add real-world scenario tests
- Improve test descriptions
- Add performance benchmarks

## Code Style

- **TypeScript**: Use TypeScript with strict mode
- **Formatting**: Code is automatically formatted (no specific formatter required)
- **Naming**: Use descriptive variable and function names
- **Comments**: Add comments for complex logic only

## Pull Request Process

1. **Ensure tests pass** and build succeeds
2. **Update documentation** if needed
3. **Create a pull request** with:
   - Clear title describing the change
   - Description of what changed and why
   - Link to any related issues
   - Screenshots/examples if applicable

4. **Address review feedback** promptly
5. **Squash commits** if requested

## Release Process

Releases are handled by maintainers:
1. Version bump in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag
4. Publish to npm

## Questions?

- 💬 **Discussions**: Use GitHub Discussions for questions
- 🐛 **Issues**: Use GitHub Issues for bugs
- 📧 **Direct contact**: For sensitive matters only

## Code of Conduct

Please be respectful and constructive in all interactions. We want this to be a welcoming space for all contributors.

---

Thank you for contributing to JSON-OPS! 🚀