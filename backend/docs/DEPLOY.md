# Deploy na AWS (EC2 Ubuntu 24.04 + RDS PostgreSQL)

```bash
# 1. Código
cd ~ && git clone https://github.com/SEU_USUARIO/cinema-api.git && cd cinema-api

# 2. CA do RDS (valida o certificado TLS do banco)
curl -fsSL -o ~/rds-global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# 3. .env
cp .env.example .env && nano .env   # DATABASE_URL, JWT_SECRET (openssl rand -hex 32), CORS_ORIGIN

# 4. Instalar, migrar, popular, compilar, subir
npm ci
npx prisma migrate deploy
npm run seed
npm run build
pm2 start ecosystem.config.cjs && pm2 save
curl -s localhost:3333/api/health

# 5. Nginx + HTTPS
sudo cp deploy/nginx-cinema.conf /etc/nginx/sites-available/cinema
sudo sed -i "s/SEU_DOMINIO/SEU-IP-COM-TRACOS.sslip.io/" /etc/nginx/sites-available/cinema
sudo ln -sf /etc/nginx/sites-available/cinema /etc/nginx/sites-enabled/cinema
sudo rm -f /etc/nginx/sites-enabled/default
sudo mkdir -p /var/www/cinema && sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d SEU-IP-COM-TRACOS.sslip.io --redirect -m SEU_EMAIL --agree-tos -n
```

Atualizações: `./deploy/deploy.sh`
