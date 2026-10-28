PWIB-Parteipositionen für Wer sagt Ja?
Auszug vom 2026-10-28; zugrunde liegende Schätzung: 20.10.2026.

UMFANG UND DATEIEN
77 Programmdokumente zu den zehn angefragten Wahlen auf zwei Dimensionen.
CSV und JSON enthalten dieselben Zeilen und Variablen; das JSON ist ein Array von Objekten.
UTF-8; CSV mit Komma als Feldtrenner und Punkt als Dezimalzeichen.
Alle sechs numerischen Positions- und Intervallvariablen sind auf zwei Nachkommastellen gerundet.
Die Rundung erzeugt in keiner der zehn Wahlen auf einer der beiden Positionsskalen
neue Rangbindungen oder Rangänderungen. Spearman-Korrelationen bleiben dadurch auch
für Teilmengen der jeweils enthaltenen Parteien unverändert.

ABDECKUNG (Parteicodes)
de2025 | Deutschland | 8 Dokumente | afd, bsw, cdu, csu, fdp, gru, pds, spd
th2024 | Thüringen | 8 Dokumente | afd, bsw, cdu, fdp, fwg, gru, pds, spd
sn2024 | Sachsen | 8 Dokumente | afd, bsw, cdu, fdp, fwg, gru, pds, spd
bb2024 | Brandenburg | 8 Dokumente | afd, bsw, cdu, fdp, fwg, gru, pds, spd
hh2025 | Hamburg | 8 Dokumente | afd, bsw, cdu, fdp, fwg, gru, pds, spd
bw2026 | Baden-Württemberg | 8 Dokumente | afd, bsw, cdu, fdp, fwg, gru, pds, spd
rp2026 | Rheinland-Pfalz | 8 Dokumente | afd, bsw, cdu, fdp, fwg, gru, pds, spd
st2026 | Sachsen-Anhalt | 7 Dokumente | afd, bsw, cdu, fdp, gru, pds, spd
be2026 | Berlin | 7 Dokumente | afd, bsw, cdu, fdp, gru, pds, spd
mv2026 | Mecklenburg-Vorpommern | 7 Dokumente | afd, bsw, cdu, fdp, gru, pds, spd

Volt ist im gesamten aktuellen Schätzdatensatz nicht enthalten. Es werden keine Werte ergänzt
oder aus anderen Parteien bzw. Bundes- und Landesverbänden übertragen. Auch andere im Quiz
berücksichtigte Kleinparteien können fehlen. Fehlende Einträge sind keine Nullpositionen.
Koalitionsverträge (koa) und Sondierungspapiere (son) wurden ausdrücklich ausgeschlossen.
Von 87 Dokumenten der angefragten Wahlen bleiben damit 77 Programmdokumente.
Wahltage werden nicht exportiert, da sie in den Quelldaten für mehrere Wahlen fehlen.

SONDERFALL CDU/CSU 2025
de2025cdu ist das gemeinsame Bundestagswahlprogramm von CDU und CSU.
de2025csu ist die zusätzliche CSU-Bayern-Agenda (document_type = supplement).
Für einen gemeinsamen Quiz-Akteur CDU/CSU bitte de2025cdu verwenden. Die zusätzliche
CSU-Zeile nicht als zweite unabhängige Union-Partei zählen und die beiden Werte nicht mitteln.
Die übrigen 76 Zeilen einschließlich de2025cdu tragen document_type = election_manifesto.

VARIABLEN UND SKALENRICHTUNG
landyearparty: ursprüngliche eindeutige PWIB-Dokument-ID, z.B. bw2026bsw.
landyear: Wahl-ID; land: ursprüngliches Gebietskürzel (de = Bund).
land_name, year: Gebietsname und Wahljahr.
party, party_name: ursprünglicher Parteicode und Anzeigename. pds bezeichnet Die Linke,
gru die Grünen und fwg die Freien Wähler. Nur der BSW-Anzeigename wurde von Sara zu Sahra korrigiert.
document_type, document_note: Kennzeichnung der oben erläuterten Unionsdokumente.
econ_pos_norm: normierte wirtschaftspolitische Position. Niedrige Werte stehen für stärker
interventionistische/umverteilende, hohe für stärker marktorientierte Positionen.
Die Skala erfasst den breiten wirtschaftspolitischen Links-Rechts-Konflikt; sie ist keine
gesonderte Messung ausschließlich sozialstaatlicher Positionen.
soci_pos_norm: normierte gesellschaftspolitische Position; niedrig = progressiv/liberal,
hoch = konservativ/traditionell. Dies ist keine gesonderte Einwanderungsskala.
econ_pos_lwr_norm, econ_pos_upr_norm: untere/obere Grenze des modellbasierten 95%-Konfidenzintervalls.
soci_pos_lwr_norm, soci_pos_upr_norm: entsprechende Grenzen der gesellschaftspolitischen Position.
Die Variablennamen und die Normierung des Ausgangsdatensatzes bleiben erhalten.
Die Werte sind keine auf 0 bis 10 begrenzten CHES-Werte. Auch negative Werte sind möglich
und dürfen nicht auf null gesetzt werden. Für Spearman zählt die Rangfolge je Wahl und Dimension.
Die Intervalle quantifizieren modellinterne Unsicherheit, nicht sämtliche möglichen Messfehler.

METHODE UND VERWENDUNG
Die Positionen wurden mit Wordscores aus den vollständigen Wahlprogrammen geschätzt und
auf die im PWIB-Projekt verwendete Referenzskala normiert. Für die Vergleiche werden die
Positionsvariablen (_pos_norm) verwendet, nicht die thematischen Salienzvariablen (_sal_).
Die ausgewiesenen Positionen sind Schätzungen, keine Einstufungen einzelner Quiz-Aussagen.

Für die beschriebene Plausibilitätsprüfung ist der Vergleich sinnvoll. Er ist aber keine
von den Wahlprogrammen unabhängige Validierung, weil beide Auswertungen dieselben Quellen nutzen.
Expertenschätzungen wie CHES können als ergänzender Robustheitscheck dienen. Sie sind ihrerseits
nicht zwangsläufig unabhängig von Programmtexten und bilden hier eine andere territoriale Ebene ab.

Je Frage nur Parteien mit verfügbarer Position UND belegter Ja-/Nein-Antwort vergleichen.
Fehlende oder unklare Aussagen nicht als Nein kodieren. Bei ausschließlich Ja- oder ausschließlich
Nein-Antworten ist die Korrelation undefiniert. Die Zahl der einbezogenen Parteien ausweisen.
Bei wenigen Parteien und nahe beieinanderliegenden Positionen das Vorzeichen vorsichtig deuten.
Gleich viele Fragen mit positivem und negativem Zusammenhang belegen für sich genommen weder
thematische Vollständigkeit noch eine insgesamt ausgewogene Fragenauswahl.

QUELLENANGABE
Bräuninger, Thomas; Debus, Marc; Müller, Jochen; Stecker, Christian (2020):
Parteienwettbewerb in den deutschen Bundesländern. 2., vollständig überarbeitete Auflage.
Wiesbaden: Springer VS. https://doi.org/10.1007/978-3-658-29222-5
Zusatz für diesen Auszug: Fortgeschriebene PWIB-Wordscores-Daten, Schätzstand 20.10.2026;
Auszug für Wer sagt Ja? vom 28.10.2026 (Wahlen 2024–2026).
Das Buch dokumentiert die Methode; die jüngeren Wahlen stammen aus der Fortschreibung.
Die bibliografischen Angaben wurden auf der Verlagsseite geprüft.

VERWENDUNGSZWECK
Nutzung für die beschriebene Prüfung der Fragenkataloge und deren Methodendarstellung,
einschließlich Ablage dieses Auszugs mit vollständiger Quellenangabe im öffentlichen
AGPL-3.0-Repository von Wer sagt Ja?, wie im Begleitschreiben vorgesehen.
Hier wird keine neue allgemeine Lizenz für den gesamten PWIB-Datensatz festgelegt.

PROVENIENZ UND REPRODUKTION
Quelldatei: analysis/wordscores/output/wordscores.rds
MD5 der unveränderten Quelldatei: 99704470f5d010a65685e2b4d69ec072
Reproduktion aus der PWIB-Projektwurzel:
Rscript analysis/wordscores/R/export_wer_sagt_ja.R
Der Export gleicht RDS und CSV ab, prüft eindeutige IDs, Vollständigkeit der ausgewählten
Positionen, Intervallgrenzen, unveränderte Ränge nach Rundung und beide Ausgabedateien.
