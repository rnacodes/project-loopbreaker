# DigitalOcean Security, Maintenance & Migration Plans

Based on the security documentation in temp-docs, this document provides two actionable plans:
1. **Part A:** Security & Maintenance Plan for DigitalOcean Droplet
2. **Part B:** Migration Plan from Render.com to Self-Hosted

---

# PART A: Security & Maintenance Plan

## Phase 1: Network Security (Priority: Critical)

### 1.1 Cloudflare Integration
- [ ] Sign up for Cloudflare (free tier is sufficient)
- [ ] Point DNS nameservers to Cloudflare
- [ ] Enable "Orange Cloud" (Proxy) for all DNS records
- [ ] Configure SSL/TLS mode to "Full (Strict)"

### 1.2 DigitalOcean Cloud Firewall
- [ ] Create a DO Cloud Firewall in the console
- [ ] **Inbound Rules:**
  - Port 80/443: Allow ONLY from [Cloudflare IP ranges](https://www.cloudflare.com/ips/)
  - Custom SSH port (e.g., 2222): Allow ONLY from your home IP
  - Block all other inbound traffic
- [ ] Attach firewall to your Droplet
- [ ] **Why:** DO Firewall drops traffic before it reaches your server (no bandwidth charges)

### 1.3 SSH Hardening
- [ ] Change SSH port from 22 to a custom port (e.g., 2222)
- [ ] Disable password authentication (use SSH keys only)
- [ ] Edit `/etc/ssh/sshd_config`:
  ```
  Port 2222
  PasswordAuthentication no
  PermitRootLogin prohibit-password
  ```
- [ ] Restart SSH: `sudo systemctl restart sshd`

### 1.4 Fail2Ban Installation
- [ ] Install: `sudo apt install fail2ban`
- [ ] Configure `/etc/fail2ban/jail.local`:
  ```ini
  [sshd]
  enabled = true
  port = 2222
  maxretry = 3
  bantime = 3600
  ```
- [ ] Start service: `sudo systemctl enable --now fail2ban`

---

## Phase 2: Cost Protection & Billing

### 2.1 Billing Alerts
- [ ] Go to **Account > Billing > Billing Alerts**
- [ ] Set alert at $10 (or $5 above normal bill)
- [ ] This provides early warning for bandwidth overages or DDoS attacks

### 2.2 Understand Your Costs
| Item | Expected Cost |
|------|---------------|
| $6 Droplet (1 vCPU/1GB) | $6.00/month |
| Backups (optional, +20%) | $1.20/month |
| Outbound bandwidth (up to 1TB) | $0.00 |
| Overage bandwidth | $0.01/GiB |

**Key Points:**
- Inbound traffic is always FREE (even during DDoS)
- "Power Off" still bills you - must "Destroy" to stop billing
- Multiple droplets share a bandwidth pool

---

## Phase 3: Server Maintenance

### 3.1 Automated Security Updates
- [ ] Install: `sudo apt install unattended-upgrades`
- [ ] Enable: `sudo dpkg-reconfigure unattended-upgrades`

### 3.2 Docker Maintenance
- [ ] Configure log rotation in `/etc/docker/daemon.json`:
  ```json
  {
    "log-driver": "json-file",
    "log-opts": {
      "max-size": "10m",
      "max-file": "3"
    }
  }
  ```
- [ ] Restart Docker: `sudo systemctl restart docker`
- [ ] Set up monthly cron job for cleanup:
  ```bash
  0 0 1 * * docker system prune -f
  ```

### 3.3 Log Rotation
- [ ] Verify logrotate is active: `cat /etc/logrotate.conf`
- [ ] Check Caddy logs are being rotated

---

## Phase 4: Storage Strategy

### 4.1 DigitalOcean Volumes (Active Storage)
- [ ] Attach a Volume for:
  - PostgreSQL data
  - Paperless-ngx documents
  - Audiobookshelf library
- [ ] Mount at `/mnt/data`
- [ ] **Benefit:** Can detach and move to larger Droplet later

### 4.2 DigitalOcean Spaces (Backups)
- [ ] Create a Spaces bucket for backups
- [ ] Install `rclone` or `kopia` for encrypted backup sync
- [ ] Schedule nightly backups to Spaces
- [ ] Retention: Keep 7 daily, 4 weekly, 12 monthly

### 4.3 Snapshot Automation
- [ ] Install `doctl` CLI tool
- [ ] Create pre-migration snapshots before major changes
- [ ] Automate weekly snapshots via API/doctl

---

## Phase 5: Monitoring & Observability

### 5.1 Uptime Monitoring
- [ ] Install **Uptime Kuma** (self-hosted)
- [ ] Configure monitors for:
  - Frontend (HTTP)
  - API backend (HTTP)
  - Typesense (TCP/HTTP)
  - N8N (HTTP)
  - PostgreSQL (TCP)
- [ ] Set up notifications (Discord/Email/Telegram)

### 5.2 Resource Monitoring
- [ ] Install **btop** for terminal monitoring: `sudo apt install btop`
- [ ] Install **Dozzle** for real-time Docker logs viewing
- [ ] Consider **Beszel** for a lightweight web dashboard

### 5.3 N8N Error Handling
- [ ] Create an "Error Workflow" in N8N
- [ ] On failure: Send notification to Discord/Telegram
- [ ] Use "Push Monitor" in Uptime Kuma for heartbeat checks

---

## Phase 6: VPC & Network Isolation

### 6.1 Virtual Private Cloud
- [ ] Create a VPC in DigitalOcean
- [ ] Place PostgreSQL and other databases in VPC
- [ ] Apps communicate internally (not over public internet)

### 6.2 Tailscale (Optional - Advanced Security)
- [ ] Install Tailscale for zero-config VPN
- [ ] Access admin UIs (pgAdmin, Portainer) only via Tailscale
- [ ] Close admin ports on public firewall

---

## Tools Reference

| Category | Recommended Tool | Purpose |
|----------|-----------------|---------|
| Dashboard | Homepage | Single portal for all services |
| Container Management | Portainer or Lazy Docker | Visual Docker management |
| Database Admin | Beekeeper Studio or pgcli | Modern Postgres management |
| Resource Monitor | btop | Terminal-based system stats |
| Log Viewer | Dozzle | Real-time Docker logs |
| Uptime | Uptime Kuma | Service availability monitoring |
| Terminal Multiplexer | tmux or byobu | Persistent SSH sessions |

---

# PART B: Migration Plan from Render.com to Self-Hosted

## Overview

**Current on Render.com (confirmed):**
- React + Vite Frontend
- ASP.NET Core API Backend
- PostgreSQL databases (Production + Demo)
- Any additional services

**Target: DigitalOcean Droplet with Coolify**

---

## Primary Approach: Coolify (User Selected)

Coolify is a self-hosted Render/Heroku alternative that provides a web UI for deployments.

### Step 1: Prepare DigitalOcean Droplet
- [ ] Ensure Droplet has at least 2GB RAM (Coolify + services need headroom)
- [ ] Attach a Volume for persistent data (`/mnt/data`)
- [ ] Configure DO Cloud Firewall (allow 80, 443, SSH port, and 3000 temporarily for setup)

### Step 2: Install Coolify
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```
- Access Coolify at `http://your-droplet-ip:3000`
- Set up admin account and secure password
- Configure Coolify to use your domain

### Step 3: Connect GitHub
- In Coolify dashboard: **Sources > Add GitHub App**
- Authorize Coolify to access your repositories
- Select the ProjectLoopbreaker repository

### Step 4: Deploy PostgreSQL Databases
- [ ] **Create Production Database:**
  - Resources > New > PostgreSQL
  - Name: `projectloopbreaker-prod`
  - Mount volume: `/mnt/data/postgres-prod`
  - Note the connection string
- [ ] **Create Demo Database:**
  - Resources > New > PostgreSQL
  - Name: `projectloopbreaker-demo`
  - Mount volume: `/mnt/data/postgres-demo`

### Step 5: Migrate Database Data
```bash
# Export from Render (run locally or on Droplet)
pg_dump -h <render-prod-host> -U <user> -d <prod-db> -F c -f prod_backup.dump
pg_dump -h <render-demo-host> -U <user> -d <demo-db> -F c -f demo_backup.dump

# Import to Coolify PostgreSQL (get connection details from Coolify dashboard)
pg_restore -h localhost -p <coolify-port> -U postgres -d <prod-db> prod_backup.dump
pg_restore -h localhost -p <coolify-port> -U postgres -d <demo-db> demo_backup.dump
```

### Step 6: Deploy ASP.NET Core API
- [ ] Resources > New > Application > GitHub
- [ ] Select ProjectLoopbreaker repo
- [ ] Build pack: **Nixpacks** (auto-detects .NET) or **Dockerfile** if you have one
- [ ] Set environment variables:
  ```
  ConnectionStrings__DefaultConnection=<coolify-postgres-connection>
  JWT_SECRET=<your-secret>
  FRONTEND_URL=https://yourdomain.com
  # Add all other API keys
  ```
- [ ] Configure domain: `api.yourdomain.com`
- [ ] Deploy

### Step 7: Deploy React Frontend
- [ ] Resources > New > Application > GitHub
- [ ] Select repo, set build path to `frontend/`
- [ ] Build pack: **Nixpacks** (auto-detects Vite)
- [ ] Set environment variables:
  ```
  VITE_API_URL=https://api.yourdomain.com/api
  ```
- [ ] Configure domain: `yourdomain.com`
- [ ] Deploy

### Step 8: Configure DNS (via Cloudflare)
- [ ] Point `yourdomain.com` A record to Droplet IP (Proxied)
- [ ] Point `api.yourdomain.com` A record to Droplet IP (Proxied)
- [ ] SSL mode: Full (Strict)
- Coolify/Caddy handles origin SSL automatically

### Step 9: Post-Migration Verification
- [ ] Test frontend loads correctly
- [ ] Test API endpoints respond
- [ ] Test authentication flow
- [ ] Verify database data integrity
- [ ] Test all external API integrations (ListenNotes, TMDB, YouTube, etc.)
- [ ] Run any existing tests

---

## Migration Option 2: GitHub Actions + SSH

For more control and learning, deploy directly via GitHub Actions.

### Step 1: Create Deployment Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to DigitalOcean

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Droplet
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.DROPLET_IP }}
          username: ${{ secrets.DROPLET_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/projectloopbreaker
            git pull origin main
            docker compose pull
            docker compose up -d --build
```

### Step 2: Set Up GitHub Secrets
- `DROPLET_IP`: Your Droplet's IP address
- `DROPLET_USER`: SSH username
- `SSH_PRIVATE_KEY`: Private key for authentication

### Step 3: Prepare Droplet
- Clone repository to `/opt/projectloopbreaker`
- Create `docker-compose.yml` for all services
- Set up environment variables in `.env`

---

## Migration Option 3: Manual Deployment (Learning-Focused)

### Workflow
1. SSH into Droplet
2. `cd /opt/projectloopbreaker`
3. `git pull origin main`
4. `docker compose up -d --build`

### Benefits
- Learn file permissions, SSH keys, Linux CLI
- Full understanding of deployment process

---

## Database Migration Steps

### Step 1: Export from Render
```bash
# Get connection string from Render dashboard
pg_dump -h <render-host> -U <user> -d <dbname> -F c -f production_backup.dump
pg_dump -h <render-host> -U <user> -d <demo-dbname> -F c -f demo_backup.dump
```

### Step 2: Set Up PostgreSQL on Droplet
- Option A: Use Coolify's built-in Postgres
- Option B: Run Postgres in Docker:
  ```yaml
  services:
    postgres:
      image: postgres:16
      volumes:
        - /mnt/data/postgres:/var/lib/postgresql/data
      environment:
        POSTGRES_PASSWORD: ${DB_PASSWORD}
  ```

### Step 3: Import Data
```bash
pg_restore -h localhost -U postgres -d production_db production_backup.dump
pg_restore -h localhost -U postgres -d demo_db demo_backup.dump
```

### Step 4: Update Connection Strings
- Update environment variables to point to local Postgres
- Test application connectivity

---

## Migration Order (Recommended for Coolify)

1. **Phase 1:** Prepare Droplet (RAM, Volume, Firewall)
2. **Phase 2:** Install Coolify on Droplet
3. **Phase 3:** Create PostgreSQL databases in Coolify
4. **Phase 4:** Export/Import database data from Render
5. **Phase 5:** Deploy API backend via Coolify
6. **Phase 6:** Deploy frontend via Coolify
7. **Phase 7:** Migrate N8N and Typesense to Coolify (if not already self-hosted)
8. **Phase 8:** Update DNS records in Cloudflare
9. **Phase 9:** Test all functionality thoroughly
10. **Phase 10:** Decommission Render services after 1 week of stable operation

---

## Comparison: Render vs Self-Hosted

| Feature | Render.com | **Self-Hosted (Coolify)** ✓ | Self-Hosted (Manual) |
|---------|------------|----------------------|---------------------|
| Cost | $$ per service | **Fixed $6-12/mo total** | Fixed $6-12/mo total |
| Complexity | Low | **Medium** | High |
| Control | Limited | **Full** | Absolute |
| Database | Managed (Paid) | **Self-hosted (Free)** | Self-hosted (Free) |
| Learning | Minimal | **Good** | Excellent |
| Maintenance | None | **Some (automated backups)** | Full |
| GitHub Integration | Yes | **Yes (native)** | Manual/Actions |
| SSL/HTTPS | Automatic | **Automatic (Caddy)** | Manual config |

### Why Coolify is Right for You
- **Familiar UI:** Similar to Render's dashboard experience
- **GitHub Integration:** Push-to-deploy workflow you're used to
- **Built-in Caddy:** Handles SSL automatically (works with Cloudflare)
- **Database Management:** Built-in PostgreSQL with backup scheduling
- **Learning Path:** Still on your Droplet - can SSH in and learn Linux
- **Cost Savings:** One flat monthly cost instead of per-service pricing

---

## Post-Migration Checklist

- [ ] All services running on Droplet
- [ ] SSL certificates active (via Cloudflare or Caddy)
- [ ] Uptime monitoring configured
- [ ] Backup strategy implemented
- [ ] DNS updated and propagated
- [ ] Render services cancelled
- [ ] Environment variables secured
- [ ] Firewall rules verified

---

## Infrastructure as Code (Future Enhancement)

Once comfortable, consider:

### Terraform/OpenTofu
- Define Droplet, Firewall, VPC, Spaces in code
- Version control your infrastructure
- Recreate entire setup with `terraform apply`

### Ansible
- Automate Docker, Caddy, Fail2Ban installation
- Repeatable server configuration
- Self-documenting setup

---

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `.github/workflows/deploy.yml` | GitHub Actions deployment (if using Option 2) |
| `docker-compose.yml` | Service definitions for Droplet |
| `.env.production` | Environment variables for production |
| `Caddyfile` | Reverse proxy configuration (if not using Coolify) |