# 🧩 JSON-OPS: Flatten/Unflatten, Diff, and Patch Nested Data Structures

[![npm version](https://badge.fury.io/js/%40garysui%2Fjson-ops.svg)](https://www.npmjs.com/package/@garysui/json-ops)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@garysui/json-ops)](https://bundlephobia.com/package/@garysui/json-ops)
[![Test Coverage](https://img.shields.io/badge/tests-119%20passing-brightgreen.svg)](https://github.com/garysui/json-ops)

This utility provides a powerful, deterministic way to:

- 🔄 Flatten deeply nested JavaScript objects and arrays into symbolic path-value pairs
- 🧠 Compute structural diffs between two data trees
- 🛠 Apply diffs to transform one object into another
- 🫥 Handle `undefined` values safely and reversibly

---

## 🚀 Features

- ✅ Custom symbolic path encoding (e.g. `""`, `"."`, `"@"`, `.x@0.y`)
- ✅ Root-type awareness (primitive, object, array)
- ✅ Full `replaceUndefined` and `restoreUndefined` logic
- ✅ Flat/unflat conversion
- ✅ Sorted key diffing with structure-aware optimizations
- ✅ Reversible and patch-safe

---

## 🧱 Path Notation

| Path     | Meaning                               | Example Input     | Flat Output              |
|----------|----------------------------------------|--------------------|---------------------------|
| `""`     | Root is primitive                      | `42`               | `[{"": 42}]`             |
| `"."`    | Root is object                         | `{}`               | `[{"." : {}}]`           |
| `"@"`    | Root is array                          | `[]`               | `[{"@" : []}]`           |
| `"@0"`   | Array index 0                          | `[1]`              | `[{"@0": 1}]`            |
| `"@0@1"` | Nested array                           | `[[2]]`            | `[{"@0@1": 2}]`          |
| `".x"`   | Object key `"x"`                       | `{ x: 1 }`         | `[{" .x": 1}]`           |
| `".x@1"` | Object → Array                         | `{ x: [10, 11] }`  | `[{" .x@1": 11}]`        |
| `"@0.y"` | Array → Object                         | `[{ y: 5 }]`       | `[{"@0.y": 5}]`          |

---

## ✏️ Visual Diagram

```
Input:
{
  user: {
    name: "Alice",
    roles: ["admin", "editor"],
    profile: {
      age: 30,
      preferences: []
    }
  }
}

Flat Output:
[
  { ".user.name": "Alice" },
  { ".user.roles@0": "admin" },
  { ".user.roles@1": "editor" },
  { ".user.profile.age": 30 },
  { ".user.profile.preferences@": [] }  // empty array marker
]
```

---

## ✨ Usage

### 1. **Flatten a value**

```ts
flat(42)
// → [{ "": 42 }]

flat({ x: [1, 2] })
// → [{ ".x@0": 1 }, { ".x@1": 2 }]

flat([[3]])
// → [{ "@0@0": 3 }]
```

---

### 2. **Unflatten a structure**

```ts
unflat([{ ".x@0": 1 }, { ".x@1": 2 }])
// → { x: [1, 2] }

unflat([{ "@0@0": 3 }])
// → [[3]]
```

---

### 3. **Handle `undefined` values**

```ts
replaceUndefined({ a: undefined })
// → { a: "__UNDEFINED__" }

restoreUndefined({ a: "__UNDEFINED__" })
// → { a: undefined }
```

---

### 4. **Diff two objects**

```ts
diff({ x: 1 }, { x: 2 })
// → [ { type: 'set', path: '.x', value: 2 } ]

diff({ x: {} }, { x: { y: 1 } })
// → [ { type: 'add', path: '.x.y', value: 1 } ]
// (optimized: does not redundantly remove `x` then add again)
```

#### Array Diff Modes

By default, arrays are compared element-by-element:

```ts
diff([1, 2, 3], [1, 2, 4, 5])
// → [
//   { type: 'set', path: '@2', value: 4 },
//   { type: 'add', path: '@3', value: 5 }
// ]
```

Set `arrayReplace: true` to replace entire arrays when their lengths differ:

```ts
diff([1, 2, 3], [1, 2, 4, 5], true)
// → [ { type: 'set', path: '', value: [1, 2, 4, 5] } ]
// Single operation instead of multiple element changes
```

This is useful when:
- Arrays represent atomic values (e.g., tags, permissions)
- You want simpler, more efficient diff operations
- Array order is significant and individual changes aren't meaningful

**Note**: When arrays have the same length, element-by-element comparison is used regardless of the `arrayReplace` setting.

---

### 5. **Apply a diff**

```ts
const obj1 = { x: 1 };
const obj2 = { x: 2 };
const ops = diff(obj1, obj2);

apply(obj1, ops);
// → { x: 2 }
```

---

## 🔍 Internals

- ⚖️ **Idempotent**: `unflat(flat(x))` always reconstructs `x` exactly (after `replaceUndefined` and `restoreUndefined` handling), and `flat(unflat(x))` produces the same flat structure

- Paths use:
  - `.` for object keys
  - `@` for array indices

- Empty arrays/objects are preserved via:
  - `[{"@": []}]` or `[{"." : {}}]`

- Structural diffs optimize away redundant empty structure adds/removes

---

## 🧪 Types

```ts
type DiffOperation = 
  | { type: 'add'; path: string; value: unknown }
  | { type: 'remove'; path: string }
  | { type: 'set'; path: string; value: unknown };
```

---

## 📦 Use Cases

- 🗃️ Comparing edited JSON objects to generate database or API operations
- 🔁 Config/version state diffing
- 🔐 Fine-grained access control enforcement
- 📜 Change tracking for forms or editors
- ☁️ Patchable event systems (like OT or CRDT)
- 🔍 JSON structure testing and assertions

---

## 🛡 Caveats

- Input with raw `undefined` must use `replaceUndefined()` before flattening
- Currently treats mixed object/array roots as objects when ambiguous

---

## 📁 API Reference

### Core Functions

#### `replaceUndefined(obj: T): T`
Replaces all `undefined` values in an object with the marker string `"__UNDEFINED__"`.

**Why:** JavaScript JSON serialization strips `undefined` values. This function preserves them by converting to a safe marker.

```ts
replaceUndefined({ a: 1, b: undefined })
// → { a: 1, b: "__UNDEFINED__" }
```

---

#### `restoreUndefined(obj: T): T | undefined`
Restores all `"__UNDEFINED__"` markers back to actual `undefined` values.

**Use with:** Call after `unflat()` to restore original undefined values.

```ts
restoreUndefined({ a: 1, b: "__UNDEFINED__" })
// → { a: 1, b: undefined }
```

---

#### `flat(obj: unknown): Record<string, unknown>[]`
Flattens a nested object/array structure into an array of path-value pairs.

**Returns:** Array of single-entry objects where keys are flat paths.

```ts
flat({ user: { name: "Alice", roles: ["admin"] } })
// → [
//   { ".user.name": "Alice" },
//   { ".user.roles@0": "admin" }
// ]
```

**Note:** Use `replaceUndefined()` first if your data contains `undefined`.

---

#### `unflat(entries: Record<string, unknown>[]): unknown`
Reconstructs the original nested structure from flattened path-value pairs.

**Inverse of:** `flat()`

```ts
unflat([{ ".user.name": "Alice" }, { ".user.roles@0": "admin" }])
// → { user: { name: "Alice", roles: ["admin"] } }
```

---

#### `diff(a: unknown, b: unknown, arrayReplace?: boolean): DiffOperation[]`
Computes the structural difference between two objects.

**Parameters:**
- `a` - Original object
- `b` - New object
- `arrayReplace` (optional, default: `false`) - When `true`, replaces entire arrays if their lengths differ instead of generating element-by-element operations

**Returns:** Array of operations describing how to transform `a` into `b`

**Operation Types:**
- `{ type: 'add', path: string, value: unknown }` - Add a new property
- `{ type: 'set', path: string, value: unknown }` - Change a value
- `{ type: 'remove', path: string }` - Remove a property

```ts
diff({ x: 1 }, { x: 2, y: 3 })
// → [
//   { type: 'set', path: '.x', value: 2 },
//   { type: 'add', path: '.y', value: 3 }
// ]

// With arrayReplace mode
diff([1, 2], [1, 2, 3, 4], true)
// → [ { type: 'set', path: '', value: [1, 2, 3, 4] } ]
```

---

#### `apply(input: unknown, operations: DiffOperation[]): unknown`
Applies a set of diff operations to transform an object.

**Parameters:**
- `input` - Original object
- `operations` - Array of operations from `diff()`

**Returns:** New object with operations applied

```ts
const obj = { x: 1 }
const ops = diff(obj, { x: 2, y: 3 })
apply(obj, ops)
// → { x: 2, y: 3 }
```

**Use case:** Round-trip transformations
```ts
const result = apply(a, diff(a, b))
// result is equivalent to b
```

---

#### `sortKeys(obj: unknown): unknown`
Recursively sorts object keys alphabetically.

**Why:** Ensures consistent ordering for comparisons and diffs.

```ts
sortKeys({ z: 1, a: 2, m: { y: 3, b: 4 } })
// → { a: 2, m: { b: 4, y: 3 }, z: 1 }
```

---

### Type Definitions

```ts
type DiffOperation =
  | { type: 'add'; path: string; value: unknown }
  | { type: 'remove'; path: string }
  | { type: 'set'; path: string; value: unknown };
```

---

## 🧠 Credits

This pattern draws inspiration from:

- JSON patching
- Operational transforms
- Functional data modeling
- Immutable tree diffs

---

## 📋 Installation

```bash
npm install @garysui/json-ops
```

**Requirements:**
- Node.js 14+
- TypeScript 4.0+ (for TypeScript projects)

---

## 🧪 Testing

The project includes a comprehensive test suite with 119 tests organized into logical modules:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test suites
npm run test:flat-unflat      # Flatten/unflatten operations (18 tests)
npm run test:diff             # Diff operations (24 tests)
npm run test:apply            # Apply operations (19 tests)
npm run test:real-world       # Real-world use cases (5 tests)
npm run test:flat-path        # Path notation tests (19 tests)
npm run test:edge-cases       # Edge cases & complex structures (21 tests)
npm run test:array-replace    # Array replace mode (13 tests)
```

**Test Organization:**
- `test/flat-unflat.test.ts` - Core flatten/unflatten functionality
- `test/diff.test.ts` - Object comparison and diff generation
- `test/apply.test.ts` - Applying operations and round-trips
- `test/real-world.test.ts` - Database ops, configs, forms
- `test/flat-path-notation.test.ts` - Path notation specification
- `test/edge-cases.test.ts` - Deep nesting, large structures, performance
- `test/array-replace.test.ts` - Array replacement mode tests
- `test/fixtures.ts` - Shared test data

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

**Development Setup:**
```bash
git clone https://github.com/garysui/json-ops.git
cd json-ops
npm install
npm test
npm run build
```

---

## 📝 License

MIT License

Copyright (c) 2024 Gary Sui

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 📊 Package Stats

- **Bundle size**: ~8KB minified
- **Dependencies**: Zero runtime dependencies
- **TypeScript**: Full type definitions included
- **Tests**: 119 test cases covering edge cases and real-world scenarios

---

## 🔗 Links

- [npm package](https://www.npmjs.com/package/@garysui/json-ops)
- [GitHub repository](https://github.com/garysui/json-ops)
- [Issues & Bug Reports](https://github.com/garysui/json-ops/issues)
