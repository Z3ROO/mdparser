export interface ParsingPattern {
  tag: string, 
  regExp: RegExp, 
  delimeter: RegExp[], 
  extra?: {
    class?: string,
    props?: any,
    div?: string,
    contentless?: boolean,
    escapeContent?: boolean
  }
}

const he = require('he');

export class MDParser {
  #originalText: string;
  parsedText: string;

  constructor(originalText: string) {
    this.#originalText = originalText;
    this.parsedText = this.#initParsing(originalText);    
  }

  #initParsing(text: string, config?: any): string {
    let AST = [];
    text = this.#externalFunctionality(text);
    // all container blocks recursevely
    AST = this.#parseContainerBlocks(text);
    AST = this.#parseLeafBlocks(AST);
    AST = this.#parseInlines(AST);
    
    // all inline recursevely
    // if(config.ast)
    //   return AST;
    // else

    return this.#parseASTIntoMarkdown(AST);
  }

  #externalFunctionality(text: string):string {
    text = this.#questions(text)

    return text
  }

  #parseContainerBlocks(parseable: string) {
    return [{
      type: 'text',
      content: parseable
    }];
  }
  
  #parseLeafBlocks(parseable: any[]): any[] {

    let parsed = this.#iterateLeafBlocks(parseable, this.#codeBlocks());
    parsed = this.#iterateLeafBlocks(parsed, this.#headings(1));
    parsed = this.#iterateLeafBlocks(parsed, this.#headings(2));
    parsed = this.#iterateLeafBlocks(parsed, this.#headings(3));
    parsed = this.#iterateLeafBlocks(parsed, this.#headings(4));
    parsed = this.#iterateLeafBlocks(parsed, this.#headings(5));
    parsed = this.#iterateLeafBlocks(parsed, this.#headings(6));
    
    parsed = parsed.map((node) => {
      if (node.type === 'text')
        node.content = node.content.trim()
      
      return node 
    }).filter((node) => node.content.trim())
    return parsed;    
  }

  #iterateLeafBlocks(parseable: any[], pattern: ParsingPattern): any[] {
    let concluded = true;

    let parsed = parseable.map((node) => {
      if (['p', 'codeblock', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.type))
        return node;
      else if (['ul','li','blockquote'].includes(node.type)) {
        //return something;
      }
      else if (node.type === 'text') {
        const nodeParsed = this.#parse(node.content, pattern);
        if (nodeParsed){
          concluded = false;
          return nodeParsed;
        }
      }

      return node
    })

    parsed = [].concat.apply([], parsed);

    if (concluded)
      return parsed
    else
      return this.#iterateLeafBlocks(parsed, pattern)
  }

  #parseInlines(parseable: any[]): any[] {
    let parsed = this.#iterateInlines(parseable, this.#codeSpan());
    parsed = this.#iterateInlines(parsed, this.#bold());
    parsed = this.#iterateInlines(parsed, this.#italic());
    parsed = this.#iterateInlines(parsed, this.#images());
    parsed = this.#iterateInlines(parsed, this.#links());
    parsed = this.#iterateInlines(parsed, this.#highlight());

    return parsed
  }

  #iterateInlines(parseable: any[], pattern: any):any[] {
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

      node.content = this.#iterateInlines(node.content, pattern);
      return node
    })

    parsed = [].concat.apply([], parsed);

    if (concluded)
      return parsed
    else
      return this.#iterateInlines(parsed, pattern);
  }

  #parse(text: string, pattern: ParsingPattern): any[]|boolean {
    const match = text.match(pattern.regExp);

    if (match) {
      const [beggining, endign] = pattern.delimeter;
      let matchedChunk = match[0];
      const chunkIndex = text.indexOf(matchedChunk)
      const chunkLength = matchedChunk.length;

      let newBlock: {type: string, content: string, class?: string, div?: string, props?: any, contentless?: boolean} = {
        type: pattern.tag, 
        content: matchedChunk
      }

      if (pattern.extra?.contentless) {
        newBlock.content = ''
        newBlock.contentless = true
      }
      else {
        if (beggining)
          newBlock.content = newBlock.content.replace(beggining, '');
        if (endign)
          newBlock.content = newBlock.content.replace(endign, '');    
      }

      if (pattern.extra?.props) {
        newBlock.props = {}
        for (let prop in pattern.extra.props) {
          const propMatch = matchedChunk.match(pattern.extra.props[prop])
          if (propMatch === null) throw new Error('prop pattern returned null')

          newBlock.props[prop] = propMatch[0];
        }
      }      
      
      if (pattern.extra?.escapeContent) {
        newBlock.content = this.#escapeSpecialCharacters(newBlock.content);
      }

      if (pattern.extra?.class) 
        newBlock.class = pattern.extra.class;
      if (pattern.extra?.div)
        newBlock.div = pattern.extra.div;
      
      const finalBatch = [newBlock];
      
      const previousContent = text.substring(0,chunkIndex);
      if (previousContent)
        finalBatch.unshift({type: 'text', content: previousContent});
      
      const nextContent = text.substring(chunkIndex+chunkLength);
      if (nextContent)
        finalBatch.push({type: 'text', content: nextContent});

      return finalBatch
    }

    return false
  }
  
  #parseASTIntoMarkdown(AST: any[], firstRound = true):string {
    AST = AST.map(node => {
      if (firstRound && node.type === 'text'){
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

      if (node.div){
        node.content = `<${node.type}>${node.content}</${node.type}>`
        node.type = node.div
      }

      if (typeof node.content === 'string'){
        if (!node.contentless)
          return `<${node.type}${additional}>${node.content}</${node.type}>`
        else 
          return `<${node.type}${additional}/>`
      }

      return `<${node.type}${additional}>${this.#parseASTIntoMarkdown(node.content, false)}</${node.type}>`
    })

    const parsedMarkdown = AST.join('');

    return parsedMarkdown
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
    const extra = {
      class: 'code-block', 
      div: 'div',
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
    const extra = {
      class: 'code-span', 
      div: 'span',
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
    
    const extra = {
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
    
    const extra = {
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
