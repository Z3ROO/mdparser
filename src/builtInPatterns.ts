import { ParsingPattern, ParsingPatternExtras } from "./index"

// CONTAINER BLOCKS

export function blockQuote(): ParsingPattern {
  return {
    regExp: /((^|\n) {0,3}(>.*))(\n {0,3}(>?.+))*/,
    tag: 'blockquote',
    delimeter: [
      /((?<=(^|\n))|^\n) {0,3}>/g
    ]
  }
}

// LEAFBLOCKS

export function thematicBreak(): ParsingPattern {
  const regExp = /(^ {0,3}|\n+ {0,3})((- *){3,}|(\* *){3,}|(_ *){3,}) *\n/

  return {
    regExp, tag: 'hr', extra: {
      contentless: true
    }
  }
}

export function headings(num: number): ParsingPattern {

  const headingRegExp = new RegExp("(^ {0,3}|\n+ {0,3})#{"+num+"} +.*")

  const delimeter = [new RegExp(`(^ {0,3}|\n+)${'#'.repeat(num)}\\s+`)]      

  return {tag: 'h'+num, regExp: headingRegExp, delimeter}
}

export function codeBlocks(): ParsingPattern {
  const codeblocksRegExp = new RegExp('```(.*)\n((?!```).\n*)+\n```');

  const delimeter = [new RegExp('(^|\n*)```(.*)\n'), new RegExp('```$')]
  const extra: ParsingPatternExtras = {
    class: 'code-block', 
    wrapper: 'div',
    props: {
      id: /(?<=```).*(?=\n)/
    },
    escapeContent: true
  }
  return {tag: 'code', regExp: codeblocksRegExp, delimeter, extra};
}

export function codeSpan(): ParsingPattern {
  const codeSpanRegExp = new RegExp('`((?!`).\\n?)+`');

  const delimeter = [new RegExp('^`'), new RegExp('`$')]
  const extra: ParsingPatternExtras = {
    class: 'code-span', 
    wrapper: 'span',
    escapeContent: true
  }

  return {tag: 'code', regExp: codeSpanRegExp, delimeter, extra};
}

//INLINES//
export function links(): ParsingPattern {
  // all but brackets (((?!\\[|\\]).)+)
  // all but parantheses (((?!\\(|\\)).)+)
  // between brackets \\!\\[allbutbrackets\\]
  // between parantheses \\(allbutparentheses\\)
  
  const linkRegExp = new RegExp("\\[(((?!\\[|\\]).)+)\\]\\((((?!\\(|\\)).)+)\\)")

  const delimeter = [/^\[/, /\]\(.+\)$/];
  
  const extra: ParsingPatternExtras = {
    props: {
      href: /(?<=\().+(?=\)$)/
    }
  }      

  return {tag: 'a', regExp: linkRegExp, delimeter, extra}
}

export function images(): ParsingPattern {
  // exclamation mark \\! 
  // all but brackets (((?!\\[|\\]).)+)
  // all but parantheses (((?!\\(|\\)).)+)
  // between brackets \\!\\[allbutbrackets\\]
  // between parantheses \\(allbutparentheses\\)
  
  const imgRegExp = new RegExp("\\!\\[(((?!\\[|\\]).)+)\\]\\((((?!\\(|\\)).)+)\\)")

  const delimeter = [/^\!\[/, /\]\(.+\)$/];
  
  const extra: ParsingPatternExtras = {
    props: {
      src: /(?<=\().+(?=\)$)/,
      alt: /(?<=^\!\[).+(?=\])/
    },
    contentless: true
  }
     
  return {tag: 'img', regExp: imgRegExp, delimeter, extra}
}

export function bold(): ParsingPattern {
  
  const boldRegExp = new RegExp("\\*\\*(((?!\\*\\*).)+)\\*\\*")
  const delimeter = [new RegExp('^\\*\\*'), new RegExp('\\*\\*$')];   

  return {tag: 'strong', regExp: boldRegExp, delimeter}
}

export function italic(): ParsingPattern {
  
  const italicRegExp = new RegExp("\\*(((?!\\*).)+)\\*")

  const delimeter = [new RegExp('^\\*'), new RegExp('\\*$')]

  return {tag: 'i', regExp: italicRegExp, delimeter}
}

export function highlight(): ParsingPattern {
  const highlightRegExp = /""((?!"").)+""/;

  const delimeter = [/^""/, /""$/];

  return {tag: 'mark', regExp: highlightRegExp, delimeter}
}