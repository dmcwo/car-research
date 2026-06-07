#!/usr/bin/env node
// Generates content/bundle-func.js — a single self-contained function
// carResearchExtract() that can be passed directly to scripting.executeScript
// as `func`, bypassing page CSP entirely (no eval / new Function needed).

var fs = require('fs');
var path = require('path');

var root = path.join(__dirname, '..');

// These files contain the extraction logic. Their top-level var/function
// declarations become locals inside the wrapper function.
var files = [
  'shared/model.js',
  'shared/constants.js',
  'content/utils/dom-helpers.js',
  'content/utils/price-parser.js',
  'content/utils/normalize.js',
  'content/extractors/generic-jsonld.js',
  'content/extractors/generic-heuristic.js',
  'content/extractors/carvana.js',
  'content/extractors/carmax.js',
  'content/extractors/cars-com.js',
  'content/extractors/autotrader.js',
  'content/extractors/kbb.js',
  'content/extractors/craigslist.js'
];

var inner = '';
files.forEach(function(f) {
  var src = fs.readFileSync(path.join(root, f), 'utf8');
  inner += '  // === ' + f + ' ===\n';
  // Indent each line by 2 spaces
  inner += src.split('\n').map(function(line) { return '  ' + line; }).join('\n');
  inner += '\n\n';
});

// Append the extraction body (without the IIFE wrapper — it becomes the
// function body itself, returning the result directly)
var extractSrc = fs.readFileSync(path.join(root, 'scripts/extract-body.js'), 'utf8');
inner += extractSrc.split('\n').map(function(line) { return '  ' + line; }).join('\n');

var out = '// AUTO-GENERATED — do not edit. Run: npm run bundle\n\n';
out += 'function carResearchExtract() {\n';
out += inner;
out += '\n}\n';

var outPath = path.join(root, 'content', 'bundle-func.js');
fs.writeFileSync(outPath, out);
console.log('Generated content/bundle-func.js (' + out.length + ' bytes)');
