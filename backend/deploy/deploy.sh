#!/usr/bin/env bash
# Atualiza e reinicia a API na EC2: ./deploy/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only
npm ci
npx prisma migrate deploy
npm run build
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
curl -fsS http://127.0.0.1:3333/api/health && echo " <- API ok"
