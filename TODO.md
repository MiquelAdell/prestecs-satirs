# Deployment — RackNerd VPS

## 1. Purchase VPS
- [ ] Buy RackNerd VPS (1GB RAM, 1 vCPU, ~$10-11/year promo)
- [ ] Select Amsterdam or Strasbourg datacenter (closest to Barcelona)
- [ ] Note down the server IP, root password, and SSH port

## 2. Server initial setup
- [ ] SSH into the server as root
- [ ] Create a non-root user with sudo privileges
- [ ] Set up SSH key authentication and disable password login
- [ ] Configure firewall (UFW): allow SSH, HTTP (80), HTTPS (443)
- [ ] Update system packages

## 3. Install dependencies
- [ ] Install Docker and Docker Compose
- [ ] Install Caddy (reverse proxy with automatic HTTPS) or nginx + certbot

## 4. Prepare the project for deployment
- [ ] Create `Dockerfile` for the app (Python + Node build)
- [ ] Create `docker-compose.yml` (app + Caddy reverse proxy)
- [ ] Create `Caddyfile` for automatic HTTPS and reverse proxy config
- [ ] Decide on a domain or use the server IP for now

## 5. Deploy
- [ ] Clone the repo on the server (or set up deploy script)
- [ ] Configure environment variables (`PRESTECS_JWT_SECRET`, `PRESTECS_BASE_URL`, `PRESTECS_DB_PATH`)
- [ ] Run `docker compose up -d`
- [ ] Run initial data import (`game-lending migrate` + `import-games`)
- [ ] Verify the app is accessible

## 6. Post-deploy
- [ ] Set up automatic Docker container restart on server reboot
- [ ] Set up a simple backup strategy for the SQLite database (cron + copy to local)
- [ ] Share the URL with club members for soft launch
