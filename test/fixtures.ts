// Shared test fixtures used across multiple test files

export const examples = [
  { a: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], b: 0 },
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
