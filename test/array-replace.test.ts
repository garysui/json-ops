import { diff, apply, sortKeys } from '../src/index';

  describe('Array Replace Mode', () => {
    describe('arrayReplace parameter', () => {
      it('should generate element-by-element operations when arrayReplace is false', () => {
        const a = [1, 2, 3];
        const b = [1, 2, 4, 5];
        const operations = diff(a, b, '', false);

        expect(operations.length).toBe(2);
        expect(operations[0]).toEqual({ type: 'set', path: '@2', value: 4 });
        expect(operations[1]).toEqual({ type: 'add', path: '@3', value: 5 });
      });

      it('should replace entire array when lengths differ and arrayReplace is true', () => {
        const a = [1, 2, 3];
        const b = [1, 2, 4, 5];
        const operations = diff(a, b, '', true);

        expect(operations.length).toBe(1);
        expect(operations[0]).toEqual({ type: 'set', path: '', value: [1, 2, 4, 5] });

        const result = apply(a, operations);
        expect(result).toEqual(b);
      });

      it('should still do element-by-element when same length with arrayReplace true', () => {
        const a = [1, 2, 3];
        const b = [1, 2, 4];
        const operations = diff(a, b, '', true);

        expect(operations.length).toBe(1);
        expect(operations[0]).toEqual({ type: 'set', path: '@2', value: 4 });

        const result = apply(a, operations);
        expect(result).toEqual(b);
      });

      it('should replace nested arrays when arrayReplace is true', () => {
        const a = { items: [1, 2, 3], name: 'test' };
        const b = { items: [1, 2, 3, 4, 5], name: 'test' };
        const operations = diff(a, b, '', true);

        expect(operations.length).toBe(1);
        expect(operations[0]).toEqual({
          type: 'set',
          path: '.items',
          value: [1, 2, 3, 4, 5]
        });

        const result = apply(a, operations);
        expect(sortKeys(result)).toEqual(sortKeys(b));
      });

      it('should not replace nested arrays when arrayReplace is false', () => {
        const a = { items: [1, 2, 3], name: 'test' };
        const b = { items: [1, 2, 3, 4, 5], name: 'test' };
        const operations = diff(a, b, '', false);

        expect(operations.length).toBe(2);
        expect(operations[0]).toEqual({ type: 'add', path: '.items@3', value: 4 });
        expect(operations[1]).toEqual({ type: 'add', path: '.items@4', value: 5 });

        const result = apply(a, operations);
        expect(result).toEqual(b);
      });

      it('should replace arrays that shrink when arrayReplace is true', () => {
        const a = [1, 2, 3, 4, 5];
        const b = [1, 2];
        const operations = diff(a, b, '', true);

        expect(operations.length).toBe(1);
        expect(operations[0]).toEqual({ type: 'set', path: '', value: [1, 2] });

        const result = apply(a, operations);
        expect(result).toEqual(b);
      });

      it('should handle deeply nested arrays with arrayReplace', () => {
        const a = {
          data: {
            values: [1, 2, 3]
          }
        };
        const b = {
          data: {
            values: [1, 2, 3, 4]
          }
        };
        const operations = diff(a, b, '', true);

        expect(operations.length).toBe(1);
        expect(operations[0]).toEqual({
          type: 'set',
          path: '.data.values',
          value: [1, 2, 3, 4]
        });

        const result = apply(a, operations);
        expect(result).toEqual(b);
      });

      it('should replace arrays of objects when arrayReplace is true', () => {
        const a = [{ id: 1 }, { id: 2 }];
        const b = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const operations = diff(a, b, '', true);

        expect(operations.length).toBe(1);
        expect(operations[0].type).toBe('set');
        expect(operations[0].path).toBe('');

        const result = apply(a, operations);
        expect(result).toEqual(b);
      });

      it('should handle mixed nested structures with arrayReplace', () => {
        const a = {
          users: [{ name: 'Alice' }, { name: 'Bob' }],
          count: 2
        };
        const b = {
          users: [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }],
          count: 3
        };
        const operations = diff(a, b, '', true);

        // Should have 2 operations: one to replace the array, one to set count
        expect(operations.some(op => op.path === '.users' && op.type === 'set')).toBe(true);
        expect(operations.some(op => op.path === '.count' && op.type === 'set')).toBe(true);

        const result = apply(a, operations);
        expect(sortKeys(result)).toEqual(sortKeys(b));
      });

      it('should handle empty arrays with arrayReplace', () => {
        const a = [1, 2, 3];
        const b: number[] = [];
        const operations = diff(a, b, '', true);

        expect(operations.length).toBe(1);
        expect(operations[0]).toEqual({ type: 'set', path: '', value: [] });

        const result = apply(a, operations);
        expect(result).toEqual(b);
      });

      it('should handle array to non-array with arrayReplace', () => {
        const a = { value: [1, 2, 3] };
        const b = { value: 'not an array' };
        const operations = diff(a, b, '', true);

        expect(operations.length).toBe(1);
        expect(operations[0]).toEqual({ type: 'set', path: '.value', value: 'not an array' });

        const result = apply(a, operations);
        expect(result).toEqual(b);
      });
    });

    describe('arrayReplace round trips', () => {
      it('should handle round trip with arrayReplace true', () => {
        const a = { items: [1, 2], other: 'data' };
        const b = { items: [1, 2, 3, 4, 5], other: 'data' };

        const operations = diff(a, b, '', true);
        const result = apply(a, operations);

        expect(sortKeys(result)).toEqual(sortKeys(b));
      });

      it('should handle multiple array changes with arrayReplace', () => {
        const a = {
          arr1: [1, 2],
          arr2: [3, 4],
          arr3: [5, 6]
        };
        const b = {
          arr1: [1, 2, 3],
          arr2: [3],
          arr3: [5, 6, 7, 8]
        };

        const operations = diff(a, b, '', true);
        const result = apply(a, operations);

        expect(sortKeys(result)).toEqual(sortKeys(b));
      });
    });
  });

