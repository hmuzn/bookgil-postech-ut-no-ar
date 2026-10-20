import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const files = ['index.html', 'style.css', 'design.css', 'motion.js', 'routing.js', 'access-routing.js', 'app.js', 'catalog-search.js', 'vendor/qrcode.js', 'start-qr.js', 'assets/postech-3f-stacks.png'];
const assets = Object.fromEntries(files.map(file => {
  const binary = file.endsWith('.png');
  return [`/${file}`, {binary, body: fs.readFileSync(path.join(root, file), binary ? 'base64' : 'utf8')}];
}));
const version = createHash('sha256').update(files.map(file => assets[`/${file}`].body).join('')).digest('hex').slice(0, 10);
assets['/index.html'].body = assets['/index.html'].body.replace(
  /((?:href|src)="\.\/(?:style\.css|design\.css|motion\.js|routing\.js|access-routing\.js|app\.js|catalog-search\.js|vendor\/qrcode\.js|start-qr\.js))"/g,
  `$1?v=${version}"`
);
const out = path.join(root, 'dist');
fs.mkdirSync(path.join(out, 'server'), {recursive: true});
fs.mkdirSync(path.join(out, '.openai'), {recursive: true});
const hosting = JSON.parse(fs.readFileSync(path.join(root, '.openai/hosting.json'), 'utf8'));
fs.writeFileSync(path.join(out, '.openai/hosting.json'), JSON.stringify(hosting, null, 2));
const catalog = fs.readFileSync(path.join(root, 'catalog-api.mjs'), 'utf8').replaceAll('export ', '');
const worker = fs.readFileSync(path.join(root, 'worker.mjs'), 'utf8')
  .replace("import {searchCatalog} from './catalog-api.mjs';", '')
  .replaceAll('export ', '');
fs.writeFileSync(path.join(out, 'server/index.js'),
  `${catalog}\n${worker}\nexport default createHandler(${JSON.stringify(assets)});\n`);
