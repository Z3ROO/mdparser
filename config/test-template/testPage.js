import mdParser from "../../dist/esm/index.js";

const textarea = document.getElementById('textarea2');
const viewer = document.getElementById('viewer');
textarea.addEventListener('change', contentUpdate);

textarea.addEventListener('textInput', contentUpdate);

textarea.addEventListener('input', contentUpdate);

function contentUpdate(event) {
  viewer.innerHTML = mdParser.parse(event.target.value)
}