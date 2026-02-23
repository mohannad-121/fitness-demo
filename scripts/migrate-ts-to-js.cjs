const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = process.cwd();
const ignoreDirs = new Set(['node_modules', '.git', 'dist', '.venv']);
const exts = new Set(['.ts', '.tsx']);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoreDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

const allFiles = walk(root);
const tsFiles = allFiles.filter((f) => exts.has(path.extname(f)));

function outExt(file) {
  const ext = path.extname(file);
  if (ext === '.tsx') return '.jsx';
  return '.js';
}

function fixImportExts(code) {
  return code
    .replace(/(from\s+['"][^'"]+)\.tsx(['"])/g, '$1.jsx$2')
    .replace(/(from\s+['"][^'"]+)\.ts(['"])/g, '$1.js$2')
    .replace(/(import\s*\(\s*['"][^'"]+)\.tsx(['"]\s*\))/g, '$1.jsx$2')
    .replace(/(import\s*\(\s*['"][^'"]+)\.ts(['"]\s*\))/g, '$1.js$2')
    .replace(/(require\(\s*['"][^'"]+)\.tsx(['"]\s*\))/g, '$1.jsx$2')
    .replace(/(require\(\s*['"][^'"]+)\.ts(['"]\s*\))/g, '$1.js$2');
}

for (const file of tsFiles) {
  if (file.endsWith('.d.ts')) {
    fs.unlinkSync(file);
    console.log('deleted', path.relative(root, file));
    continue;
  }

  const source = fs.readFileSync(file, 'utf8');
  const ext = path.extname(file);
  const loader = ext === '.tsx' ? 'tsx' : 'ts';

  let code;
  try {
    code = esbuild.transformSync(source, {
      loader,
      format: 'esm',
      jsx: 'automatic',
      target: 'es2020',
      sourcemap: false,
    }).code;
  } catch (e) {
    console.error('Transform failed for', file, e.message);
    process.exitCode = 1;
    continue;
  }

  code = fixImportExts(code);
  const newFile = file.slice(0, -ext.length) + outExt(file);

  fs.writeFileSync(newFile, code, 'utf8');
  fs.unlinkSync(file);
  console.log('converted', path.relative(root, file), '->', path.relative(root, newFile));
}

const jsLike = walk(root).filter((f) => ['.js', '.jsx', '.mjs', '.cjs'].includes(path.extname(f)));
for (const file of jsLike) {
  const src = fs.readFileSync(file, 'utf8');
  const out = fixImportExts(src);
  if (out !== src) fs.writeFileSync(file, out, 'utf8');
}

console.log('done');
