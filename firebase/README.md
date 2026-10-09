# Firebase Realtime Database

Die Geräte im Quiz müssen sich finden. Dafür dient die **Firebase Realtime Database** im kostenlosen Spark-Tarif
(keine Abrechnung, also keine Kosten möglich). Die App spricht sie per REST und Server-Sent Events an – ohne
Firebase-SDK, damit im Browser nichts gespeichert wird.

| | |
| --- | --- |
| Datenbank | `VITE_FIREBASE_DATABASE_URL` in `.env` (öffentlich; Schutz über die Regeln) |
| Regeln | [`database.rules.json`](database.rules.json) – in der Firebase-Konsole unter *Realtime Database → Rules* eintragen |

## Datenmodell

```
quiz/<Raumcode>/an/<Empfänger>/<Nachricht> = { s: "<Signal als JSON, ≤ 60 000 Zeichen>", t: <Serverzeit> }
quiz-oeffentlich/<Raumcode> = { n: Raumname, s: Spielerzahl, t: Serverzeit }
```

- Empfänger: `leitung` (Spielleitung) oder die zufällige ID eines Gasts. Jedes Gerät liest nur sein Postfach und
  löscht jede Nachricht sofort nach dem Lesen; beim Verlassen löscht ein Gast sein Postfach, die Spielleitung den Raum.
- Öffentliche Räume stehen in `quiz-oeffentlich`, solange der Raum auf Mitspielende wartet.
- Reste nach einem harten Abbruch löscht der Workflow [`aufraeumen.yml`](../.github/workflows/aufraeumen.yml) täglich.
  Dafür braucht das Repository das Secret `FIREBASE_DATABASE_SECRET` (Firebase-Konsole → *Projekteinstellungen →
  Dienstkonten → Datenbank-Secrets*; setzen mit `gh secret set FIREBASE_DATABASE_SECRET`). Ohne Secret tut der
  Workflow nichts.

Wer den Raumcode kennt, kann die Nachrichten des Raums lesen oder ihn löschen – der Code ist das Geheimnis des Raums.

Grenzen des Spark-Tarifs: 100 gleichzeitige Verbindungen, 10 GB Download im Monat. Ist das Kontingent erschöpft,
schlägt das Eröffnen von Räumen fehl; Kosten entstehen nicht.
