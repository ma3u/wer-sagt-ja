# Firebase Realtime Database

Die Geräte im Quiz müssen sich finden. Dafür dient die **Firebase Realtime Database** im kostenlosen Spark-Tarif
(keine Abrechnung, also keine Kosten möglich). Die App spricht sie per REST und Server-Sent Events an – ohne
Firebase-SDK, damit im Browser nichts gespeichert wird.

| | |
| --- | --- |
| Datenbank | lokal `VITE_FIREBASE_DATABASE_URL` in `.env`, beim Veröffentlichen die Repository-Variable `FIREBASE_DATABASE_URL` (öffentlich; Schutz über die Regeln) |
| Regeln | [`database.rules.json`](database.rules.json) – in der Firebase-Konsole unter *Realtime Database → Rules* eintragen |

## Eigenes Projekt anlegen oder wechseln

1. In der [Firebase-Konsole](https://console.firebase.google.com/) ein Projekt anlegen (z. B. `wer-sagt-ja`), ohne
   Google Analytics, Tarif Spark.
2. *Realtime Database → Datenbank erstellen*, Standort `europe-west1` (Belgien), im gesperrten Modus starten.
3. Unter *Rules* den Inhalt von [`database.rules.json`](database.rules.json) eintragen und veröffentlichen.
4. Die Adresse der Datenbank (`https://<projekt>-default-rtdb.europe-west1.firebasedatabase.app`) setzen:
   `gh variable set FIREBASE_DATABASE_URL --body "<Adresse>"` – der nächste Push veröffentlicht die App damit.
   Lokal dieselbe Adresse als `VITE_FIREBASE_DATABASE_URL` in `.env`.
5. Optional für das tägliche Aufräumen das Datenbank-Secret setzen (siehe unten).

Die Datenschutzerklärung nennt den Standort automatisch aus der Adresse.

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
