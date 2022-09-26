import { MDParser } from "../../dist/esm/index.mjs";

const textarea = document.getElementById('textarea2');
const viewer = document.getElementById('viewer');
textarea.addEventListener('change', (event) => {
  viewer.innerHTML = new MDParser(event.target.value).parsedText
});