#!/usr/bin/env bash
# Gera o build web do Expo e publica no Nginx: ./deploy-web.sh
set -euo pipefail
cd "$(dirname "$0")"
git pull --ff-only || true
npm ci
NODE_OPTIONS=--max-old-space-size=1536 npx expo export --platform web
sudo mkdir -p /var/www/cinema
sudo rsync -a --delete dist/ /var/www/cinema/
echo "Front publicado em /var/www/cinema"
