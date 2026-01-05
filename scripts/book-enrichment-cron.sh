#!/bin/bash
# =============================================================================
# Book Description Enrichment Cron Job
# =============================================================================
# This script calls the book enrichment API endpoint to fetch descriptions
# from Open Library for books that have an ISBN but no description.
#
# SETUP INSTRUCTIONS:
# 1. Copy this script to your DigitalOcean VM
# 2. Make it executable: chmod +x book-enrichment-cron.sh
# 3. Edit the configuration variables below
# 4. Test manually: ./book-enrichment-cron.sh
# 5. Add to crontab: crontab -e
#
# CRON EXAMPLES:
#   Run every day at 3 AM:
#     0 3 * * * /path/to/book-enrichment-cron.sh >> /var/log/book-enrichment.log 2>&1
#
#   Run every 2 days at 3 AM:
#     0 3 */2 * * /path/to/book-enrichment-cron.sh >> /var/log/book-enrichment.log 2>&1
#
#   Run every Monday and Thursday at 2 AM:
#     0 2 * * 1,4 /path/to/book-enrichment-cron.sh >> /var/log/book-enrichment.log 2>&1
#
# =============================================================================

# -----------------------------------------------------------------------------
# CONFIGURATION - Edit these values
# -----------------------------------------------------------------------------

# Your API base URL (include /api)
API_URL="https://www.api.mymediaverseuniverse.com/api"

# Your JWT access token (get this from logging in)
# For long-running cron jobs, consider implementing a service account or
# using refresh tokens
API_TOKEN="YOUR_JWT_TOKEN_HERE"

# Enrichment parameters
BATCH_SIZE=50                    # Books per batch (1-200)
DELAY_MS=1000                    # Delay between API calls in ms
MAX_BOOKS=500                    # Maximum books to process per run
PAUSE_BETWEEN_BATCHES=30         # Seconds to pause between batches

# Logging
LOG_PREFIX="[BookEnrichment]"

# -----------------------------------------------------------------------------
# SCRIPT - Don't edit below unless you know what you're doing
# -----------------------------------------------------------------------------

echo ""
echo "=============================================="
echo "$LOG_PREFIX Starting book enrichment run"
echo "$LOG_PREFIX $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="

# Check if token is set
if [ "$API_TOKEN" = "YOUR_JWT_TOKEN_HERE" ]; then
    echo "$LOG_PREFIX ERROR: API_TOKEN not configured!"
    echo "$LOG_PREFIX Please edit this script and set your JWT token."
    exit 1
fi

# First, check the current status
echo "$LOG_PREFIX Checking enrichment status..."
STATUS_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X GET "${API_URL}/bookenrichment/status" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -H "Content-Type: application/json")

HTTP_CODE=$(echo "$STATUS_RESPONSE" | tail -n1)
STATUS_BODY=$(echo "$STATUS_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
    echo "$LOG_PREFIX ERROR: Failed to get status (HTTP $HTTP_CODE)"
    echo "$LOG_PREFIX Response: $STATUS_BODY"
    exit 1
fi

BOOKS_NEEDING=$(echo "$STATUS_BODY" | grep -o '"booksNeedingEnrichment":[0-9]*' | cut -d':' -f2)
echo "$LOG_PREFIX Books needing enrichment: $BOOKS_NEEDING"

if [ "$BOOKS_NEEDING" = "0" ]; then
    echo "$LOG_PREFIX No books need enrichment. Exiting."
    exit 0
fi

# Run the enrichment
echo "$LOG_PREFIX Starting enrichment with:"
echo "$LOG_PREFIX   - Batch size: $BATCH_SIZE"
echo "$LOG_PREFIX   - Max books: $MAX_BOOKS"
echo "$LOG_PREFIX   - Delay: ${DELAY_MS}ms"
echo "$LOG_PREFIX   - Pause between batches: ${PAUSE_BETWEEN_BATCHES}s"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "${API_URL}/bookenrichment/run-all" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
        \"batchSize\": ${BATCH_SIZE},
        \"delayBetweenCallsMs\": ${DELAY_MS},
        \"maxBooks\": ${MAX_BOOKS},
        \"pauseBetweenBatchesSeconds\": ${PAUSE_BETWEEN_BATCHES}
    }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "$LOG_PREFIX HTTP Response Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "$LOG_PREFIX Enrichment completed successfully!"
    echo "$LOG_PREFIX Response: $BODY"

    # Extract and display key metrics
    PROCESSED=$(echo "$BODY" | grep -o '"totalProcessed":[0-9]*' | cut -d':' -f2)
    ENRICHED=$(echo "$BODY" | grep -o '"totalEnriched":[0-9]*' | cut -d':' -f2)
    FAILED=$(echo "$BODY" | grep -o '"totalFailed":[0-9]*' | cut -d':' -f2)
    REMAINING=$(echo "$BODY" | grep -o '"remainingBooks":[0-9]*' | cut -d':' -f2)

    echo ""
    echo "$LOG_PREFIX Summary:"
    echo "$LOG_PREFIX   - Processed: $PROCESSED"
    echo "$LOG_PREFIX   - Enriched: $ENRICHED"
    echo "$LOG_PREFIX   - Failed: $FAILED"
    echo "$LOG_PREFIX   - Remaining: $REMAINING"
else
    echo "$LOG_PREFIX ERROR: Enrichment failed!"
    echo "$LOG_PREFIX Response: $BODY"
    exit 1
fi

echo ""
echo "$LOG_PREFIX Completed at $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="
