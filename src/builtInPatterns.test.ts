import mdParser from './index';

describe('Leaf Blocks Patterns', () => {
  test('Thematic break should be correctly parsed', () => {
    const input = `---\n`;
    const expectedResult = /<hr.*\/>/;

    expect(mdParser.parse(input)).toMatch(expectedResult);
  });

  test('All 6 are Headings should be correctly parsed', () => {
    const input = (n:number) => `${'#'.repeat(n)} Test string`
    const expectedResult = (n:number) => `<h${n}>Test string</h${n}>`

    for(let i = 1; i <= 6; i++) {
      expect(mdParser.parse(input(i))).toBe(expectedResult(i));
    }
  });

  test('Indented codeblocks should be correctly parsed', () => {
    const input = `    //code block content;`;
    const expectedResult = /<div.*class="code-block.*".*><code>\/\/code block content;<\/code><\/div>/;

    expect(mdParser.parse(input)).toMatch(expectedResult);
  })
})