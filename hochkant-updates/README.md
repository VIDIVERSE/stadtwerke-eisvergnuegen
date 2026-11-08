# Hochkant – Fern-Updates

Hochkant (Gäste-Fotobildschirm von Jonathan für interevent) prüft alle 15 Minuten `latest.json` in diesem Ordner.
Ist `build` neuer als die laufende Version, wird `bundle-<build>.json` geladen und nach Bestätigung (oder automatisch) installiert.
Einstellungen und Fotos bleiben dabei erhalten.

- `latest.json` – aktuelle Version, Build-Nummer, Notizen, Prüfsumme
- `bundle-<build>.json` – alle Programmdateien (Base64)
- `quelle/` – Startlader (`boot.js`), `package.json` für den EXE-Bau und `make-update.js` zum Erzeugen neuer Updates
