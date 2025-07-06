import { flat, replaceUndefined, restoreUndefined, unflat, diff, apply, sortKeys } from './index';

const examples = [
  {a: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], b: 0},
  undefined,
  '', 'asdf', 0, false, null,
  [],
  [undefined],
  [[]],
  [5, [], 6],
  {},
  { x: undefined },
  { x: 1 },
  { x: [] },
  { x: {} },
  { x: 2, y: [], z: [2] },
  {
    x: 2,
    y: [{ x: 2, y: [], z: [2] }],
    z: [2]
  },
  {
    x: [
      undefined,
      '', 'asdf', 0, false, null,
      [],
      [undefined],
      [[]],
      [5, [], 6],
      {},
      { x: undefined },
      { x: 1 },
      { x: [] },
      { x: {} },
      { x: 2, y: [], z: [2] },
      {
        x: 2,
        y: [{ x: 2, y: [], z: [2] }],
        z: [2]
      },
    ]
  },

];


describe('flat, unflat', () => {

  for (const v of examples) {

    const replaced = replaceUndefined(v);
    const flattened = flat(replaced);
    const unflattened = unflat(flattened);
    const restored = restoreUndefined(unflattened);

    it(`${JSON.stringify(replaced)}`, () => {
      expect(restored).toEqual(v);
    });
  }

});

describe('diff', () => {

  describe('simple object differences', () => {
    it('should detect value changes', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 1, y: 3 };
      const result = diff(a, b);
      expect(result).toEqual([
        { type: 'set', path: '.y', value: 3 }
      ]);
    });

    it('should detect additions', () => {
      const a = { x: 1 };
      const b = { x: 1, y: 2 };
      const result = diff(a, b);
      expect(result).toEqual([
        { type: 'add', path: '.y', value: 2 }
      ]);
    });

    it('should detect removals', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 1 };
      const result = diff(a, b);
      expect(result).toEqual([
        { type: 'remove', path: '.y' }
      ]);
    });

    it('should detect multiple operations', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 1, y: 3, z: 4 };
      const result = diff(a, b);
      expect(result).toEqual([
        { type: 'set', path: '.y', value: 3 },
        { type: 'add', path: '.z', value: 4 }
      ]);
    });
  });

  describe('nested object differences', () => {
    it('should handle nested property changes', () => {
      const a = { user: { name: 'John', age: 30 } };
      const b = { user: { name: 'Jane', age: 30 } };
      const result = diff(a, b);
      expect(result).toEqual([
        { type: 'set', path: '.user.name', value: 'Jane' }
      ]);
    });

    it('should handle nested additions', () => {
      const a = { user: { name: 'John' } };
      const b = { user: { name: 'John', age: 30 } };
      const result = diff(a, b);
      expect(result).toEqual([
        { type: 'add', path: '.user.age', value: 30 }
      ]);
    });

    it('should handle deeply nested changes', () => {
      const a = { data: { user: { profile: { name: 'John' } } } };
      const b = { data: { user: { profile: { name: 'Jane', age: 30 } } } };
      const result = diff(a, b);
      expect(result).toEqual([
        { type: 'add', path: '.data.user.profile.age', value: 30 },
        { type: 'set', path: '.data.user.profile.name', value: 'Jane' }
      ]);
    });
  });

  describe('array differences', () => {
    it('should handle array element changes', () => {
      const a = { items: [1, 2, 3] };
      const b = { items: [1, 4, 3] };
      const result = diff(a, b);
      expect(result).toEqual([
        { type: 'set', path: '.items[1]', value: 4 }
      ]);
    });

    it('should handle array additions', () => {
      const a = { items: [1, 2] };
      const b = { items: [1, 2, 3] };
      const result = diff(a, b);
      expect(result).toEqual([
        { type: 'add', path: '.items[2]', value: 3 }
      ]);
    });

    it('should handle array length changes', () => {
      const a = { items: [1, 2, 3] };
      const b = { items: [1, 4, 3, 5] };
      const result = diff(a, b);
      expect(result).toEqual([
        { type: 'set', path: '.items[1]', value: 4 },
        { type: 'add', path: '.items[3]', value: 5 }
      ]);
    });

    it('should handle arrays of objects', () => {
      const a = { users: [{ name: 'John', age: 30 }] };
      const b = { users: [{ name: 'Jane', age: 30 }] };
      const result = diff(a, b);
      expect(result).toEqual([
        { type: 'set', path: '.users[0].name', value: 'Jane' }
      ]);
    });
  });

  describe('primitive differences', () => {
    it('should handle primitive to primitive changes', () => {
      const result = diff(42, 'hello');
      expect(result).toEqual([
        { type: 'set', path: '', value: 'hello' }
      ]);
    });

    it('should handle same primitives', () => {
      const result = diff(42, 42);
      expect(result).toEqual([]);
    });

    it('should handle null changes', () => {
      const result = diff(null, 'hello');
      expect(result).toEqual([
        { type: 'set', path: '', value: 'hello' }
      ]);
    });
  });

  describe('undefined value handling', () => {
    it('should handle undefined values', () => {
      const a = { x: 1, y: undefined };
      const b = { x: 1, y: 2, z: undefined };
      const result = diff(a, b);
      expect(result).toEqual([
        { type: 'set', path: '.y', value: 2 },
        { type: 'add', path: '.z', value: undefined }
      ]);
    });

    it('should handle undefined to defined', () => {
      const a = { x: undefined };
      const b = { x: 42 };
      const result = diff(a, b);
      expect(result).toEqual([
        { type: 'set', path: '.x', value: 42 }
      ]);
    });
  });

  describe('empty structures', () => {
    it('should handle empty object to filled object', () => {
      const a = { obj: {} };
      const b = { obj: { x: 1 } };
      const result = diff(a, b);
      expect(result).toEqual([
        { type: 'add', path: '.obj.x', value: 1 }
      ]);
    });

    it('should handle empty array to filled array', () => {
      const a = { arr: [] };
      const b = { arr: [1, 2] };
      const result = diff(a, b);
      expect(result).toEqual([
        { type: 'add', path: '.arr[0]', value: 1 },
        { type: 'add', path: '.arr[1]', value: 2 }
      ]);
    });

    it('should handle filled to empty structures', () => {
      const a = { obj: { x: 1 }, arr: [1, 2] };
      const b = { obj: {}, arr: [] };
      const result = diff(a, b);
      expect(result).toEqual([
        { type: 'remove', path: '.arr[0]' },
        { type: 'remove', path: '.arr[1]' },
        { type: 'remove', path: '.obj.x' }
      ]);
    });
  });

  describe('no differences', () => {
    it('should return empty array for identical objects', () => {
      const a = { x: 1, y: { z: 2 }, arr: [1, 2, 3] };
      const b = { x: 1, y: { z: 2 }, arr: [1, 2, 3] };
      const result = diff(a, b);
      expect(result).toEqual([]);
    });

    it('should return empty array for identical primitives', () => {
      expect(diff(42, 42)).toEqual([]);
      expect(diff('hello', 'hello')).toEqual([]);
      expect(diff(null, null)).toEqual([]);
      expect(diff(true, true)).toEqual([]);
    });
  });

  describe('complex mixed scenarios', () => {
    it('should handle complex object transformations', () => {
      const a = {
        users: [
          { id: 1, name: 'John', settings: { theme: 'dark' } },
          { id: 2, name: 'Jane' }
        ],
        config: { version: 1 }
      };
      const b = {
        users: [
          { id: 1, name: 'Johnny', settings: { theme: 'light', lang: 'en' } },
          { id: 2, name: 'Jane', active: true }
        ],
        config: { version: 2 },
        metadata: { created: '2023-01-01' }
      };
      const result = diff(a, b);
      
      // Should contain operations for all the changes
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(op => op.path === '.users[0].name' && op.type === 'set')).toBe(true);
      expect(result.some(op => op.path === '.users[0].settings.theme' && op.type === 'set')).toBe(true);
      expect(result.some(op => op.path === '.config.version' && op.type === 'set')).toBe(true);
      expect(result.some(op => op.path === '.metadata.created' && op.type === 'add')).toBe(true);
    });
  });

});

describe('apply', () => {

  describe('basic operations', () => {
    it('should apply add operations', () => {
      const input = { x: 1 };
      const operations = [{ type: 'add' as const, path: '.y', value: 2 }];
      const result = apply(input, operations);
      expect(sortKeys(result)).toEqual(sortKeys({ x: 1, y: 2 }));
    });

    it('should apply set operations', () => {
      const input = { x: 1, y: 2 };
      const operations = [{ type: 'set' as const, path: '.y', value: 3 }];
      const result = apply(input, operations);
      expect(sortKeys(result)).toEqual(sortKeys({ x: 1, y: 3 }));
    });

    it('should apply remove operations', () => {
      const input = { x: 1, y: 2 };
      const operations = [{ type: 'remove' as const, path: '.y' }];
      const result = apply(input, operations);
      expect(sortKeys(result)).toEqual(sortKeys({ x: 1 }));
    });

    it('should apply multiple operations in sequence', () => {
      const input = { x: 1, y: 2 };
      const operations = [
        { type: 'set' as const, path: '.y', value: 3 },
        { type: 'add' as const, path: '.z', value: 4 },
        { type: 'remove' as const, path: '.x' }
      ];
      const result = apply(input, operations);
      expect(sortKeys(result)).toEqual(sortKeys({ y: 3, z: 4 }));
    });
  });

  describe('nested operations', () => {
    it('should apply nested object operations', () => {
      const input = { user: { name: 'John', age: 30 } };
      const operations = [
        { type: 'set' as const, path: '.user.name', value: 'Jane' },
        { type: 'add' as const, path: '.user.city', value: 'NYC' }
      ];
      const result = apply(input, operations);
      expect(sortKeys(result)).toEqual(sortKeys({ 
        user: { name: 'Jane', age: 30, city: 'NYC' } 
      }));
    });

    it('should apply array operations', () => {
      const input = { items: [1, 2, 3] };
      const operations = [
        { type: 'set' as const, path: '.items[1]', value: 4 },
        { type: 'add' as const, path: '.items[3]', value: 5 }
      ];
      const result = apply(input, operations);
      expect(sortKeys(result)).toEqual(sortKeys({ items: [1, 4, 3, 5] }));
    });
  });

  describe('empty structure operations', () => {
    it('should apply operations to empty objects', () => {
      const input = { obj: {} };
      const operations = [{ type: 'add' as const, path: '.obj.x', value: 1 }];
      const result = apply(input, operations);
      expect(sortKeys(result)).toEqual(sortKeys({ obj: { x: 1 } }));
    });

    it('should apply operations to empty arrays', () => {
      const input = { arr: [] };
      const operations = [
        { type: 'add' as const, path: '.arr[0]', value: 1 },
        { type: 'add' as const, path: '.arr[1]', value: 2 }
      ];
      const result = apply(input, operations);
      expect(sortKeys(result)).toEqual(sortKeys({ arr: [1, 2] }));
    });

    it('should handle removing all properties to make structures empty', () => {
      const input = { obj: { x: 1 }, arr: [1, 2] };
      const operations = [
        { type: 'remove' as const, path: '.obj.x' },
        { type: 'remove' as const, path: '.arr[0]' },
        { type: 'remove' as const, path: '.arr[1]' }
      ];
      const result = apply(input, operations);
      expect(sortKeys(result)).toEqual(sortKeys({ obj: {}, arr: [] }));
    });
  });

  describe('undefined value handling', () => {
    it('should apply operations with undefined values', () => {
      const input = { x: 1 };
      const operations = [{ type: 'add' as const, path: '.y', value: undefined }];
      const result = apply(input, operations);
      expect(result).toEqual({ x: 1, y: undefined });
    });

    it('should handle setting undefined values', () => {
      const input = { x: 1, y: 2 };
      const operations = [{ type: 'set' as const, path: '.y', value: undefined }];
      const result = apply(input, operations);
      expect(result).toEqual({ x: 1, y: undefined });
    });
  });

  describe('primitive operations', () => {
    it('should apply operations to primitives', () => {
      const input = 42;
      const operations = [{ type: 'set' as const, path: '', value: 'hello' }];
      const result = apply(input, operations);
      expect(result).toBe('hello');
    });

    it('should handle null inputs', () => {
      const input = null;
      const operations = [{ type: 'set' as const, path: '', value: { x: 1 } }];
      const result = apply(input, operations);
      expect(sortKeys(result)).toEqual(sortKeys({ x: 1 }));
    });
  });

  describe('diff -> apply round trips', () => {
    const testCases = [
      { name: 'simple objects', a: { x: 1, y: 2 }, b: { x: 1, y: 3, z: 4 } },
      { 
        name: 'nested objects', 
        a: { user: { name: 'John', age: 30 } }, 
        b: { user: { name: 'Jane', age: 30, city: 'NYC' } } 
      },
      { 
        name: 'arrays', 
        a: { items: [1, 2, 3] }, 
        b: { items: [1, 4, 3, 5] } 
      },
      { 
        name: 'empty to filled', 
        a: { obj: {}, arr: [] }, 
        b: { obj: { x: 1 }, arr: [1, 2] } 
      },
      { 
        name: 'filled to empty', 
        a: { obj: { x: 1 }, arr: [1, 2] }, 
        b: { obj: {}, arr: [] } 
      },
      { 
        name: 'complex mixed', 
        a: { x: { nested: true }, y: 'hello', z: [1, { a: 1, b: 2 }] },
        b: { x: { nested: false, new: 'field' }, y: 'world', z: [1, { a: 1, b: 2, c: 3 }], w: 42 }
      },
      { name: 'primitives', a: 42, b: 'hello' },
      { name: 'with undefined', a: { x: 1, y: undefined }, b: { x: 1, y: 2, z: undefined } }
    ];

    testCases.forEach(({ name, a, b }) => {
      it(`should handle ${name} round trip`, () => {
        const operations = diff(a, b);
        const result = apply(a, operations);
        expect(sortKeys(result)).toEqual(sortKeys(b));
      });
    });
  });

  describe('no operations', () => {
    it('should return identical object when no operations applied', () => {
      const input = { x: 1, y: { z: 2 }, arr: [1, 2, 3] };
      const result = apply(input, []);
      expect(sortKeys(result)).toEqual(sortKeys(input));
    });
  });

});