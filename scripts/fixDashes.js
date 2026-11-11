const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'client', 'src');

const replacements = [
  [/\u2014/g, '-'],       // em dash —
  [/\u2013/g, '-'],       // en dash –
  [/\u2026/g, '...'],     // ellipsis …
  [/\u00d7/g, 'x'],       // multiplication ×
  [/\u2018/g, "'"],       // left single quote
  [/\u2019/g, "'"],       // right single quote
  [/\u201c/g, '"'],       // left double quote
  [/\u201d/g, '"'],       // right double quote
];

let fileCount = 0;
let replaceCount = 0;

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.jsx') || entry.name.endsWith('.js'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      let count = 0;

      for (const [pattern, replacement] of replacements) {
        const matches = content.match(pattern);
        if (matches) {
          count += matches.length;
          content = content.replace(pattern, replacement);
        }
      }

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed: ${fullPath.replace(ROOT + path.sep, '')} (${count})`);
        fileCount++;
        replaceCount += count;
      }
    }
  }
};

console.log('Scanning...\n');
walk(ROOT);
console.log(`\nFiles fixed: ${fileCount}`);
console.log(`Replacements: ${replaceCount}`);