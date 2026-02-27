import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');
const exts = new Set(['.js', '.mjs', '.ts', '.jsx', '.tsx', '.vue']);
let changed = 0;
let touchedFiles = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === 'node_modules' || name.name === '.git') continue;
      walk(full);
    } else if (name.isFile()) {
      if (exts.has(path.extname(name.name))) processFile(full);
    }
  }
}

function processFile(filePath) {
  let s = fs.readFileSync(filePath, 'utf8');
  const orig = s;
  const re = /catch\s*\{\s*\}/g;
  s = s.replace(re, 'catch (e) { console.debug?.(e); }');

  if (s !== orig) {
    fs.writeFileSync(filePath, s, 'utf8');
    changed++;
    touchedFiles.push(filePath);
    console.log('Fixed:', filePath);
  }
}

console.log('Scanning from', root);
const jsRoot = path.join(root, 'js');
if (!fs.existsSync(jsRoot)) {
  console.log('No js/ directory found at', jsRoot);
  process.exit(0);
}
walk(jsRoot);
console.log('Files changed:', changed);
if (changed) console.log(touchedFiles.join('\n'));
process.exit(0);
