# Test Suite

This directory contains the test suite for json-ops, organized into logical modules.

## Test Files

- **`fixtures.ts`** - Shared test data and fixtures used across multiple test files
- **`flat-unflat.test.ts`** - Tests for flatten/unflatten operations
- **`diff.test.ts`** - Tests for diff operation (comparing objects)
- **`apply.test.ts`** - Tests for apply operation (applying diff operations)
- **`real-world.test.ts`** - Real-world use case tests (database ops, config management, etc.)
- **`flat-path-notation.test.ts`** - Tests for flat path notation specification
- **`edge-cases.test.ts`** - Edge cases and complex structure tests
- **`array-replace.test.ts`** - Tests for arrayReplace parameter functionality

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm run test:flat-unflat
npm run test:diff
npm run test:apply
npm run test:real-world
npm run test:flat-path
npm run test:edge-cases
npm run test:array-replace

# Watch mode
npm run test:watch
```

## Test Organization

Tests are organized by functionality:

1. **Core Operations** - flat/unflat, diff, apply
2. **Features** - arrayReplace mode, path notation
3. **Use Cases** - Real-world scenarios
4. **Edge Cases** - Complex structures, performance tests

Total: **119 tests** across 7 test suites
