import { diff } from '../src/index';

describe('diff', () => {
  describe('nested properties', () => {
    it('should handle nested property changes', () => {
      const a = { x: 1, y: { a: 1, b: 2 } };
      const b = { x: 1, y: {} };
      const c = { x: 1 };
      const resultB = diff(a, b);
      const resultC = diff(a, c);
      expect(resultB).toEqual([
        { type: 'remove', path: '.y.a' },
        { type: 'remove', path: '.y.b' }
      ]);
      expect(resultC).toEqual([
        { type: 'remove', path: '.y' }
      ]);
    });

    it('should handle nested property changes', () => {
      const a = { x: 1, y: [1, 2] };
      const b = { x: 1, y: [] };
      const c = { x: 1 };
      const resultB = diff(a, b);
      const resultC = diff(a, c);
      expect(resultB).toEqual([
        { type: 'remove', path: '.y@0' },
        { type: 'remove', path: '.y@1' },
      ]);
      expect(resultC).toEqual([
        { type: 'remove', path: '.y' }
      ]);
    });
  });

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
        { type: 'set', path: '.items@1', value: 4 }
      ]);
    });

    it('should handle array additions', () => {
      const a = { items: [1, 2] };
      const b = { items: [1, 2, 3] };
      const result = diff(a, b);
      expect(result).toEqual([
        { type: 'add', path: '.items@2', value: 3 }
      ]);
    });

    it('should handle array length changes', () => {
      const a = { items: [1, 2, 3] };
      const b = { items: [1, 4, 3, 5] };
      const result = diff(a, b);
      expect(result).toEqual([
        { type: 'set', path: '.items@1', value: 4 },
        { type: 'add', path: '.items@3', value: 5 }
      ]);
    });

    it('should handle arrays of objects', () => {
      const a = { users: [{ name: 'John', age: 30 }] };
      const b = { users: [{ name: 'Jane', age: 30 }] };
      const result = diff(a, b);
      expect(result).toEqual([
        { type: 'set', path: '.users@0.name', value: 'Jane' }
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
        { type: 'add', path: '.arr@0', value: 1 },
        { type: 'add', path: '.arr@1', value: 2 }
      ]);
    });

    it('should handle filled to empty structures', () => {
      const a = { obj: { x: 1 }, arr: [1, 2] };
      const b = { obj: {}, arr: [] };
      const result = diff(a, b);
      expect(result).toEqual([
        { type: 'remove', path: '.arr@0' },
        { type: 'remove', path: '.arr@1' },
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
      expect(result.some(op => op.path === '.users@0.name' && op.type === 'set')).toBe(true);
      expect(result.some(op => op.path === '.users@0.settings.theme' && op.type === 'set')).toBe(true);
      expect(result.some(op => op.path === '.config.version' && op.type === 'set')).toBe(true);
      expect(result.some(op => op.path === '.metadata.created' && op.type === 'add')).toBe(true);
    });
  });
});
