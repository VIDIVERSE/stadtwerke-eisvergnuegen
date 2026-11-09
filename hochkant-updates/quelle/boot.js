// Hochkant – Startlader: lädt ein heruntergeladenes Update, sonst die eingebaute Version.
// Einstellungen und Fotos liegen getrennt im Benutzerordner und bleiben bei Updates erhalten.
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const BOOT_VERSION = 1;
const builtin = require('./package.json');
const UPD = path.join(app.getPath('userData'), 'updates');
const CUR = path.join(UPD, 'current.json');

global.HK_REQUIRE = require;            // damit Updates die eingebauten Module (qrcode) finden
global.HK_BUILTIN = { dir: __dirname, build: builtin.hkBuild || 0, version: builtin.displayVersion || builtin.version };
global.HK_BOOT_VERSION = BOOT_VERSION;
global.HK_ACTIVE = { dir: __dirname, build: global.HK_BUILTIN.build, version: global.HK_BUILTIN.version, fromUpdate: false };

function readCur() { try { return JSON.parse(fs.readFileSync(CUR, 'utf8')); } catch (e) { return null; } }
function writeCur(c) { try { fs.mkdirSync(UPD, { recursive: true }); fs.writeFileSync(CUR, JSON.stringify(c, null, 1)); } catch (e) {} }

// Wird von main.js aufgerufen, sobald das Steuerfenster sauber angezeigt wird
global.HK_BOOT_OK = () => { const c = readCur(); if (c && c.tries) { c.tries = 0; writeCur(c); } };

global.HK_RELAUNCH = () => {
  const exe = process.env.PORTABLE_EXECUTABLE_FILE;
  app._hkExiting = true; process.env.HK_WAIT_LOCK = '1'; app.relaunch(exe ? { execPath: exe, args: [] } : undefined); app.exit(0);
};
let loaded = false;
(function () {
const c = readCur();
if (c && c.build > global.HK_BUILTIN.build && (c.minBoot || 1) <= BOOT_VERSION && (c.tries || 0) < 3) {
  const dir = path.join(UPD, String(c.build));
  if (fs.existsSync(path.join(dir, 'main.js'))) {
    c.tries = (c.tries || 0) + 1; writeCur(c);
    global.HK_ACTIVE = { dir, build: c.build, version: c.version, fromUpdate: true };
    try { require(path.join(dir, 'main.js')); loaded = true; }
    catch (e) { c.bad = c.build; c.tries = 99; c.err = String(e && e.message || e); writeCur(c); global.HK_RELAUNCH(); return; }
  }
} else if (c && (c.tries || 0) >= 3 && c.build > global.HK_BUILTIN.build) {
  global.HK_UPDATE_ERROR = 'Update ' + c.version + ' ist nicht sauber gestartet' + (c.err ? ' (' + c.err + ')' : '') + ' – es läuft wieder die eingebaute Version.';
}
})();
if (!loaded && !app._hkExiting) {
  global.HK_ACTIVE = { dir: __dirname, build: global.HK_BUILTIN.build, version: global.HK_BUILTIN.version, fromUpdate: false };
  require('./main.js');
}
