// Erzeugt ein signiertes Fern-Update:
//   HK_SIGN_KEY=pfad/zum/privaten-schluessel.pem node tools/make-update.js "Was ist neu" [Ausgabeordner] [--exe dist/Hochkant-x.y.z.exe]
// Ergebnis: <out>/hochkant-updates/latest.json + bundle-<build>.json (+ exe/…-Teile) → ins Update-Repo pushen.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const args = process.argv.slice(2), exeIdx = args.indexOf('--exe');
const exeFile = exeIdx >= 0 ? args.splice(exeIdx, 2)[1] : null;
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const notes = args[0] || '';
const out = path.join(args[1] || path.join(root, 'update-out'), 'hochkant-updates');
const keyFile = process.env.HK_SIGN_KEY; if (!keyFile) { console.error('HK_SIGN_KEY fehlt (privater Schlüssel)'); process.exit(1); }
const key = crypto.createPrivateKey(fs.readFileSync(keyFile));
const names = fs.readdirSync(root).filter(f => /\.(js|html|png|json)$/.test(f) && !/^(package-lock\.json|boot\.js|build-icon\.png)$/.test(f));
const files = {}; for (const f of names) files[f] = fs.readFileSync(path.join(root, f)).toString('base64');
const bundle = Buffer.from(JSON.stringify({ build: pkg.hkBuild, version: pkg.version, files }));
const file = 'bundle-' + pkg.hkBuild + '.json';
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, file), bundle);
const latest = { version: pkg.version, build: pkg.hkBuild, minBoot: 1, notes, file, sha256: crypto.createHash('sha256').update(bundle).digest('hex'), size: bundle.length, date: new Date().toISOString() };
if (exeFile) {
  const b = fs.readFileSync(exeFile), PART = 40 * 1024 * 1024, parts = [];
  fs.mkdirSync(path.join(out, 'exe'), { recursive: true });
  for (let i = 0, n = 0; i < b.length; i += PART, n++) { const p = 'exe/Hochkant-' + pkg.version + '.exe.' + String(n).padStart(3, '0'); fs.writeFileSync(path.join(out, p), b.subarray(i, i + PART)); parts.push(p); }
  latest.exe = { version: pkg.version, build: pkg.hkBuild, parts, sha256: crypto.createHash('sha256').update(b).digest('hex'), size: b.length };
}
const x = latest.exe ? [latest.exe.version, latest.exe.build, latest.exe.parts, latest.exe.sha256, latest.exe.size] : null;
const payload = Buffer.from(JSON.stringify(['hochkant-update-v1', latest.version, latest.build, latest.minBoot, latest.file, latest.sha256, latest.size, x]), 'utf8');
latest.sig = crypto.sign(null, payload, key).toString('base64');
fs.writeFileSync(path.join(out, 'latest.json'), JSON.stringify(latest, null, 1));
console.log(JSON.stringify({ version: latest.version, build: latest.build, exe: !!latest.exe }), names.join(' '));
