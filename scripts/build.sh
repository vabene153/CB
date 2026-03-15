#!/usr/bin/env bash
# Produktions-Build: Client bauen, nach server/public kopieren, Server bauen
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

echo "→ Client bauen..."
cd client
npm install
npm run build
cd ..

echo "→ Frontend nach server/public kopieren..."
mkdir -p server/public
rm -rf server/public/*
cp -r client/dist/* server/public

echo "→ Server bauen..."
cd server
npm install
npx prisma generate
npm run build
cd ..

echo "✓ Build fertig. Start mit: cd server && NODE_ENV=production npm start"
