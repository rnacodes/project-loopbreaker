# Script Execution Service

A system for running and monitoring Python normalization scripts through a web UI, with a FastAPI backend service integrated into the ProjectLoopbreaker application.

## Architecture Overview

```
React Frontend          ASP.NET API              Python FastAPI
(/script-execution) --> (ScriptExecutionController) --> (port 8001)
                              |                              |
                              v                              v
                        Proxy requests              Runs normalize scripts
                                                    Tracks job progress
```

## Components

### 1. Python FastAPI Service (`scripts/api/`)

A standalone Python service that executes normalization scripts with job tracking.

**Files:**
- `main.py` - FastAPI application entry point
- `config.py` - Environment variable configuration
- `models.py` - Pydantic models for requests/responses
- `routers/health.py` - Health check endpoint
- `routers/jobs.py` - Job execution endpoints
- `services/job_manager.py` - In-memory job state management
- `services/script_runner.py` - Wraps existing normalize scripts
- `middleware/auth.py` - API key authentication

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health check |
| GET | `/jobs` | List all jobs |
| GET | `/jobs/{job_id}` | Get job status |
| POST | `/jobs` | Start a new job |
| POST | `/jobs/{job_id}/cancel` | Cancel a running job |

### 2. ASP.NET Controller

`Controllers/ScriptExecutionController.cs` - Proxies requests from the frontend to the FastAPI service.

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/scriptexecution/health` | Check FastAPI service health |
| GET | `/api/scriptexecution/jobs` | List all jobs |
| GET | `/api/scriptexecution/jobs/{jobId}` | Get job status |
| POST | `/api/scriptexecution/normalize-notes` | Run database normalization |
| POST | `/api/scriptexecution/normalize-vault` | Run vault file normalization |
| POST | `/api/scriptexecution/jobs/{jobId}/cancel` | Cancel a job |

### 3. React Frontend

`components/ScriptExecutionPage.jsx` - Admin UI at `/script-execution`

**Features:**
- Service health status indicator
- Normalize Notes (database) with dry-run/verbose options
- Normalize Vault (files) with path, dry-run, verbose, backup, AI options
- Real-time job progress with polling
- Job history table with expandable logs

## Setup Instructions

### Step 1: Install Python Dependencies

```bash
cd scripts
pip install -r requirements.txt
```

The requirements include:
- `fastapi>=0.109.0`
- `uvicorn[standard]>=0.27.0`
- `pydantic>=2.5.0`
- `psycopg2-binary>=2.9.0` (for database access)
- `pyyaml>=6.0` (for vault normalization)
- `requests>=2.28.0` (for AI descriptions)

### Step 2: Configure Environment Variables

**For the Python FastAPI service:**

```bash
# Required for normalize_notes script
export DATABASE_URL="postgresql://user:password@host:port/database"

# Optional: API key authentication (shared with .NET)
export SCRIPT_RUNNER_API_KEY="your-secure-api-key"

# Optional: For AI-generated descriptions in vault normalization
export GRADIENT_API_KEY="your-gradient-api-key"
export GRADIENT_BASE_URL="https://api.gradient.ai/v1"
export AI_MODEL="llama-3.1-8b-instruct"

# Optional: CORS origins (comma-separated)
export ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5033"
```

**For the ASP.NET API (optional):**

```bash
# If FastAPI runs on a different host/port
export SCRIPT_RUNNER_URL="http://localhost:8001"

# Must match the Python service's API key
export SCRIPT_RUNNER_API_KEY="your-secure-api-key"
```

### Step 3: Start the FastAPI Service

```bash
cd scripts
uvicorn api.main:app --host 0.0.0.0 --port 8001
```

For development with auto-reload:
```bash
uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload
```

### Step 4: Verify the Service

Check health endpoint:
```bash
curl http://localhost:8001/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "script_runner",
  "version": "1.0.0",
  "database_connected": true
}
```

### Step 5: Access the UI

1. Start the .NET API: `dotnet run` (from Web.API directory)
2. Start the frontend: `npm run dev` (from frontend directory)
3. Navigate to: `http://localhost:5173/script-execution`

## Available Scripts

### Normalize Notes (Database)

Normalizes notes stored in PostgreSQL:
- Fixes empty/null content fields
- Generates descriptions from content (first 150 chars)
- Normalizes tags to lowercase
- Generates source URLs for notes missing them

**Options:**
- **Dry Run**: Preview changes without modifying database
- **Verbose**: Log each note being processed

### Normalize Vault (Files)

Normalizes markdown files in an Obsidian vault:
- Converts inline `#tags` to frontmatter tags
- Standardizes tag casing to lowercase
- Adds title from filename if missing
- Generates descriptions from content or via AI

**Options:**
- **Vault Path**: Full path to Obsidian vault directory (required)
- **Dry Run**: Preview changes without modifying files
- **Verbose**: Log each file being processed
- **Create Backup**: Copy vault before making changes
- **Use AI**: Generate descriptions using Gradient AI API

## Job States

| Status | Description |
|--------|-------------|
| `pending` | Job created, waiting to start |
| `running` | Script is executing |
| `completed` | Script finished successfully |
| `failed` | Script encountered an error |
| `cancelled` | Job was cancelled by user |

## Security

- **API Key Authentication**: Set `SCRIPT_RUNNER_API_KEY` on both services
- **JWT Authentication**: The .NET controller requires JWT login (`[Authorize]` attribute)
- **Concurrent Job Prevention**: Only one job of each type can run at a time

## Troubleshooting

### "Script runner service unavailable"

1. Ensure the FastAPI service is running on port 8001
2. Check if `SCRIPT_RUNNER_URL` is set correctly in .NET
3. Verify firewall/network allows connection

### "Database not connected"

1. Verify `DATABASE_URL` environment variable is set
2. Check PostgreSQL is running and accessible
3. Verify connection string format

### Job stuck in "running" state

1. Check the FastAPI service logs for errors
2. The job may have been interrupted - restart the service
3. Jobs are stored in-memory; service restart clears stuck jobs

## Production Deployment

### Docker

Create `scripts/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

Build and run:
```bash
docker build -t script-runner ./scripts
docker run -d -p 8001:8001 \
  -e DATABASE_URL="..." \
  -e SCRIPT_RUNNER_API_KEY="..." \
  script-runner
```

### Scheduling (Optional)

For automated script execution, you can:

1. **Use cron** to call the API on a schedule
2. **Add a .NET HostedService** that triggers the FastAPI endpoints periodically
3. **Use APScheduler** within the FastAPI service itself

Example cron job (runs normalize_notes daily at 3 AM):
```bash
0 3 * * * curl -X POST http://localhost:8001/jobs \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{"script_type": "normalize_notes", "dry_run": false}'
```

## File Locations

| Component | Path |
|-----------|------|
| FastAPI Service | `scripts/api/` |
| Python Dependencies | `scripts/requirements.txt` |
| ASP.NET Controller | `src/.../Controllers/ScriptExecutionController.cs` |
| React Service | `frontend/src/api/scriptExecutionService.js` |
| React Component | `frontend/src/components/ScriptExecutionPage.jsx` |
| Original Scripts | `scripts/normalize_notes.py`, `scripts/normalize_obsidian_vault.py` |
