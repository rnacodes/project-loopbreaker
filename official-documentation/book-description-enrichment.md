# Book Description Enrichment

This document describes how to use the book description enrichment feature, which automatically fetches book descriptions from Open Library for books imported via Goodreads CSV or other methods.

## Overview

Book descriptions are not included in Goodreads exports. This feature provides:
- An **admin page** at `/background-jobs` for on-demand enrichment with visual controls
- **API endpoints** for programmatic triggering
- A **shell script** for scheduled execution via cron on your VM
- **Configurable settings** for batch size, rate limiting, and scheduling

The enrichment uses Open Library's API with a two-step lookup:
1. Get edition by ISBN to find the Work ID
2. Get the Work to retrieve the description

## Admin Page

Navigate to `/background-jobs` in your frontend to access the Background Jobs admin page. This provides:

- **Current Status**: Shows how many books need description enrichment
- **Configuration Controls**: Adjust batch size, API delay, max books, and pause duration via sliders
- **Run Single Batch**: Process a quick batch and get immediate results
- **Run All (Bulk)**: Process multiple batches for initial population after large imports
- **Results Display**: See enriched counts, failures, and any errors

## API Endpoints (On-Demand Execution)

All endpoints require authentication (`Authorization: Bearer <token>`).

### 1. Check Status

```http
GET /api/bookenrichment/status
```

Returns how many books need descriptions:

```json
{
  "booksNeedingEnrichment": 1523
}
```

### 2. Run Single Batch (Quick)

```http
POST /api/bookenrichment/run
Content-Type: application/json

{
  "batchSize": 50,
  "delayBetweenCallsMs": 1000
}
```

Processes one batch and returns immediately. Good for quick enrichment runs.

**Parameters:**
| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `batchSize` | 50 | 1-500 | Number of books to process |
| `delayBetweenCallsMs` | 1000 | 100-10000 | Delay between API calls (ms) |

### 3. Run All (For Initial Population)

```http
POST /api/bookenrichment/run-all
Content-Type: application/json

{
  "batchSize": 50,
  "delayBetweenCallsMs": 1000,
  "maxBooks": 1000,
  "pauseBetweenBatchesSeconds": 30
}
```

Processes multiple batches until `maxBooks` is reached. Use this for initial Goodreads import population.

**Parameters:**
| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `batchSize` | 50 | 1-200 | Books per batch |
| `delayBetweenCallsMs` | 1000 | - | Delay between API calls (ms) |
| `maxBooks` | 1000 | 1-10000 | Maximum total books to process |
| `pauseBetweenBatchesSeconds` | 30 | - | Pause between batches (seconds) |

**Response:**
```json
{
  "totalProcessed": 500,
  "totalEnriched": 423,
  "totalFailed": 77,
  "batchesRun": 10,
  "remainingBooks": 1023,
  "errors": ["Failed to enrich 'Some Book': No description found"]
}
```

## Scheduling Options

### Option 1: Built-in Hosted Service (Default)

The application includes a background service that runs automatically on a schedule.

Add to `appsettings.json`:

```json
{
  "BookDescriptionEnrichment": {
    "Enabled": true,
    "IntervalHours": 48,
    "BatchSize": 50,
    "DelayBetweenCallsMs": 1000,
    "PauseBetweenBatchesSeconds": 30,
    "InitialDelayMinutes": 5
  }
}
```

**Configuration Options:**
| Setting | Default | Description |
|---------|---------|-------------|
| `Enabled` | true | Enable/disable the background service |
| `IntervalHours` | 48 | Hours between scheduled runs (2 days) |
| `BatchSize` | 50 | Books to process per batch |
| `DelayBetweenCallsMs` | 1000 | 1 second between API calls |
| `PauseBetweenBatchesSeconds` | 30 | Pause between batches |
| `InitialDelayMinutes` | 5 | Delay before first run after startup |

The service starts automatically with the API and runs every `IntervalHours`.

### Option 2: Disable Built-in, Use External Scheduler

Set `"Enabled": false` in config, then use an external scheduler to call the API.

**Windows Task Scheduler (PowerShell):**

```powershell
# Create a scheduled task that calls the API
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument @"
-Command "Invoke-WebRequest -Uri 'https://your-api.com/api/bookenrichment/run-all' -Method POST -Headers @{Authorization='Bearer YOUR_TOKEN'} -ContentType 'application/json' -Body '{\"maxBooks\":500}'"
"@
$trigger = New-ScheduledTaskTrigger -Daily -At 3:00AM
Register-ScheduledTask -TaskName "BookEnrichment" -Action $action -Trigger $trigger
```

**Linux Cron (Using the provided script):**

A ready-to-use shell script is provided at `scripts/book-enrichment-cron.sh`. To set it up:

```bash
# 1. Copy the script to your DigitalOcean VM
scp scripts/book-enrichment-cron.sh user@your-vm:/home/user/

# 2. SSH into your VM and make it executable
chmod +x /home/user/book-enrichment-cron.sh

# 3. Edit the script to add your API token and URL
nano /home/user/book-enrichment-cron.sh

# 4. Test it manually
/home/user/book-enrichment-cron.sh

# 5. Add to crontab (runs at 3 AM every 2 days)
crontab -e
# Add this line:
0 3 */2 * * /home/user/book-enrichment-cron.sh >> /var/log/book-enrichment.log 2>&1
```

**Manual curl command (alternative):**

```bash
curl -X POST https://your-api.com/api/bookenrichment/run-all \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"maxBooks":500}'
```

## Recommended Workflow for Initial Population

After importing a large Goodreads library with thousands of books:

### Step 1: Check how many books need enrichment

```bash
curl -X GET https://localhost:5033/api/bookenrichment/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 2: Run initial population in chunks

```bash
curl -X POST https://localhost:5033/api/bookenrichment/run-all \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchSize": 50,
    "maxBooks": 500,
    "delayBetweenCallsMs": 1000,
    "pauseBetweenBatchesSeconds": 30
  }'
```

Run this a few times over several days to avoid hammering Open Library's API.

### Step 3: Let the scheduled service handle the rest

The background service will continue processing remaining books every 48 hours (or your configured interval).

## Rate Limit Guidelines

Open Library doesn't publish strict rate limits, but they recommend:
- Include a User-Agent header (already configured in the application)
- Be respectful - 1 request per second is safe
- For bulk operations, spread over multiple days

The default settings are conservative:
- 1 second delay between API calls
- 30 second pause between batches
- 50 books per batch

## Technical Details

### Files Created/Modified

**Backend:**
- `ProjectLoopbreaker.Shared/Interfaces/IBookDescriptionEnrichmentService.cs` - Service interface
- `ProjectLoopbreaker.Shared/DTOs/OpenLibrary/OpenLibraryEditionDto.cs` - Edition DTO with Work reference
- `ProjectLoopbreaker.Infrastructure/Services/BookDescriptionEnrichmentService.cs` - Main enrichment logic
- `ProjectLoopbreaker.Infrastructure/Services/BookDescriptionEnrichmentHostedService.cs` - Background scheduler
- `ProjectLoopbreaker.Web.API/Controllers/BookEnrichmentController.cs` - API endpoints
- `ProjectLoopbreaker.Infrastructure/Clients/OpenLibraryApiClient.cs` - Added description lookup methods

**Frontend:**
- `GoodreadsUploadPage.jsx` - Added info about background enrichment
- `ImportMedia/BookImportSection.jsx` - Added info alert about enrichment
- `BackgroundJobsPage.jsx` - Admin page for managing background jobs
- `api/backgroundJobsService.js` - API service functions for enrichment endpoints

**Scripts:**
- `scripts/book-enrichment-cron.sh` - Shell script for scheduled execution via cron

### How It Works

1. The service queries books where `ISBN IS NOT NULL` and `Description IS NULL`
2. For each book, it calls Open Library's `/isbn/{isbn}.json` endpoint to get the edition
3. From the edition, it extracts the Work ID (e.g., `/works/OL12345W`)
4. It then calls `/works/{workId}.json` to get the Work, which contains the description
5. The description is saved to the book's `Description` field
6. Books without descriptions in Open Library are left with `Description = null` for potential future enrichment

### Limitations

- Only works for books with ISBNs
- Open Library is crowdsourced - not all books have descriptions
- Rate limiting means large libraries take time to fully enrich
- Some books may have descriptions in object format (`{"type": "/text/plain", "value": "..."}`) which is handled automatically
