# ShadowPing v1.5 – Release Notes

## Was ist neu

### Geräte-Sperre pro Account und Lobby
Ein Account kann jetzt nur noch von **einem Gerät gleichzeitig** in derselben Lobby sein. Wenn du versuchst, dich auf einem zweiten Handy/PC mit dem gleichen Account in dieselbe Lobby einzuloggen, wird das zweite Gerät blockiert und zeigt einen Hinweis, dass die Lobby bereits auf einem anderen Gerät offen ist.

Das verhindert Verwirrung durch doppelte Rollen-Wechsel, parallele GPS-Updates und den "Spieler"-Anzeigefehler, wenn zwei Geräte denselben `lobby_players`-Eintrag teilen.

**Technisch:**  
Neue Spalte `device_id` in `lobby_players`. Beim Beitritt wird eine persistente Geräte-ID (lokal im Browser gespeichert) geschrieben. Bestehende Einträge ohne `device_id` (altes Format) werden beim ersten Öffnen vom aktuellen Gerät "adoptiert". Alle Hintergrund-Updates (Heartbeat, GPS, Batterie, Offline-on-leave) laufen nur noch, wenn die `device_id` zum aktuellen Gerät passt.

> **Wichtig:** Führe einmalig in Supabase → SQL Editor aus:
> ```sql
> alter table public.lobby_players add column if not exists device_id text;
> ```

### Name beim Beitritt korrigiert
Früher wurde manchmal "Spieler" als Anzeigename gespeichert, wenn das Profil noch nicht geladen war. Jetzt wird der echte Profilname (oder E-Mail-Präfix) zuverlässig genutzt – auch wenn das Profil asynchron nachlädt.

## Verbesserungen

- Alle Eintrittspfade (Dashboard: Lobby erstellen, Code beitreten, QR-Scan; Lobby: Host Auto-Join; Ergebnisse: Rematch; Einladungen: Annehmen) schreiben jetzt konsistent `device_id` und den korrigierten Namen.
- Guard-Logik in Lobby und Game: Blockierte Geräte führen keine Datenbank-Updates mehr aus – das erste Gerät bleibt "Besitzer" der Zeile.

## Migration

Einmalig in Supabase ausführen (siehe oben). Danach funktioniert alles automatisch – keine weiteren Schritte nötig.

---

**Vollständige Commit-History** findest du im privaten Source-Repository.