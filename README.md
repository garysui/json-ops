# 🧩 JSON-OPS: Flatten/Unflatten, Diff, and Patch Nested Data Structures

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

## 📁 Exports

```ts
replaceUndefined(obj): SafeObject
restoreUndefined(obj): OriginalObject
flat(obj): FlatEntry[]
unflat(entries: FlatEntry[]): OriginalObject
diff(a, b): DiffOperation[]
apply(obj, diff): NewObject
sortKeys(obj): SortedObject
```

---

## 🧠 Credits

This pattern draws inspiration from:

- JSON patching
- Operational transforms
- Functional data modeling
- Immutable tree diffs
