# json-ops

Simple utility functions for JSON operations

## Installation

```bash
npm install json-ops
```

## Usage

```typescript
import { flat, unflat, diff, apply, sortKeys, replaceUndefined, restoreUndefined } from 'json-ops';

// Flatten and unflatten objects
const flattened = flat(obj);
const restored = unflat(flattened);

// Compare objects and get diff operations
const operations = diff(oldObj, newObj);

// Apply operations to transform objects
const result = apply(inputObj, operations);

// Sort object keys recursively
const sorted = sortKeys(unsortedObj);

// Handle undefined values
const withoutUndefined = replaceUndefined(objWithUndefined);
const withUndefined = restoreUndefined(withoutUndefined);
```

## API

### `flat(obj: any): string[]`

Flattens a JSON object or value. 
**Parameters:**
- `obj` - The object or value to flatten

**Returns:**
- The flattened object

**Examples:**
```typescript
flat(replaceUndefined(undefined)) // => [{"":"__UNDEFINED__"}]
flat(0) // => [{"":0}]
flat(1) // => [{"":1}]
flat("hello") // => [{"":"hello"}]
flat(null) // => [{"":null}]
flat([]) // => [{"[]":0}]
flat([1, 2, 3]) // => [{"[0]":1},{"[1]":2},{"[2]":3}]
flat([1, [2, 3]]) // => [{"[0]":1},{"[1][0]":2},{"[1][1]":3}]
flat({}) // => [{".":0}]
flat({x: 1, y: 2}) // => [{".x":1},{".y":2}]
flat({x: {y: 2}}) // => [{".x.y":2}]
```

**Limitations:**
- `bigint` values are not supported as they don't serialize well to JSON
- `undefined` values may not serialize consistently across different environments
- `symbol` values are not supported as they are not serializable in JSON

**Working with Plain JavaScript Objects containing `undefined`:**
If you need to use `flat` with plain JavaScript objects that contain `undefined` values, pretreat them with `replaceUndefined` and restore them with `restoreUndefined`:

```typescript
import { flat, unflat, replaceUndefined, restoreUndefined } from 'json-ops';

const obj = { a: 1, b: undefined, c: [2, undefined, 3] };

// Pretreat with replaceUndefined
const replaced = replaceUndefined(obj);
const flattened = flat(replaced);
const unflattened = unflat(flattened);
// Restore undefined values
const restored = restoreUndefined(unflattened);

console.log(restored); // { a: 1, b: undefined, c: [2, undefined, 3] }
```

### `diff(a: unknown, b: unknown): DiffOperation[]`

Compares two objects and returns an array of operations needed to transform object `a` into object `b`. Uses `sortKeys` and `flat` internally for consistent comparison. Optimizes empty-to-filled transitions by avoiding unnecessary remove operations.

**Parameters:**
- `a` - The source object/value
- `b` - The target object/value

**Returns:**
- Array of diff operations with types: `add`, `remove`, or `set`

**Operation Types:**
```typescript
type DiffOperation = 
  | { type: 'add'; path: string; value: unknown }    // Add new path
  | { type: 'remove'; path: string }                 // Remove existing path  
  | { type: 'set'; path: string; value: unknown };   // Change existing value
```

**Examples:**
```typescript
// Simple object differences
diff({ x: 1, y: 2 }, { x: 1, y: 3, z: 4 })
// => [
//   { type: 'set', path: '.y', value: 3 },
//   { type: 'add', path: '.z', value: 4 }
// ]

// Nested object differences  
diff({ user: { name: 'John' } }, { user: { name: 'Jane', age: 30 } })
// => [
//   { type: 'add', path: '.user.age', value: 30 },
//   { type: 'set', path: '.user.name', value: 'Jane' }
// ]

// Array differences
diff({ items: [1, 2, 3] }, { items: [1, 4, 3, 5] })
// => [
//   { type: 'set', path: '.items[1]', value: 4 },
//   { type: 'add', path: '.items[3]', value: 5 }
// ]

// Primitive differences
diff(42, 'hello')
// => [{ type: 'set', path: '', value: 'hello' }]

// No differences
diff({ x: 1 }, { x: 1 })
// => []
```

### `apply(input: unknown, operations: DiffOperation[]): unknown`

Applies a list of diff operations to an input object and returns the transformed result. This function can be used together with `diff` to apply changes from one object to another.

**Parameters:**
- `input` - The object/value to apply operations to
- `operations` - Array of diff operations to apply (as returned by `diff`)

**Returns:**
- New object/value with all operations applied

**Examples:**
```typescript
// Apply basic operations
const input = { x: 1, y: 2 };
const operations = [
  { type: 'set', path: '.y', value: 3 },
  { type: 'add', path: '.z', value: 4 }
];
apply(input, operations)
// => { x: 1, y: 3, z: 4 }

// Apply nested operations
const input2 = { user: { name: 'John' } };
const operations2 = [
  { type: 'set', path: '.user.name', value: 'Jane' },
  { type: 'add', path: '.user.age', value: 30 }
];
apply(input2, operations2)
// => { user: { name: 'Jane', age: 30 } }

// Round-trip with diff
const a = { x: 1, obj: { y: 2 }, arr: [1, 2] };
const b = { x: 2, obj: {}, arr: [] };
const ops = diff(a, b);
const result = apply(a, ops);
// result equals b

// Empty structure preservation
const input3 = { obj: { x: 1 }, arr: [1, 2] };
const operations3 = [
  { type: 'remove', path: '.obj.x' },
  { type: 'remove', path: '.arr[0]' },
  { type: 'remove', path: '.arr[1]' }
];
apply(input3, operations3)
// => { obj: {}, arr: [] }  // Preserves empty structures
```

### `sortKeys(obj: unknown): unknown`

Recursively sorts object keys alphabetically while preserving the structure. Handles nested objects and arrays containing objects.

**Parameters:**
- `obj` - The object/value to sort keys for

**Returns:**
- New object/value with sorted keys (primitives returned unchanged)

**Examples:**
```typescript
sortKeys({ z: 1, a: { c: 3, b: 2 } })
// => { a: { b: 2, c: 3 }, z: 1 }

sortKeys([{ z: 'last', a: 'first' }])
// => [{ a: 'first', z: 'last' }]
```

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Test in watch mode

```bash
npm run test:watch
```

## License

MIT