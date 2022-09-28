//hide implementation detail, let the code tell a story and dive in if necessary to understand how exactly happened
export interface ParsingPattern {
  tag: string, 
  regExp: RegExp, 
  delimeter?: RegExp[], 
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
import { thematicBreak, headings, codeBlocks, bold, italic, images, links, codeSpan, highlight, blockQuote } from './builtInPatterns';

export interface IASTNode {
  type: string
  content: string | IASTNode[]
  class?: string,
  wrapper?: string
  props?: {
    [key: string]: string
  }
  contentless?: boolean
}


export class MDParser {
  parsedText: string;
  AST: IASTNode[];
  containerBlocks: ParsingPattern[] = []
  leafBlocks: ParsingPattern[] = []
  inlineBlocks: ParsingPattern[] = []

  public parse(text: string, config?: any): string {
    text = this.#externalFunctionality(text);
    
    this.AST = this.#buildAST(text);

    return this.#parseASTIntoMarkdown(this.AST);
  }

  #buildAST(text: string) {
   let AST: IASTNode[] = [{
      type: 'text',
      content: text
    }]

    AST = this.#parseContainerBlocks(AST);
    console.log(AST)
    AST = this.#parseLeafBlocks(AST);
    AST = this.#parseInlines(AST);
    return AST
  }

  public newContainerBlockPattern(pattern: ParsingPattern| ParsingPattern[]) {
    this.containerBlocks = this.containerBlocks.concat(pattern)
  }

  public newLeafBlockPattern(pattern: ParsingPattern| ParsingPattern[]) {
    this.leafBlocks = this.leafBlocks.concat(pattern)
  }

  public newInlinePattern(pattern: ParsingPattern|ParsingPattern[]) {
    this.inlineBlocks = this.inlineBlocks.concat(pattern);
  }

  #externalFunctionality(text: string):string {
    text = this.#questions(text)

    return text
  }

  #parseContainerBlocks(parseable: IASTNode[]): IASTNode[] {
    let parsed = parseable;

    this.containerBlocks.forEach(pattern => {
      parsed = this.#iterateContainerBlocks(parsed, pattern);
    });
    
    //trimming text nodes
    parsed = parsed.map((node) => {
      if (node.type === 'text' && typeof node.content === 'string')
        node.content = node.content.trim();
      
      return node 
    }).filter((node) => {
      if (node.type !== 'text')
        return true;
      else if (typeof node.content === 'string' && (node.content.trim() || node.contentless))
        return true;
      
      return false;
    });

    return parsed;    
  }

  #iterateContainerBlocks(parseable: IASTNode[], pattern: ParsingPattern): IASTNode[] {
    let concluded = true;

    let parsed: (IASTNode|IASTNode[])[] = parseable.map((node) => {
      if (['ul','li','blockquote'].includes(node.type)) {
        return node;
      }
      else if (node.type === 'text') {
        node.content = node.content as string;
        let nodeParsed = this.#parse(node.content, pattern);
        
        if (nodeParsed != null){
          for (const item of nodeParsed) {
            if (item.type !== 'text') {
              item.content = this.#buildAST(item.content as string)
            }
          }

          concluded = false;            
          return nodeParsed;
        }
      }

      return node
    })

    parsed = Array().concat.apply([], parsed); /// (IASTNode|IASTNode[])[] to IASTNode[]

    if (concluded)
      return parsed as IASTNode[];
    else
      return this.#iterateContainerBlocks(parsed as IASTNode[], pattern);
  }
  
  #parseLeafBlocks(parseable: IASTNode[]): IASTNode[] {
    let parsed = parseable;

    this.leafBlocks.forEach(pattern => {
      parsed = this.#iterateLeafBlocks(parsed, pattern);
    });
    
    //trimming text nodes
    parsed = parsed.map((node) => {
      if (node.type === 'text' && typeof node.content === 'string')
        node.content = node.content.trim();
      
      return node 
    }).filter((node) => {
      if (node.type !== 'text')
        return true;
      else if (typeof node.content === 'string' && (node.content.trim() || node.contentless))
        return true;
      
      return false;
    });

    return parsed;    
  }

  #iterateLeafBlocks(parseable: IASTNode[], pattern: ParsingPattern): IASTNode[] {
    let concluded = true;

    let parsed: (IASTNode|IASTNode[])[] = parseable.map((node) => {
      if (['ul','li','blockquote'].includes(node.type)) {
        // dont know yet
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

    parsed = Array().concat.apply([], parsed); /// (IASTNode|IASTNode[])[] to IASTNode[]

    if (concluded)
      return parsed as IASTNode[];
    else
      return this.#iterateLeafBlocks(parsed as IASTNode[], pattern);
  }

  #parseInlines(parseable: IASTNode[]): IASTNode[] {
    let parsed = parseable;

    this.inlineBlocks.forEach(pattern => {
      this.#iterateInlines(parsed, pattern)
    });

    return parsed
  }

  #iterateInlines(parseable: IASTNode[], pattern: ParsingPattern):IASTNode[] {
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

      node.content = this.#iterateInlines(node.content as IASTNode[], pattern);
      return node
    })

    parsed = Array().concat.apply([], parsed);

    if (concluded)
      return parsed
    else
      return this.#iterateInlines(parsed, pattern);
  }

  #parse(text: string, pattern: ParsingPattern): IASTNode[] {
    let matchPattern = text.match(pattern.regExp);

    if (matchPattern) {
      const match = matchPattern[0];
      const matchOffsetIndex = text.indexOf(match)
      const matchLength = match.length;
      
      let newASTNode: IASTNode = {
        type: pattern.tag, 
        content: match
      }      
      
      if (pattern.extra?.contentless) {
        newASTNode.content = '';
        newASTNode.contentless = true;
      }
      else {
        const [beggining, endign] = pattern.delimeter;

        newASTNode.content = newASTNode.content as string;
        newASTNode.content = newASTNode.content.replace(beggining, '').replace(endign, '');
      }

      if (pattern.extra?.props) {
        newASTNode.props = {};
        for (let prop in pattern.extra.props) {
          const propMatch = match.match(pattern.extra.props[prop]);
          if (propMatch === null) 
            throw new Error('prop pattern returned null');

          newASTNode.props[prop] = propMatch[0];
        }
      }      
      
      if (pattern.extra?.escapeContent) {
        newASTNode.content = this.#escapeSpecialCharacters(newASTNode.content as string);
      }

      if (pattern.extra?.class) 
        newASTNode.class = pattern.extra.class;
      if (pattern.extra?.wrapper)
        newASTNode.wrapper = pattern.extra.wrapper;
      
      const finalBatch = [newASTNode];
      
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
  
  #parseASTIntoMarkdown(AST: IASTNode[], isOuterMostNode = true):string {
    //if (isOuterMostNode) console.log(AST);
    let parsedAST: string|string[] = AST.map(node => {
      if (isOuterMostNode && node.type === 'text'){
        node.type = 'p'
      }
      
      let htmlTagBody = ''

      if (node.class)
        htmlTagBody += ` class="${node.class}"`

      if (node.props) {
        for (let prop in node.props) {
          htmlTagBody += ` ${prop}="${node.props[prop]}"`
        }
      }

      if (node.wrapper){
        node.content = `<${node.type}>${node.content}</${node.type}>`
        node.type = node.wrapper
      }

      if (typeof node.content === 'string'){
        if (!node.contentless)
          return `<${node.type}${htmlTagBody}>${node.content}</${node.type}>`
        else 
          return `<${node.type}${htmlTagBody}/>`
      }

      return `<${node.type}${htmlTagBody}>${this.#parseASTIntoMarkdown(node.content as IASTNode[], false)}</${node.type}>`
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

const mdParser = new MDParser()

mdParser.newContainerBlockPattern([
  blockQuote()
])

mdParser.newLeafBlockPattern([
  thematicBreak(),
  headings(1),
  headings(2),
  headings(3),
  headings(4),
  headings(5),
  headings(6),
  codeBlocks()
]);

mdParser.newInlinePattern([
  bold(),
  italic(),
  images(),
  links(),
  codeSpan(),
  highlight()
]);

export default mdParser;
