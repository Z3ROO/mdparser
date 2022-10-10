import {Editor} from "../../src/index.ts";


const textarea = document.getElementById('textarea2');
const viewer = document.getElementById('viewer');

Editor(viewer, (e) => {
  textarea.value = e.target.textContent;
});

//viewer.innerHTML = mdParser.parse(textarea.textContent);

// viewer.addEventListener('input', (e) => {
//   let cursorPosition = getCursorPosition(viewer, window.getSelection());
//   console.log(cursorPosition)
//   const rawMd = mdParser.extractRawMarkdown(e.target.innerHTML);
//   e.target.innerHTML = mdParser.parse(rawMd);
//   textarea.value = rawMd;

//   setCursorPosition(viewer, cursorPosition);
// })

// viewer.addEventListener('keydown', (e) => {
//   const characterMap = {
//     'Tab': {
//       char:'  ',
//       length: 2
//     },
//     'Enter': {
//       char:'\n',
//       length: 1
//     }
//   };

//   const key = characterMap[e.key];

//   if (key) {
//     e.preventDefault();
//     let cursorPosition = getCursorPosition(viewer, window.getSelection());
//     cursorPosition.pos += key.length;

//     const selection = window.getSelection().getRangeAt(0);
//     selection.deleteContents();
//     selection.insertNode(document.createTextNode(key.char));
//     selection.collapse(false);

//     const rawMd = mdParser.extractRawMarkdown(e.target.innerHTML);
//     e.target.innerHTML = mdParser.parse(rawMd);
//     textarea.value = rawMd;
  
//     setCursorPosition(viewer, cursorPosition);
//   }
// })


// textarea.addEventListener('input', contentUpdate);

// function contentUpdate(event) {
//   viewer.innerHTML = mdParser.parse(event.target.value);
// }

// function getCursorPosition(parent, selection) {
//   let node = selection.focusNode;
//   let offset = selection.focusOffset;
//   return findPosition(parent, node, offset, {pos: 0, done: false});
// }

// function findPosition(parent, node, offset, stat) {
//   if (stat.done) return stat;

//   let currentNode = null;
//   if (parent.childNodes.length == 0) {
//     stat.pos += parent.textContent.length;
//   } else {
//     for (var i = 0; i < parent.childNodes.length && !stat.done; i++) {
//       currentNode = parent.childNodes[i];
//       if (currentNode === node) {
//         stat.pos += offset;
//         stat.done = true;
//         return stat;
//       } else
//         findPosition(currentNode, node, offset, stat);
//     }
//   }
//   return stat;
// }

// //find the child node and relative position and set it on range
// function setCursorPosition(parent, cursorPosition) {
//   let selection = window.getSelection();
//   selection.removeAllRanges();
//   let range = mountRange(parent, document.createRange(), {  pos: cursorPosition.pos, done: false });
//   range.collapse(true);
//   selection.addRange(range);
// }

// function mountRange(parent, range, stat) {
//   if (stat.done) return range;

//   if (parent.childNodes.length == 0) {
//     if (parent.textContent.length >= stat.pos) {
//       range.setStart(parent, stat.pos);
//       stat.done = true;
//     } else {
//       stat.pos = stat.pos - parent.textContent.length;
//     }
//   } else {
//     for (var i = 0; i < parent.childNodes.length && !stat.done; i++) {
//       let currentNode = parent.childNodes[i];
//       mountRange(currentNode, range, stat);
//     }
//   }
//   return range;
// }