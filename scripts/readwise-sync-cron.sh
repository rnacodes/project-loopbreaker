#!/bin/bash
# =============================================================================
# Readwise Sync Cron Job
# =============================================================================
# This script syncs Readwise highlights and Reader documents, then auto-links
# highlights to books in the database using Title+Author matching.
#
# WHAT IT DOES:
# 1. Validates Readwise API connection
# 2. Syncs Reader documents -> Creates/updates Articles
# 3. Syncs Readwise highlights -> Creates/updates Highlights
# 4. Auto-links highlights to Books by Title+Author match
#
# SETUP INSTRUCTIONS:
# 1. Copy this script to your DigitalOcean VM:
#    scp readwise-sync-cron.sh user@droplet:/opt/scripts/
# 2. Make it executable: chmod +x /opt/scripts/readwise-sync-cron.sh
# 3. Edit the API_TOKEN variable below with your JWT token
# 4. Test manually: ./readwise-sync-cron.sh
# 5. Add to crontab: crontab -e
#
# CRON EXAMPLES:
#   Run every day at 3 AM:
#     0 3 * * * /opt/scripts/readwise-sync-cron.sh >> /var/log/readwise-sync.log 2>&1
#
#   Run every 12 hours (3 AM and 3 PM):
#     0 3,15 * * * /opt/scripts/readwise-sync-cron.sh >> /var/log/readwise-sync.log 2>&1
#
#   Run every 6 hours:
#     0 */6 * * * /opt/scripts/readwise-sync-cron.sh >> /var/log/readwise-sync.log 2>&1
#
# =============================================================================

# -----------------------------------------------------------------------------
# CONFIGURATION - Edit these values
# -----------------------------------------------------------------------------

# Your API base URL (include /api)
API_URL="https://www.api.mymediaverseuniverse.com/api"

# Your JWT access token (get this from logging in)
# Note: JWT tokens expire. You'll need to refresh this periodically.
API_TOKEN="YOUR_JWT_TOKEN_HERE"

# Sync mode: true = last 7 days only (faster), false = full sync (slower)
INCREMENTAL="true"

# Logging
LOG_PREFIX="[ReadwiseSync]"

# -----------------------------------------------------------------------------
# SCRIPT - Don't edit below unless you know what you're doing
# -----------------------------------------------------------------------------

echo ""
echo "=============================================="
echo "$LOG_PREFIX Starting Readwise sync"
echo "$LOG_PREFIX $(date '+%Y-%m-%d %H:%M:%S')"
echo "$LOG_PREFIX Mode: $([ "$INCREMENTAL" = "true" ] && echo "Incremental (last 7 days)" || echo "Full sync")"
echo "=============================================="

# Check if token is set
if [ "$API_TOKEN" = "YOUR_JWT_TOKEN_HERE" ]; then
    echo "$LOG_PREFIX ERROR: API_TOKEN not configured!"
    echo "$LOG_PREFIX Please edit this script and set your JWT token."
    exit 1
fi

# Step 1: Validate Readwise connection
echo ""
echo "$LOG_PREFIX Step 1: Validating Readwise connection..."
VALIDATE_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X GET "${API_URL}/readwise/validate" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -H "Content-Type: application/json")

HTTP_CODE=$(echo "$VALIDATE_RESPONSE" | tail -n1)
VALIDATE_BODY=$(echo "$VALIDATE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
    echo "$LOG_PREFIX ERROR: Failed to validate connection (HTTP $HTTP_CODE)"
    echo "$LOG_PREFIX Response: $VALIDATE_BODY"
    exit 1
fi

# Check if connected
CONNECTED=$(echo "$VALIDATE_BODY" | grep -o '"connected":true' | wc -l)
if [ "$CONNECTED" -eq 0 ]; then
    echo "$LOG_PREFIX ERROR: Readwise API not connected"
    echo "$LOG_PREFIX Response: $VALIDATE_BODY"
    exit 1
fi

echo "$LOG_PREFIX Readwise connection validated successfully"

# Step 2: Run the sync
echo ""
echo "$LOG_PREFIX Step 2: Running sync..."
SYNC_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "${API_URL}/readwise/sync?incremental=${INCREMENTAL}" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -H "Content-Type: application/json")

HTTP_CODE=$(echo "$SYNC_RESPONSE" | tail -n1)
SYNC_BODY=$(echo "$SYNC_RESPONSE" | sed '$d')

echo "$LOG_PREFIX HTTP Response Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    # Check if sync was successful
    SUCCESS=$(echo "$SYNC_BODY" | grep -o '"success":true' | wc -l)

    if [ "$SUCCESS" -gt 0 ]; then
        echo "$LOG_PREFIX Sync completed successfully!"

        # Extract metrics using grep and cut
        ARTICLES_CREATED=$(echo "$SYNC_BODY" | grep -o '"articlesCreated":[0-9]*' | cut -d':' -f2)
        ARTICLES_UPDATED=$(echo "$SYNC_BODY" | grep -o '"articlesUpdated":[0-9]*' | cut -d':' -f2)
        HIGHLIGHTS_CREATED=$(echo "$SYNC_BODY" | grep -o '"highlightsCreated":[0-9]*' | cut -d':' -f2)
        HIGHLIGHTS_UPDATED=$(echo "$SYNC_BODY" | grep -o '"highlightsUpdated":[0-9]*' | cut -d':' -f2)
        HIGHLIGHTS_LINKED=$(echo "$SYNC_BODY" | grep -o '"highlightsLinked":[0-9]*' | cut -d':' -f2)

        echo ""
        echo "$LOG_PREFIX ========== RESULTS =========="
        echo "$LOG_PREFIX Articles:"
        echo "$LOG_PREFIX   - Created: ${ARTICLES_CREATED:-0}"
        echo "$LOG_PREFIX   - Updated: ${ARTICLES_UPDATED:-0}"
        echo "$LOG_PREFIX Highlights:"
        echo "$LOG_PREFIX   - Created: ${HIGHLIGHTS_CREATED:-0}"
        echo "$LOG_PREFIX   - Updated: ${HIGHLIGHTS_UPDATED:-0}"
        echo "$LOG_PREFIX   - Linked to Books: ${HIGHLIGHTS_LINKED:-0}"
        echo "$LOG_PREFIX =============================="
    else
        echo "$LOG_PREFIX ERROR: Sync returned success=false"
        echo "$LOG_PREFIX Response: $SYNC_BODY"
        exit 1
    fi
else
    echo "$LOG_PREFIX ERROR: Sync failed!"
    echo "$LOG_PREFIX Response: $SYNC_BODY"
    exit 1
fi

echo ""
echo "$LOG_PREFIX Completed at $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="
