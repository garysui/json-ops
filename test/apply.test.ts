import { apply, diff, sortKeys } from '../src/index';

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
        { type: 'set' as const, path: '.items@1', value: 4 },
        { type: 'add' as const, path: '.items@3', value: 5 }
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
        { type: 'add' as const, path: '.arr@0', value: 1 },
        { type: 'add' as const, path: '.arr@1', value: 2 }
      ];
      const result = apply(input, operations);
      expect(sortKeys(result)).toEqual(sortKeys({ arr: [1, 2] }));
    });

    it('should handle removing all properties to make structures empty', () => {
      const input = { obj: { x: 1 }, arr: [1, 2] };
      const operations = [
        { type: 'remove' as const, path: '.obj.x' },
        { type: 'remove' as const, path: '.arr@0' },
        { type: 'remove' as const, path: '.arr@1' }
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
