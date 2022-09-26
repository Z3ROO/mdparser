//hide implementation detail, let the code tell a story and dive in if necessary to understand how exactly happened
export interface ParsingPattern {
  tag: string, 
  regExp: RegExp, 
  delimeter: RegExp[], 
  extra?: ParsingPatternExtras
}
export interface ParsingPatternExtras {
  class?: string,
  props?: {
    [key: string]: RegExp
  },
  wrapper?: string,
  contentless?: boolean,
  escapeContent?: boolean
}

import * as he from 'he';

export interface IAST {
  type: string
  content: string | IAST | IAST[]
  class?: string,
  wrapper?: string
  props?: {
    [key: string]: string
  }
  contentless?: boolean
}


export class MDParser {
  #originalText: string;
  parsedText: string;
  AST: IAST[];

  constructor(originalText: string) {
    this.#originalText = originalText;
    this.parsedText = this.#initParsing(originalText);
  }

  #initParsing(text: string, config?: any): string {
    text = this.#externalFunctionality(text);
    // all container blocks recursevely
    this.AST = this.#parseContainerBlocks(text);
    this.AST = this.#parseLeafBlocks(this.AST);
    this.AST = this.#parseInlines(this.AST);
    
    // all inline recursevely
    // if(config.ast)
    //   return AST;
    // else

    return this.#parseASTIntoMarkdown(this.AST);
  }

  #externalFunctionality(text: string):string {
    text = this.#questions(text)

    return text
  }

  #parseContainerBlocks(parseable: string): IAST[] {
   
    return [{
      type: 'text',
      content: parseable
    }];
  }
  
  #parseLeafBlocks(parseable: IAST[]): IAST[] {

    let parsed = this.#iterateLeafBlocks(parseable, this.#codeBlocks());
    parsed = this.#iterateLeafBlocks(parsed, this.#headings(1));
    parsed = this.#iterateLeafBlocks(parsed, this.#headings(2));
    parsed = this.#iterateLeafBlocks(parsed, this.#headings(3));
    parsed = this.#iterateLeafBlocks(parsed, this.#headings(4));
    parsed = this.#iterateLeafBlocks(parsed, this.#headings(5));
    parsed = this.#iterateLeafBlocks(parsed, this.#headings(6));
    
    parsed = parsed.map((node) => {
      if (node.type === 'text' && typeof node.content === 'string')
        node.content = node.content.trim();
      
      return node 
    }).filter((node) => typeof node.content === 'string' && node.content.trim());
    return parsed;    
  }

  #iterateLeafBlocks(parseable: IAST[], pattern: ParsingPattern): IAST[] {
    let concluded = true;

    let parsed: (IAST|IAST[])[] = parseable.map((node) => {
      if (['ul','li','blockquote'].includes(node.type)) {
        //return something;
      }
      else if (node.type === 'text') {
        node.content = node.content as string;
        const nodeParsed = this.#parse(node.content, pattern);
        if (nodeParsed != null){
          concluded = false;
          return nodeParsed;
        }
      }

      return node
    })

    parsed = Array().concat.apply([], parsed); /// (IAST|IAST[])[] to IAST[]

    if (concluded)
      return parsed as IAST[];
    else
      return this.#iterateLeafBlocks(parsed as IAST[], pattern);
  }

  #parseInlines(parseable: IAST[]): IAST[] {
    let parsed = this.#iterateInlines(parseable, this.#codeSpan());
    parsed = this.#iterateInlines(parsed, this.#bold());//?
    parsed = this.#iterateInlines(parsed, this.#italic());
    parsed = this.#iterateInlines(parsed, this.#images());
    parsed = this.#iterateInlines(parsed, this.#links());
    parsed = this.#iterateInlines(parsed, this.#highlight());//?

    return parsed
  }

  #iterateInlines(parseable: IAST[], pattern: ParsingPattern):IAST[] {
    let concluded = true;
    let parsed = parseable.map(node => {
      if (typeof node.content === 'string') {
        const nodeParsed = this.#parse(node.content, pattern)

        if (nodeParsed) {
          concluded = false;
          node.content = nodeParsed;
          return node
        }
        else
          return node
      }

      node.content = this.#iterateInlines(node.content as IAST[], pattern);
      return node
    })

    parsed = Array().concat.apply([], parsed);

    if (concluded)
      return parsed
    else
      return this.#iterateInlines(parsed, pattern);
  }

  #parse(text: string, pattern: ParsingPattern): IAST[] {
    let matchPattern = text.match(pattern.regExp);

    if (matchPattern) {
      const match = matchPattern[0];
      const matchOffsetIndex = text.indexOf(match)
      const matchLength = match.length;
      
      let newBlock: IAST = {
        type: pattern.tag, 
        content: match
      }
      const [beggining, endign] = pattern.delimeter;
      
      if (pattern.extra?.contentless) {
        newBlock.content = '';
        newBlock.contentless = true;
      }
      else {
        newBlock.content = newBlock.content as string;
        newBlock.content = newBlock.content.replace(beggining, '').replace(endign, '');
      }

      if (pattern.extra?.props) {
        newBlock.props = {}
        for (let prop in pattern.extra.props) {
          const propMatch = match.match(pattern.extra.props[prop])
          if (propMatch === null) throw new Error('prop pattern returned null')

          newBlock.props[prop] = propMatch[0];
        }
      }      
      
      if (pattern.extra?.escapeContent) {
        newBlock.content = this.#escapeSpecialCharacters(newBlock.content as string);
      }

      if (pattern.extra?.class) 
        newBlock.class = pattern.extra.class;
      if (pattern.extra?.wrapper)
        newBlock.wrapper = pattern.extra.wrapper;
      
      const finalBatch = [newBlock];
      
      const previousContent = text.substring(0,matchOffsetIndex);
      if (previousContent)
        finalBatch.unshift({type: 'text', content: previousContent});
      
      const nextContent = text.substring(matchOffsetIndex+matchLength);
      if (nextContent)
        finalBatch.push({type: 'text', content: nextContent});

      return finalBatch
    }

    return null
  }
  
  #parseASTIntoMarkdown(AST: IAST[], outerMostNode = true):string {
    let parsedAST: string|string[] = AST.map(node => {
      if (outerMostNode && node.type === 'text'){
        node.type = 'p'
      }
      
      let additional = ''

      if (node.class)
        additional += ` class="${node.class}"`

      if (node.props) {
        for (let prop in node.props) {
          additional += ` ${prop}="${node.props[prop]}"`
        }
      }

      if (node.wrapper){
        node.content = `<${node.type}>${node.content}</${node.type}>`
        node.type = node.wrapper
      }

      if (typeof node.content === 'string'){
        if (!node.contentless)
          return `<${node.type}${additional}>${node.content}</${node.type}>`
        else 
          return `<${node.type}${additional}/>`
      }

      return `<${node.type}${additional}>${this.#parseASTIntoMarkdown(node.content as IAST[], false)}</${node.type}>`
    })

    parsedAST = parsedAST.join('');

    return parsedAST
  }

  //LEAFBLOCKS//
  #paragraphs(currentText: string): string {
  
    //matches from the beggining of string or line with lines that do not contain tags
    // let ruleOne = /(\n{2,}|^\n*)(((?!<\/?(p|h[1-6])>).)+)+(\n((?!<\/?(p|h[1-6])>).)+)*/;
    // //matches after tag endigns
    // let ruleTwo = /(?<=<\/(p|h[1-6])>)(\n?(?!<\/?(p|h[1-6])>).)+/;
    
    let ruleOne = /(?<=<\/((?!<|>).)+>)(\n*(?!<\/?.+>).\n*)+/;
    //matches after tag endigns
    let ruleTwo = /(?<=<\/.+>)(\n?(?!<\/?.+>).\n?)+/;
    let count = 0;

    while (currentText.match(ruleOne)) {      
      const match = currentText.match(ruleOne); 

      const parsedChunk = match![0].replace(/^(\r?\n)+|(\r?\n)+$/g,'');

      currentText = currentText.replace(ruleOne, `<p>${parsedChunk}</p>`)
      count++
    }
  
    // while (currentText.match(ruleTwo)) {
    //   const match = currentText.match(ruleTwo);
  
    //   const parsedChunk = match![0].replace(/^(\r?\n)+|(\r?\n)+$/g,'');
  
    //   currentText = currentText.replace(ruleTwo, `<p>${parsedChunk}</p>`)
    // }
  
    return currentText
  }
  
  #headings(num: number): ParsingPattern {

    const headingRegExp = new RegExp("(^ {0,3}|\n+ {0,3})#{"+num+"} +.*")

    const delimeter = [new RegExp(`(^|\n+)${'#'.repeat(num)}\\s+`)]      

    return {tag: 'h'+num, regExp: headingRegExp, delimeter}
  }

  #codeBlocks(): ParsingPattern {
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

  #codeSpan(): ParsingPattern {
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
  #links(): ParsingPattern {
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
  
  #images(): ParsingPattern {
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
  
  #bold(): ParsingPattern {
    
    const boldRegExp = new RegExp("\\*\\*(((?!\\*\\*).)+)\\*\\*")
    const delimeter = [new RegExp('^\\*\\*'), new RegExp('\\*\\*$')];   
  
    return {tag: 'strong', regExp: boldRegExp, delimeter}
  }
  
  #italic(): ParsingPattern {
    
    const italicRegExp = new RegExp("\\*(((?!\\*).)+)\\*")

    const delimeter = [new RegExp('^\\*'), new RegExp('\\*$')]

    return {tag: 'i', regExp: italicRegExp, delimeter}
  }

  #highlight(): ParsingPattern {
    const highlightRegExp = /""((?!"").)+""/;

    const delimeter = [/^""/, /""$/];

    return {tag: 'mark', regExp: highlightRegExp, delimeter}
  }

  //ASIDES

  #questions(currentText: string): string {
    const questionsRegExp = new RegExp("\\?\\?\\[.*\\]\\?\n?((?!\\?\\?\\?).\n?)+\\?\\?\\?");
    while (currentText.match(questionsRegExp)) {
      currentText = currentText.replace(questionsRegExp, '');
    }

    return currentText;
  }

  // UTILS

  #escapeMarkdownCharacters(block: string) {
    return block.replace(/(\*|#|<|>|\[|\])/g, '\\$1');
  }

  #escapeSpecialCharacters(block: string): string {
    return he.encode(block).replace(/\\&#/g, '&#')
  }

  #cleanBackslashes(currentText: string): string {
    return currentText.replace(/\\/g, '');
  }

}



// browser classic script tag only

declare global {
  interface Window { MDParser: any }
}

if (window != null)
  window.MDParser = MDParser