import mdParser from ".";

export default function editor(node: Element, callback: (e:Event) => void) {

  node.addEventListener('input', (e: InputEvent) => {
    let cursorPosition = getCursorPosition(node);
    const target = e.target as Element;
    const rawMd = mdParser.extractRawMarkdown(target.innerHTML);
    target.innerHTML = mdParser.parse(rawMd);
    
    if (callback) callback(e)

    setCursorPosition(node, cursorPosition);
  })
  
  node.addEventListener('keydown', (e: KeyboardEvent) => {
    const characterMap: {[key: string]: { char: string, length: number}} = {
      'Tab': {
        char:'  ',
        length: 2
      },
      'Enter': {
        char:'\n',
        length: 1
      }
    };
  
    const key = characterMap[e.key];    
    const target = e.target as Element;
  
    if (key) {
      e.preventDefault();
      let cursorPosition = getCursorPosition(node);
      cursorPosition.pos += key.length;
  
      const selection = window.getSelection().getRangeAt(0);
      selection.deleteContents();
      selection.insertNode(document.createTextNode(key.char));
      selection.collapse(false);
  
      const rawMd = mdParser.extractRawMarkdown(target.innerHTML);
      target.innerHTML = mdParser.parse(rawMd);

      if (callback) callback(e)
      
      setCursorPosition(node, cursorPosition);
    }
  })
}

type IStat = { pos: number, done: boolean}

function getCursorPosition(parent: Element) {
  const selection = window.getSelection();
  const node = selection.focusNode;
  const offset = selection.focusOffset;
  return findPosition(parent, node, offset, {pos: 0, done: false});
}

function findPosition(parent: Node, node: Node, offset:number, stat:IStat) {
  if (stat.done) return stat;

  let currentNode = null;
  if (parent.childNodes.length == 0) {
    stat.pos += parent.textContent.length;
  } else {
    for (var i = 0; i < parent.childNodes.length && !stat.done; i++) {
      currentNode = parent.childNodes[i];
      if (currentNode === node) {
        stat.pos += offset;
        stat.done = true;
        return stat;
      } else
        findPosition(currentNode, node, offset, stat);
    }
  }
  return stat;
}

//find the child node and relative position and set it on range
function setCursorPosition(parent: Node, cursorPosition: IStat) {
  let selection = window.getSelection();
  selection.removeAllRanges();
  let range = mountRange(parent, document.createRange(), { pos: cursorPosition.pos, done: false });
  range.collapse(true);
  selection.addRange(range);
}

function mountRange(parent: Node, range: Range, stat: IStat) {
  if (stat.done) return range;

  if (parent.childNodes.length == 0) {
    if (parent.textContent.length >= stat.pos) {
      range.setStart(parent, stat.pos);
      stat.done = true;
    } else {
      stat.pos = stat.pos - parent.textContent.length;
    }
  } else {
    for (var i = 0; i < parent.childNodes.length && !stat.done; i++) {
      let currentNode = parent.childNodes[i];
      mountRange(currentNode, range, stat);
    }
  }
  return range;
}