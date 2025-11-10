import { flat, replaceUndefined, restoreUndefined, unflat } from '../src/index';
import { examples } from './fixtures';

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
