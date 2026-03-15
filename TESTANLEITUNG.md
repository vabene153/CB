# Testanleitung – Baustellen-CRM

So startest du die Anwendung und testest die Mitarbeiterverwaltung.

## Voraussetzungen

- **Node.js** (z. B. v18+)
- **MySQL** (z. B. über MAMP) – Datenbank `CB` anlegen
- **Server-** und **Client-**Umgebung (`.env`) wie in den Beispielen konfiguriert

## 1. Datenbank einrichten

```bash
cd server
cp .env.example .env
# .env anpassen: DATABASE_URL mit deinem MySQL-User/Passwort
# z. B. DATABASE_URL="mysql://root:root@localhost:3306/CB"
npm install
npx prisma migrate dev
npm run prisma:seed
```

Damit werden u. a. ein Mandant (Musterbau GmbH), Rollen und **Test-Benutzer** angelegt.

## 2. Server starten

```bash
cd server
npm run dev
```

Server läuft auf **http://localhost:4000** (oder dem in `server/.env` gesetzten `PORT`).

## 3. Client starten

In einem **zweiten Terminal**:

```bash
cd client
npm install
npm run dev
```

Frontend läuft auf **http://localhost:5173** (Vite).

Stelle sicher, dass in `client/.env` steht:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

(Angepasst an deinen Server-Port.)

## 4. Test-Logins (nach Seed)

| Rolle            | E-Mail               | Passwort     | Beschreibung |
|------------------|----------------------|--------------|--------------|
| Oberadministrator | `admin@musterbau.de` | `Passwort123!` | Sieht alle Mandanten, kann überall Mitarbeiter anlegen und Rechte bearbeiten. |
| Normaler Nutzer  | `bauleiter@musterbau.de` | `Bauleiter123!` | Sieht nur die eigene Firma (Musterbau), keine „Mitarbeiter anlegen“ / „Rechte bearbeiten“. |

## 5. Was testen?

### Als Oberadministrator (`admin@musterbau.de`)

1. **Login** → Dashboard
2. **Mandanten** → Liste; Mandant „Musterbau GmbH“ öffnen (Klick auf Namen) → Mandanten-Dashboard
3. **Mitarbeiter** (über Karte oder Sidebar):
   - Mandant „Musterbau GmbH“ auswählen
   - Liste prüfen (z. B. Anna Baumann, Marco Keller)
   - **+ Mitarbeiter anlegen** → Formular ausfüllen (E-Mail, Passwort min. 6 Zeichen, Name, ggf. Rollen) → Anlegen
   - Bei einem Mitarbeiter **Rechte bearbeiten** → Name/Position/Status/Rollen ändern → Speichern
4. **Kunden** (optional): Mandant wählen, Kundenliste und Anlegen/Bearbeiten testen

### Als normaler Nutzer (`bauleiter@musterbau.de`)

1. **Login** → Dashboard (Firmenname oben links = Musterbau GmbH)
2. **Mitarbeiter** → Es erscheinen nur die Mitarbeiter der eigenen Firma; **kein** „Mitarbeiter anlegen“, **kein** „Rechte bearbeiten“
3. Direktaufruf `/mitarbeiter/neu` → Meldung „Nur Oberadministratoren können neue Mitarbeiter anlegen.“

## 6. Häufige Probleme

- **404 / Netzwerkfehler im Frontend**: Prüfen, ob der Server auf dem in `VITE_API_BASE_URL` angegebenen Port läuft und CORS aktiv ist.
- **Login schlägt fehl**: Datenbank erreichbar? Seed ausgeführt? E-Mail/Passwort exakt wie in der Tabelle (Groß-/Kleinschreibung).
- **„Mandant wählen“ bleibt leer**: Als Oberadministrator einloggen; Rollen- und Mandanten-APIs werden nach Login geladen.

Wenn du möchtest, können wir als Nächstes z. B. weitere Testuser im Seed ergänzen oder die Anleitung um weitere Module erweitern.
