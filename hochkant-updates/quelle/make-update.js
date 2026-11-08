// Erzeugt ein Fern-Update: node tools/make-update.js "Was ist neu" [Ausgabeordner]
// Ergebnis: <out>/hochkant-updates/latest.json + bundle-<build>.json → ins Update-Repo pushen.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const notes = process.argv[2] || '';
const out = path.join(process.argv[3] || path.join(root, 'update-out'), 'hochkant-updates');
const names = fs.readdirSync(root).filter(f => /\.(js|html|png|json)$/.test(f) && !/^(package-lock\.json|boot\.js|build-icon\.png|logo-black\.png)$/.test(f));
const files = {}; for (const f of names) files[f] = fs.readFileSync(path.join(root, f)).toString('base64');
const bundle = Buffer.from(JSON.stringify({ build: pkg.hkBuild, version: pkg.version, files }));
const file = 'bundle-' + pkg.hkBuild + '.json';
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, file), bundle);
const latest = { version: pkg.version, build: pkg.hkBuild, minBoot: 1, notes, file, sha256: crypto.createHash('sha256').update(bundle).digest('hex'), size: bundle.length, date: new Date().toISOString() };
fs.writeFileSync(path.join(out, 'latest.json'), JSON.stringify(latest, null, 1));
console.log(JSON.stringify(latest), names.join(' '));
