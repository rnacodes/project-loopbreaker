# N8N Setup Guide for ProjectLoopbreaker

This guide walks through setting up N8N on your DigitalOcean Droplet to manage background job scheduling with a visual UI.

## Prerequisites

- DigitalOcean Droplet with at least 1GB RAM
- Docker and Docker Compose installed
- Domain name (optional but recommended for HTTPS)
- nginx installed (for reverse proxy)

---

## Step 1: Prepare the Droplet

SSH into your Droplet:

```bash
ssh root@your-droplet-ip
```

### 1.1 Verify Docker Installation

```bash
docker --version
docker-compose --version
```

If not installed:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 1.2 Create N8N Directory

```bash
mkdir -p /opt/n8n
cd /opt/n8n
```

---

## Step 2: Configure Docker Compose

Create the Docker Compose file:

```bash
nano /opt/n8n/docker-compose.yml
```

Paste the following configuration:

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      # Basic authentication for N8N UI
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}

      # Domain configuration (update with your domain)
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://${N8N_HOST}/

      # Timezone
      - GENERIC_TIMEZONE=America/New_York
      - TZ=America/New_York

      # Execution settings
      - EXECUTIONS_DATA_PRUNE=true
      - EXECUTIONS_DATA_MAX_AGE=168  # 7 days in hours

      # Security
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - n8n_network

volumes:
  n8n_data:

networks:
  n8n_network:
    driver: bridge
```

### 2.1 Create Environment File

```bash
nano /opt/n8n/.env
```

Add your configuration:

```bash
# N8N Configuration
N8N_HOST=n8n.yourdomain.com
N8N_PASSWORD=your-secure-password-here

# Generate a random encryption key (32+ characters)
N8N_ENCRYPTION_KEY=your-random-32-character-encryption-key
```

Generate an encryption key:

```bash
openssl rand -hex 32
```

---

## Step 3: Configure Nginx Reverse Proxy

### 3.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/n8n
```

Paste the following (update `n8n.yourdomain.com`):

```nginx
server {
    listen 80;
    server_name n8n.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name n8n.yourdomain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/n8n.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8n.yourdomain.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Websocket support
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
```

### 3.2 Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3.3 Setup SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d n8n.yourdomain.com
```

---

## Step 4: Start N8N

```bash
cd /opt/n8n
docker-compose up -d
```

Verify it's running:

```bash
docker-compose ps
docker-compose logs -f
```

Access N8N at: `https://n8n.yourdomain.com`

---

## Step 5: Create API Credentials in N8N

### 5.1 Add ProjectLoopbreaker API Credentials

1. Open N8N UI in browser
2. Go to **Settings** (gear icon) > **Credentials**
3. Click **Add Credential** > **HTTP Request**
4. Configure:
   - **Name**: `ProjectLoopbreaker API`
   - **Authentication**: `Header Auth`
   - **Name**: `Authorization`
   - **Value**: `Bearer <your-jwt-token>`

### 5.2 Getting Your JWT Token

You'll need to authenticate to get a JWT token. Create a simple workflow to do this:

1. **Create new workflow** named "Get Auth Token"
2. Add **Schedule Trigger** (every 12 hours to refresh token)
3. Add **HTTP Request** node:
   - Method: `POST`
   - URL: `https://www.api.mymediaverseuniverse.com/api/auth/login`
   - Body Type: `JSON`
   - Body:
     ```json
     {
       "username": "your-username",
       "password": "your-password"
     }
     ```
4. The response contains your JWT token

**Note**: For production, consider storing credentials securely and implementing token refresh logic.

---

## Step 6: Create Background Job Workflows

### 6.1 Obsidian Note Sync Workflow

Create a workflow for syncing notes:

```
Workflow: "Note Sync"
├── Schedule Trigger: Every 6 hours (0 */6 * * *)
├── HTTP Request: POST /api/note/sync
│   └── Headers: Authorization: Bearer <token>
├── IF Node: Check status code == 200
│   ├── True: Set "success" variable
│   └── False: Continue to error handling
└── (Optional) Email/Slack: Notify on failure
```

**N8N Node Configuration:**

**Schedule Trigger:**
- Trigger Times > Add Cron
- Cron Expression: `0 */6 * * *`

**HTTP Request:**
- Method: `POST`
- URL: `https://www.api.mymediaverseuniverse.com/api/note/sync`
- Authentication: Use `ProjectLoopbreaker API` credential
- Options > Response > Include Response Headers and Status

---

### 6.2 AI Description Generation Workflow

```
Workflow: "Generate Note Descriptions"
├── Schedule Trigger: Every 12 hours (0 */12 * * *)
├── HTTP Request: GET /api/ai/notes/pending-descriptions
│   └── Check count > 0
├── IF Node: pendingCount > 0
│   ├── True: HTTP Request POST /api/ai/notes/generate-descriptions-batch
│   └── False: Stop (nothing to process)
└── (Optional) Notification on completion
```

**Parameters:**
- URL: `https://www.api.mymediaverseuniverse.com/api/ai/notes/generate-descriptions-batch?batchSize=20`

---

### 6.3 Embedding Generation Workflow

```
Workflow: "Generate Embeddings"
├── Schedule Trigger: Daily at 3 AM (0 3 * * *)
├── HTTP Request: GET /api/ai/media/pending-embeddings
├── IF Node: count > 0
│   ├── True: HTTP Request POST /api/ai/media/generate-embeddings-batch
│   └── False: Skip
├── HTTP Request: GET /api/ai/notes/pending-embeddings
├── IF Node: count > 0
│   ├── True: HTTP Request POST /api/ai/notes/generate-embeddings-batch
│   └── False: Skip
└── Complete
```

---

### 6.4 Book Description Enrichment Workflow

```
Workflow: "Enrich Book Descriptions"
├── Schedule Trigger: Every 2 days (0 4 */2 * *)
├── HTTP Request: GET /api/bookenrichment/status
├── IF Node: pendingCount > 0
│   ├── True: HTTP Request POST /api/bookenrichment/run
│   └── False: Skip
└── Complete
```

---

### 6.5 Movie/TV Enrichment Workflow

```
Workflow: "Enrich Movies & TV Shows"
├── Schedule Trigger: Daily at 4 AM (0 4 * * *)
├── HTTP Request: GET /api/movietvenrichment/status
├── IF Node: (moviesCount + tvShowsCount) > 0
│   ├── True: HTTP Request POST /api/movietvenrichment/run-all
│   └── False: Skip
└── Complete
```

---

### 6.6 Podcast Enrichment Workflow

```
Workflow: "Enrich Podcasts"
├── Schedule Trigger: Every 3 days (0 5 */3 * *)
├── HTTP Request: GET /api/podcastenrichment/status
├── IF Node: pendingCount > 0
│   ├── True: HTTP Request POST /api/podcastenrichment/run
│   └── False: Skip
└── Complete
```

**Important**: ListenNotes has strict rate limits. Keep batch sizes small (25) and schedule less frequently.

---

## Step 7: Complete Pipeline Workflow (Optional)

Create a master workflow that chains everything:

```
Workflow: "Full Daily Processing"
├── Schedule Trigger: Daily at 2 AM
├── Execute Workflow: "Note Sync"
├── Wait: 10 minutes (let sync complete)
├── Execute Workflow: "Generate Note Descriptions"
├── Wait: 5 minutes
├── Execute Workflow: "Generate Embeddings"
├── Execute Workflow: "Enrich Book Descriptions" (if day % 2 == 0)
├── Execute Workflow: "Enrich Movies & TV Shows"
├── Execute Workflow: "Enrich Podcasts" (if day % 3 == 0)
└── Notification: Send summary email
```

---

## Step 8: Add Error Notifications

### 8.1 Email Notification Setup

1. Go to **Credentials** > **Add** > **SMTP**
2. Configure your email provider (Gmail, SendGrid, etc.)
3. Add **Email Send** node after error conditions

### 8.2 Webhook Notification (Discord/Slack)

Add **HTTP Request** node pointing to your webhook URL with error details.

---

## Maintenance

### View Logs

```bash
cd /opt/n8n
docker-compose logs -f
```

### Update N8N

```bash
cd /opt/n8n
docker-compose pull
docker-compose up -d
```

### Backup Data

```bash
# Backup N8N data volume
docker run --rm -v n8n_data:/data -v $(pwd):/backup alpine tar cvf /backup/n8n-backup.tar /data
```

### Resource Monitoring

```bash
docker stats n8n
```

---

## API Endpoint Reference

| Service | Status Endpoint | Trigger Endpoint | Schedule |
|---------|----------------|------------------|----------|
| Note Sync | `GET /api/note/sync/status` | `POST /api/note/sync` | Every 6 hours |
| Note Descriptions | `GET /api/ai/notes/pending-descriptions` | `POST /api/ai/notes/generate-descriptions-batch` | Every 12 hours |
| Embeddings (Media) | `GET /api/ai/media/pending-embeddings` | `POST /api/ai/media/generate-embeddings-batch` | Daily |
| Embeddings (Notes) | `GET /api/ai/notes/pending-embeddings` | `POST /api/ai/notes/generate-embeddings-batch` | Daily |
| Book Enrichment | `GET /api/bookenrichment/status` | `POST /api/bookenrichment/run` | Every 2 days |
| Movie/TV Enrichment | `GET /api/movietvenrichment/status` | `POST /api/movietvenrichment/run-all` | Daily |
| Podcast Enrichment | `GET /api/podcastenrichment/status` | `POST /api/podcastenrichment/run` | Every 3 days |

---

## Troubleshooting

### N8N Won't Start

```bash
# Check logs
docker-compose logs n8n

# Common issues:
# - Port 5678 already in use
# - Missing environment variables
# - Volume permission issues
```

### Can't Connect to API

1. Verify API is accessible from Droplet: `curl -I https://www.api.mymediaverseuniverse.com/api/health`
2. Check JWT token is valid
3. Verify CORS settings allow requests from Droplet

### Workflows Not Triggering

1. Ensure workflow is **Active** (toggle in top-right)
2. Check execution history for errors
3. Verify schedule trigger is configured correctly

---

## Security Checklist

- [ ] N8N basic auth enabled with strong password
- [ ] HTTPS configured with valid SSL certificate
- [ ] API credentials stored securely in N8N credentials manager
- [ ] Firewall allows only necessary ports (443 for HTTPS)
- [ ] Regular backups of N8N data volume
- [ ] JWT tokens rotated periodically
