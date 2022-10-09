export interface ParsingPattern {
  regExp: RegExp
  class: string
  props?: {
    [key: string]: RegExp
  }
  markers: {
    [key: string]: InnerPattern
  }
  escapeContent?: boolean
}

export interface InnerPattern {
  type: string
  class: string
  index: number
}

import * as he from 'he';
import { thematicBreak, headings, bold, italic, images, links, codeSpan, highlight, blockQuote, list, fencedCodeBlocks, indentedCodeBlock } from './builtInPatterns';

export interface IASTNode {
  type: string
  content: string | IASTNode[]
  class?: string
  props?: {
    [key: string]: string
  }
}


export class MDParser {
  parsedText: string;
  AST: IASTNode[];
  containerBlockPatterns: ParsingPattern[] = [];
  leafBlockRules: ParsingPattern[] = [];
  inlineBlockRules: ParsingPattern[] = [];

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
    
    AST = this.#parseLeafRules(AST);
    AST = this.#parseInlineRules(AST);
    
    return AST
  }

  public newContainerBlockPattern(pattern: ParsingPattern| ParsingPattern[]) {
    this.containerBlockPatterns = this.containerBlockPatterns.concat(pattern)
  }

  public newLeafBlockPattern(pattern: ParsingPattern| ParsingPattern[]) {
    this.leafBlockRules = this.leafBlockRules.concat(pattern)
  }

  public newInlinePattern(pattern: ParsingPattern|ParsingPattern[]) {
    this.inlineBlockRules = this.inlineBlockRules.concat(pattern);
  }

  public extractRawMarkdown(text: string): string {
    return text.replace(/<\/?[^<>]+>/g, '');
  }

  #externalFunctionality(text: string): string {
    text = this.#questions(text)

    return text
  }
  
  #parseLeafRules(parseable: IASTNode[]): IASTNode[] {
    let parsed = parseable;

    this.leafBlockRules.forEach(pattern => {
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
    let match = text.match(pattern.regExp);
    if (match) {
      const wholeMatch = match[0];
      const matchOffsetIndex = text.indexOf(wholeMatch)
      const matchLength = wholeMatch.length;

      let previousContent = text.substring(0,matchOffsetIndex);
      let nextContent = text.substring(matchOffsetIndex+matchLength);
      
      let newASTNode: IASTNode = {
        type: 'wrapper',
        class: 'mdsyntax-'+pattern.class || '',
        content: []
      }

      for (let marker in pattern.markers) {
        if (pattern.markers[marker])
          (newASTNode.content as IASTNode[]).push({
            type: pattern.markers[marker].type,
            class: 'mdsyntax-'+pattern.markers[marker].class,
            content: match[pattern.markers[marker].index]
          } as IASTNode);      
      }

      if (pattern.escapeContent) {
        newASTNode.content = (newASTNode.content as IASTNode[]).map( v => {
          if (v.type === 'content')
            v.content = this.#escapeSpecialCharacters(v.content as string);
          return v
        })
      }
      
      const finalBatch = [newASTNode];
      
      if (previousContent)
        finalBatch.unshift({type: 'text', content: previousContent});
      
      if (nextContent)
        finalBatch.push({type: 'text', content: nextContent});

      return finalBatch
    }

    return null
  }

  #parseInlineRules(AST: IASTNode[]): IASTNode[] {

    return AST.map(node => {

      if (node.type === 'text') {
        const rule = this.#findInlineRule(node);
        if (rule) {
          node.content = this.#parseTextToAST(node.content as string, rule);
          node.content = this.#parseInlineRules(node.content as IASTNode[]);
        }
      }

      if (node.type === 'wrapper')
        node.content = this.#parseInlineRules(node.content as IASTNode[]);

      return node;
    })
  }

  #findInlineRule(node: IASTNode) {
    let earliestIndex = 0;
    let pattern: ParsingPattern;

    this.inlineBlockRules.forEach((rule) => {
      //const regExp = new RegExp(`.*(?=${rule.regExp})`);
      let match = rule.regExp.exec(node.content as string);
      if (match) {
        const matchIndex = (node.content as string).indexOf(match[0])
        if (pattern == null || matchIndex < earliestIndex) {
          earliestIndex = matchIndex;
          pattern = rule;
        }
      }
    });

    return pattern
  }
  
  #parseASTIntoMarkdown(AST: IASTNode[], isOuterMostNode = true):string {
    if (isOuterMostNode) console.log(AST)
    let parsedAST: string|string[] = AST.map(node => { 
      let tag = 'span';
      let htmlTagBody = ''

      if (node.class)
        htmlTagBody += ` class="${node.class}"`

      if (node.props) {
        for (let prop in node.props) {
          htmlTagBody += ` ${prop}="${node.props[prop]}"`
        }
      }

      if (typeof node.content === 'string')
        return `<${tag}${htmlTagBody}>${node.content}</${tag}>`

      return `<${tag}${htmlTagBody}>${this.#parseASTIntoMarkdown(node.content as IASTNode[], false)}</${tag}>`
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
]);

mdParser.newInlinePattern([
  bold(),
  // italic(),
  // images(),
  // links(),
  // codeSpan(),
  // highlight()
]);

function editor(node: HTMLPreElement) {

}

export default mdParser;
