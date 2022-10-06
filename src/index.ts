export interface ParsingPattern {
  tag: string
  regExp: RegExp
  itemsRegExp?: RegExp
  delimeter?: RegExp[]
  itemsDelimeter?: RegExp[]
  itemsTag?: string
  extra?: ParsingPatternExtras
}

export interface ParsingPatternExtras {
  class?: string
  props?: {
    [key: string]: RegExp
  }
  wrapper?: string
  contentless?: boolean
  escapeContent?: boolean
}

import * as he from 'he';
import { thematicBreak, headings, bold, italic, images, links, codeSpan, highlight, blockQuote, list, fencedCodeBlocks, indentedCodeBlock } from './builtInPatterns';

export interface IASTNode {
  type: string
  content: string | IASTNode[]
  class?: string
  wrapper?: string
  props?: {
    [key: string]: string
  }
  contentless?: boolean
}


export class MDParser {
  parsedText: string;
  AST: IASTNode[];
  containerBlockPatterns: ParsingPattern[] = [];
  leafBlockPatterns: ParsingPattern[] = [];
  inlineBlockPatterns: ParsingPattern[] = [];

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
    
    AST = this.#parseLeafBlocks(AST);
    
    return AST
  }

  public newContainerBlockPattern(pattern: ParsingPattern| ParsingPattern[]) {
    this.containerBlockPatterns = this.containerBlockPatterns.concat(pattern)
  }

  public newLeafBlockPattern(pattern: ParsingPattern| ParsingPattern[]) {
    this.leafBlockPatterns = this.leafBlockPatterns.concat(pattern)
  }

  public newInlinePattern(pattern: ParsingPattern|ParsingPattern[]) {
    this.inlineBlockPatterns = this.inlineBlockPatterns.concat(pattern);
  }

  public extractRawMarkdown(text: string): string {
    return text.replace(/<\/?.+>/g, '');
  }

  #externalFunctionality(text: string): string {
    text = this.#questions(text)

    return text
  }
  
  #parseLeafBlocks(parseable: IASTNode[]): IASTNode[] {
    let parsed = parseable;

    this.leafBlockPatterns.forEach(pattern => {
      parsed = this.#parseSingleLeafBlockPattern(parsed, pattern);
    });

    return parsed;
  }

  #parseSingleLeafBlockPattern(parseable: IASTNode[], pattern: ParsingPattern): IASTNode[] {
    let concluded = true;

    let parsed: (IASTNode|IASTNode[])[] = parseable.map((node) => {
      if (node.type === 'text') {
        node.content = node.content as string;
        const nodeParsed = this.#parseTextToAST(node.content, pattern);
        
        if (nodeParsed != null){
          concluded = false;
          return nodeParsed;
        }
      }

      return node;
    });

    parsed = Array().concat.apply([], parsed); /// (IASTNode|IASTNode[])[] to IASTNode[]

    if (concluded)
      return parsed as IASTNode[];
    else
      return this.#parseSingleLeafBlockPattern(parsed as IASTNode[], pattern);
  }

  #parseTextToAST(text: string, pattern: ParsingPattern): IASTNode[] {
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

  //ASIDES

  #questions(currentText: string): string {
    const questionsRegExp = new RegExp("\\?\\?\\[.*\\]\\?\n?((?!\\?\\?\\?).\n?)+\\?\\?\\?");
    while (currentText.match(questionsRegExp)) {
      currentText = currentText.replace(questionsRegExp, '');
    }

    return currentText;
  }

  #escapeSpecialCharacters(block: string): string {
    return he.encode(block).replace(/\\&#/g, '&#')
  }
}

const mdParser = new MDParser()

// mdParser.newContainerBlockPattern([
//   blockQuote(),
//   list()
// ])

mdParser.newLeafBlockPattern([
  thematicBreak(),
  headings(1),
  headings(2),
  headings(3),
  headings(4),
  headings(5),
  headings(6),
  indentedCodeBlock(),
  fencedCodeBlocks()
]);

// mdParser.newInlinePattern([
//   bold(),
//   italic(),
//   images(),
//   links(),
//   codeSpan(),
//   highlight()
// ]);

export default mdParser;
