# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2024-08-03

### Added
- 📝 **MIT License** file added to project root
- 📋 **CHANGELOG.md** for tracking version history and changes
- 🤝 **CONTRIBUTING.md** with comprehensive contribution guidelines
- 🏷️ **Status badges** in README for npm version, license, TypeScript support, bundle size, and test coverage
- 📦 **Improved npm package** configuration with better file inclusion
- 🚫 **Enhanced .npmignore** with comprehensive exclusions for cleaner packages

### Enhanced
- 📚 **README improvements** with installation requirements, development setup, and package stats
- 🔗 **Better project links** including npm package, GitHub repository, and issue tracking
- 📖 **Open source best practices** with proper project structure and documentation

## [2.0.0] - 2024-08-03

### Added
- 🎯 **Comprehensive flat path notation specification** with visual documentation
- 🔄 **Real-world test cases** covering database operations, config management, form tracking, and API responses
- 📊 **Performance and edge case tests** for large structures, deep nesting, and special characters
- 📝 **Enhanced README** with visual diagrams, path notation table, and use case examples
- 🧪 **104+ test cases** ensuring robust functionality across various scenarios
- 📦 **MIT License** and proper open-source project structure

### Enhanced
- ⚡ **Improved path notation examples** covering all combinations (`.key`, `@i`, `.key@i`, `@i.key`)
- 🛡️ **Better edge case handling** for sparse arrays, special characters, and primitive types
- 📚 **Comprehensive documentation** with installation, contribution guidelines, and links
- 🔧 **Better npm package configuration** with proper file exclusions

### Technical
- 🎯 **Zero runtime dependencies** for lightweight integration
- 📦 **~8KB bundle size** with full TypeScript definitions
- ✅ **104 passing tests** covering real-world scenarios
- 🔄 **Round-trip consistency** guaranteed for all data types

## [1.0.2] - Previous Version

### Initial Release
- ⚡ Basic `flat`, `unflat`, `diff`, `apply` functionality
- 🔧 `replaceUndefined` and `restoreUndefined` utilities
- 📝 `sortKeys` for deterministic object ordering
- 🧪 Basic test coverage

---

## Migration Guide

### From 1.x to 2.x

No breaking changes in the API. Version 2.0.0 is a major documentation and testing enhancement:

- ✅ All existing code continues to work
- ✅ Enhanced documentation and examples
- ✅ More comprehensive test coverage
- ✅ Better npm package structure

```typescript
// All existing usage remains the same
import { flat, unflat, diff, apply } from '@garysui/json-ops';

const flattened = flat({ x: [1, 2] });
// Still works exactly as before
```