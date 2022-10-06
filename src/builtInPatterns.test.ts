import mdParser from './index';

describe('Leaf Blocks Patterns', () => {
  test('All 6 are Headings should be correctly parsed', () => {
    const input = (n:number) => `${'#'.repeat(n)} Test string`
    const expectedResult = (n:number) => `<h${n}>${'#'.repeat(n)} Test string</h${n}>`

    for(let i = 1; i <= 6; i++) {
      expect(mdParser.parse(input(i))).toBe(expectedResult(i));
    }
  });
})