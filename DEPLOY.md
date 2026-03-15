# CB-CRM live schalten

So bringst du die Anwendung in den Produktionsbetrieb (ein Server, eine Domain).

## Voraussetzungen

- **Node.js** (z. B. 18 LTS)
- **MySQL** (Datenbank anlegen, Nutzer mit Rechten)
- Auf dem Zielserver: Build einmal ausführen oder fertiges Build deployen

## 1. Umgebungsvariablen

### Server (`server/.env`)

Kopiere `server/.env.example` nach `server/.env` und passe an:

```env
DATABASE_URL="mysql://USER:PASSWORT@HOST:3306/DBNAME"
JWT_ACCESS_SECRET="<starkes-geheimes-token>"
JWT_REFRESH_SECRET="<weiteres-geheimes-token>"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=4000
NODE_ENV=production
UPLOAD_DIR="./uploads"
```

- `JWT_ACCESS_SECRET` und `JWT_REFRESH_SECRET`: lange, zufällige Strings (z. B. `openssl rand -hex 32`).
- `PORT`: Port, auf dem der Node-Server lauscht (z. B. 4000 oder 8080).

### Client

Für den Produktions-Build wird automatisch `/api` als API-Basis verwendet (Datei `client/.env.production`). Die App läuft dann auf dem gleichen Host wie der Server; Anfragen gehen an `https://deine-domain.de/api/...`.

## 2. Build ausführen

### Option A: Build-Skript (empfohlen)

```bash
chmod +x scripts/build.sh
./scripts/build.sh
```

Das Skript:

1. baut den Client (`client/dist`),
2. kopiert die Dateien nach `server/public`,
3. baut den Server (`server/dist`).

### Option B: Manuell

```bash
# Client
cd client
npm install
npm run build
cd ..

# Frontend ins Server-Verzeichnis
mkdir -p server/public
cp -r client/dist/* server/public

# Server
cd server
npm install
npx prisma generate
npm run build
cd ..
```

## 3. Datenbank

Auf dem Server (oder deiner MySQL-Instanz):

```bash
cd server
npx prisma migrate deploy
npm run prisma:seed   # optional: Testdaten
```

## 4. Server starten

```bash
cd server
NODE_ENV=production npm start
```

Die App ist erreichbar unter **http://localhost:4000** (bzw. dem gewählten `PORT`).  
- Startseite/Login: `http://localhost:4000/`  
- API: `http://localhost:4000/api/...`

## 5. Dauerhaft betreiben

### Mit systemd (Linux)

Beispiel-Unit `/etc/systemd/system/cb-crm.service`:

```ini
[Unit]
Description=CB-CRM
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/pfad/zu/CB/server
Environment=NODE_ENV=production
Environment=PORT=4000
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Dann:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cb-crm
sudo systemctl start cb-crm
```

### Mit PM2

```bash
npm install -g pm2
cd server
NODE_ENV=production pm2 start dist/server.js --name cb-crm
pm2 save
pm2 startup
```

## 6. Reverse-Proxy (z. B. Nginx)

Wenn Nginx (oder Apache) vor dem Node-Prozess steht und SSL beendet:

```nginx
server {
    listen 80;
    server_name deine-domain.de;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name deine-domain.de;
    ssl_certificate     /pfad/zu/cert.pem;
    ssl_certificate_key /pfad/zu/key.pem;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Danach die App unter **https://deine-domain.de** nutzen.

## 7. Checkliste vor Go-Live

- [ ] `NODE_ENV=production` gesetzt
- [ ] Starke JWT-Secrets, nicht die Beispiele aus `.env.example`
- [ ] Datenbank-Backups eingerichtet
- [ ] HTTPS über Reverse-Proxy
- [ ] Nach Seed: Demo-Passwörter ändern oder Seed weglassen
