#!/usr/bin/env node
// Simple bundler: concatenate content scripts in dependency order into content/bundle.js

var fs = require('fs');
var path = require('path');

var root = path.join(__dirname, '..');

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
  'content/extractors/craigslist.js',
  'content/extract.js'
];

var out = '// AUTO-GENERATED — do not edit. Run: npm run bundle\n\n';

files.forEach(function(f) {
  var src = fs.readFileSync(path.join(root, f), 'utf8');
  out += '// === ' + f + ' ===\n';
  out += src + '\n\n';
});

var outPath = path.join(root, 'content', 'bundle.js');
fs.writeFileSync(outPath, out);
console.log('Bundled ' + files.length + ' files -> content/bundle.js (' + out.length + ' bytes)');
