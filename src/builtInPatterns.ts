import { ParsingPattern } from "./index"

// CONTAINER BLOCKS

export function list() {
  const marker = ' (-|[0-9]) '
  const itemsRegExp = `(\n|^)${marker}(.+)(\n   .+)*`
  const regExp = `(${itemsRegExp})+`
  return {
    regExp: new RegExp(regExp),
    itemsRegExp: new RegExp(itemsRegExp),
    itemsDelimeter: [new RegExp(`(?=(\n|^))(${marker}|   )`, 'g')],
    tag: 'ul',
    itemsTag: 'li'
  }
}

export function blockQuote() {
  return {
    regExp: /((^|\n) {0,3}(>.*))(\n {0,3}(>?.+))*/,
    tag: 'blockquote',
    delimeter: [
      /(?=(^|\n)) {0,3}>/g
    ]
  }
}

// LEAFBLOCKS

export function thematicBreak(): ParsingPattern {
  const regExp = /(\n|^)( {0,3}((- *){3,}|(\* *){3,}|(_ *){3,}) *)(\n|$)/

  return {
    regExp, 
    class:'hr',
    markers: {
      opening: {
        type: 'marker',
        class: 'hr-marker marker',
        index: 0
      }
    }
  }
}

export function headings(num: number): ParsingPattern {

  const headingRegExp = new RegExp("(?<=(?:^|\n))( {0,3}#{"+num+"})( .+)")

  return {
    regExp: headingRegExp,
    class: `h${num}`,
    markers: {
      opening: {
        type: 'opening',
        class: `heading-marker marker`,
        index: 1
      },
      content: {
        type: 'text',
        class: `content`,
        index: 2
      }
    }
  }
}

export function indentedCodeBlock() {

  return {
    regExp: /((?=(^|\n))    .+\n?)+/,
    delimeter: [
      /(?=(^|\n))    /g
    ],
    tag: 'code',
    extra: {
      class: 'code-block',
      wrapper: 'div',
      escapeContent: true
    }
  }
}

export function fencedCodeBlocks() {
  
  const base = (marker:string) => marker+'(.*)\n+((?!'+marker+').\n*)+\n'+marker

  //const codeblocksRegExp = new RegExp('(?=(^|\n))~~~(.*)\n+((?!~~~).\n*)+\n~~~(\n|$)');
  const codeblocksRegExp = new RegExp(`(?=(^|\n))(${base('~~~')}|${base('```')})(\n|$)`);

  const delimeter = [new RegExp('(^|\n*)(```|~~~)(.*)\n'), new RegExp('(?=\n)(```|~~~)(\n$|$)')]
  const extraExtras = {
    class: 'code-block', 
    wrapper: 'div',
    props: {
      id: /(?=(```|~~~)).*(?=\n)/
    },
    escapeContent: true
  }
  return {tag: 'code', regExp: codeblocksRegExp, delimeter};
}

export function codeSpan() {
  const codeSpanRegExp = new RegExp('`((?!`).\\n?)+`');

  const delimeter = [new RegExp('^`'), new RegExp('`$')]
  const extraExtras = {
    class: 'code-span', 
    wrapper: 'span',
    escapeContent: true
  }

  return {tag: 'code', regExp: codeSpanRegExp, delimeter};
}

//INLINES//
export function links() {
  // all but brackets (((?!\\[|\\]).)+)
  // all but parantheses (((?!\\(|\\)).)+)
  // between brackets \\!\\[allbutbrackets\\]
  // between parantheses \\(allbutparentheses\\)
  
  const linkRegExp = new RegExp("\\[(((?!\\[|\\]).)+)\\]\\((((?!\\(|\\)).)+)\\)")

  const delimeter = [/^\[/, /\]\(.+\)$/];
  
  const extraExtras = {
    props: {
      href: /(?<=\().+(?=\)$)/
    }
  }      

  return {tag: 'a', regExp: linkRegExp, delimeter}
}

export function images() {
  // exclamation mark \\! 
  // all but brackets (((?!\\[|\\]).)+)
  // all but parantheses (((?!\\(|\\)).)+)
  // between brackets \\!\\[allbutbrackets\\]
  // between parantheses \\(allbutparentheses\\)
  
  const imgRegExp = new RegExp("\\!\\[(((?!\\[|\\]).)+)\\]\\((((?!\\(|\\)).)+)\\)")

  const delimeter = [/^\!\[/, /\]\(.+\)$/];
  
  const extraExtras = {
    props: {
      src: /(?<=\().+(?=\)$)/,
      alt: /(?<=^\!\[).+(?=\])/
    },
    contentless: true
  }
     
  return {tag: 'img', regExp: imgRegExp, delimeter}
}

export function bold(): ParsingPattern {
  
  const boldRegExp = /(\*\*)(\**[^ ](?:(?!\*\*).)*[^ ]\**)(\*\*)/;

  return { 
    regExp: boldRegExp, 
    class: 'bold',
    markers: {
      opening: {
        type: 'marker',
        class: 'bold-marker marker',
        index: 1
      },
      content: {
        type: 'text',
        class: 'content',
        index: 2
      },
      closing: {
        type: 'marker',
        class: 'bold-marker marker',
        index: 3
      }
    }
  }
}

export function italic() {
  
  const italicRegExp = /(\*)((?:(?!\*).)+)(\*)/;

  return { 
    regExp: italicRegExp, 
    class: 'italic',
    markers: {
      opening: {
        type: 'marker',
        class: 'italic-marker marker',
        index: 1
      },
      content: {
        type: 'text',
        class: 'content',
        index: 2
      },
      closing: {
        type: 'marker',
        class: 'italic-marker marker',
        index: 3
      }
    }
  }
}

export function highlight() {
  const highlightRegExp = /""((?!"").)+""/;

  const delimeter = [/^""/, /""$/];

  return {tag: 'mark', regExp: highlightRegExp, delimeter}
}