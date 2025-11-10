import { flat, replaceUndefined, restoreUndefined, unflat, diff, apply, sortKeys } from '../src/index';

describe('Flat Path Notation Specification', () => {

  describe('Root type detection', () => {
    it('should detect primitive at root (empty path)', () => {
      const flattened = flat(42);
      expect(flattened).toEqual([{ "": 42 }]);

      const flattened2 = flat("hello");
      expect(flattened2).toEqual([{ "": "hello" }]);

      const flattened3 = flat(null);
      expect(flattened3).toEqual([{ "": null }]);
    });

    it('should detect object at root (dot path)', () => {
      const flattened = flat({});
      expect(flattened).toEqual([{ ".": {} }]);

      const flattened2 = flat({ x: 1, y: 2 });
      expect(flattened2).toEqual([{ ".x": 1 }, { ".y": 2 }]);
    });

    it('should detect array at root (@ path)', () => {
      const flattened = flat([]);
      expect(flattened).toEqual([{ "@": [] }]);

      const flattened2 = flat([1, 2, 3]);
      expect(flattened2).toEqual([{ "@0": 1 }, { "@1": 2 }, { "@2": 3 }]);
    });
  });

  describe('Array index notation (@i)', () => {
    it('should handle simple array indices', () => {
      const flattened = flat([10, 20, 30]);
      expect(flattened).toEqual([
        { "@0": 10 },
        { "@1": 20 },
        { "@2": 30 }
      ]);
    });

    it('should handle nested arrays (@i@j)', () => {
      const flattened = flat([[1, 2], [3, 4]]);
      expect(flattened).toEqual([
        { "@0@0": 1 },
        { "@0@1": 2 },
        { "@1@0": 3 },
        { "@1@1": 4 }
      ]);
    });

    it('should handle deeply nested arrays', () => {
      const flattened = flat([[[42]]]);
      expect(flattened).toEqual([{ "@0@0@0": 42 }]);
    });
  });

  describe('Object key notation (.key)', () => {
    it('should handle simple object keys', () => {
      const flattened = flat({ name: "Alice", age: 30 });
      expect(flattened).toEqual(expect.arrayContaining([
        { ".age": 30 },
        { ".name": "Alice" }
      ]));
      expect(flattened.length).toBe(2);
    });

    it('should handle nested object keys (.key.subkey)', () => {
      const flattened = flat({
        user: {
          profile: {
            name: "Bob"
          }
        }
      });
      expect(flattened).toEqual([{ ".user.profile.name": "Bob" }]);
    });
  });

  describe('Mixed path combinations', () => {
    it('should handle object -> array (.key@i)', () => {
      const data = {
        items: [10, 20],
        tags: ["a", "b", "c"]
      };
      const flattened = flat(data);
      expect(flattened).toEqual([
        { ".items@0": 10 },
        { ".items@1": 20 },
        { ".tags@0": "a" },
        { ".tags@1": "b" },
        { ".tags@2": "c" }
      ]);
    });

    it('should handle array -> object (@i.key)', () => {
      const data = [
        { name: "Alice", age: 25 },
        { name: "Bob", age: 30 }
      ];
      const flattened = flat(data);
      expect(flattened).toEqual(expect.arrayContaining([
        { "@0.age": 25 },
        { "@0.name": "Alice" },
        { "@1.age": 30 },
        { "@1.name": "Bob" }
      ]));
      expect(flattened.length).toBe(4);
    });

    it('should handle complex mixed paths (.a@0.b)', () => {
      const data = {
        groups: [
          {
            name: "Group1",
            members: [
              { id: 1, name: "Alice" },
              { id: 2, name: "Bob" }
            ]
          }
        ]
      };
      const flattened = flat(data);
      expect(flattened).toEqual(expect.arrayContaining([
        { ".groups@0.members@0.id": 1 },
        { ".groups@0.members@0.name": "Alice" },
        { ".groups@0.members@1.id": 2 },
        { ".groups@0.members@1.name": "Bob" },
        { ".groups@0.name": "Group1" }
      ]));
      expect(flattened.length).toBe(5);
    });
  });

  describe('README visual diagram example', () => {
    it('should match the exact example from README', () => {
      const input = {
        user: {
          name: "Alice",
          roles: ["admin", "editor"],
          profile: {
            age: 30,
            preferences: []
          }
        }
      };

      const flattened = flat(input);

      // Should contain all expected paths
      expect(flattened).toEqual(expect.arrayContaining([
        { ".user.name": "Alice" },
        { ".user.roles@0": "admin" },
        { ".user.roles@1": "editor" },
        { ".user.profile.age": 30 },
        { ".user.profile.preferences@": [] }
      ]));

      // Verify round-trip
      const unflattened = unflat(flattened);
      expect(sortKeys(unflattened)).toEqual(sortKeys(input));
    });
  });

  describe('Empty structure preservation', () => {
    it('should preserve empty objects with . marker', () => {
      const data = { emptyObj: {} };
      const flattened = flat(data);
      expect(flattened).toEqual([{ ".emptyObj.": {} }]);

      const unflattened = unflat(flattened);
      expect(unflattened).toEqual(data);
    });

    it('should preserve empty arrays with @ marker', () => {
      const data = { emptyArr: [] };
      const flattened = flat(data);
      expect(flattened).toEqual([{ ".emptyArr@": [] }]);

      const unflattened = unflat(flattened);
      expect(unflattened).toEqual(data);
    });

    it('should preserve mixed empty structures', () => {
      const data = {
        a: {},
        b: [],
        c: {
          nested: [],
          deep: {
            empty: {}
          }
        }
      };
      const flattened = flat(data);
      const unflattened = unflat(flattened);
      expect(sortKeys(unflattened)).toEqual(sortKeys(data));
    });
  });

  describe('Round-trip consistency', () => {
    const testCases = [
      { name: 'primitive', data: 42 },
      { name: 'string', data: "hello world" },
      { name: 'null', data: null },
      { name: 'empty object', data: {} },
      { name: 'empty array', data: [] },
      { name: 'simple object', data: { x: 1, y: 2 } },
      { name: 'simple array', data: [1, 2, 3] },
      { name: 'nested object', data: { a: { b: { c: 42 } } } },
      { name: 'nested array', data: [[[42]]] },
      { name: 'mixed structure', data: { arr: [{ obj: { val: 1 } }] } }
    ];

    testCases.forEach(({ name, data }) => {
      it(`should round-trip ${name}`, () => {
        const flattened = flat(data);
        const unflattened = unflat(flattened);
        expect(sortKeys(unflattened)).toEqual(sortKeys(data));
      });
    });
  });

});

