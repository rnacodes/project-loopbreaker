#!/bin/bash
# =============================================================================
# Movie/TV Show TMDB Enrichment Cron Job
# =============================================================================
# This script calls the movie/TV enrichment API endpoint to fetch metadata
# from TMDB for movies and TV shows that don't have a TmdbId.
#
# SETUP INSTRUCTIONS:
# 1. Copy this script to your DigitalOcean VM
# 2. Make it executable: chmod +x movie-tv-enrichment-cron.sh
# 3. Edit the configuration variables below
# 4. Test manually: ./movie-tv-enrichment-cron.sh
# 5. Add to crontab: crontab -e
#
# CRON EXAMPLES:
#   Run every day at 4 AM:
#     0 4 * * * /path/to/movie-tv-enrichment-cron.sh >> /var/log/movie-tv-enrichment.log 2>&1
#
#   Run every 2 days at 4 AM:
#     0 4 */2 * * /path/to/movie-tv-enrichment-cron.sh >> /var/log/movie-tv-enrichment.log 2>&1
#
#   Run every Monday, Wednesday, Friday at 3 AM:
#     0 3 * * 1,3,5 /path/to/movie-tv-enrichment-cron.sh >> /var/log/movie-tv-enrichment.log 2>&1
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
# TMDB has generous rate limits (40 requests per 10 seconds)
BATCH_SIZE=50                    # Items per batch (1-200)
DELAY_MS=500                     # Delay between API calls in ms
MAX_MOVIES=500                   # Maximum movies to process per run
MAX_TVSHOWS=500                  # Maximum TV shows to process per run
PAUSE_BETWEEN_BATCHES=30         # Seconds to pause between batches

# Logging
LOG_PREFIX="[MovieTvEnrichment]"

# -----------------------------------------------------------------------------
# SCRIPT - Don't edit below unless you know what you're doing
# -----------------------------------------------------------------------------

echo ""
echo "=============================================="
echo "$LOG_PREFIX Starting Movie/TV TMDB enrichment run"
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
    -X GET "${API_URL}/movietvenrichment/status" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -H "Content-Type: application/json")

HTTP_CODE=$(echo "$STATUS_RESPONSE" | tail -n1)
STATUS_BODY=$(echo "$STATUS_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
    echo "$LOG_PREFIX ERROR: Failed to get status (HTTP $HTTP_CODE)"
    echo "$LOG_PREFIX Response: $STATUS_BODY"
    exit 1
fi

MOVIES_NEEDING=$(echo "$STATUS_BODY" | grep -o '"moviesNeedingEnrichment":[0-9]*' | cut -d':' -f2)
TVSHOWS_NEEDING=$(echo "$STATUS_BODY" | grep -o '"tvShowsNeedingEnrichment":[0-9]*' | cut -d':' -f2)
echo "$LOG_PREFIX Movies needing enrichment: $MOVIES_NEEDING"
echo "$LOG_PREFIX TV shows needing enrichment: $TVSHOWS_NEEDING"

TOTAL_NEEDING=$((MOVIES_NEEDING + TVSHOWS_NEEDING))
if [ "$TOTAL_NEEDING" = "0" ]; then
    echo "$LOG_PREFIX No movies or TV shows need enrichment. Exiting."
    exit 0
fi

# Run the enrichment
echo "$LOG_PREFIX Starting enrichment with:"
echo "$LOG_PREFIX   - Batch size: $BATCH_SIZE"
echo "$LOG_PREFIX   - Max movies: $MAX_MOVIES"
echo "$LOG_PREFIX   - Max TV shows: $MAX_TVSHOWS"
echo "$LOG_PREFIX   - Delay: ${DELAY_MS}ms"
echo "$LOG_PREFIX   - Pause between batches: ${PAUSE_BETWEEN_BATCHES}s"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "${API_URL}/movietvenrichment/run-all" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
        \"batchSize\": ${BATCH_SIZE},
        \"delayBetweenCallsMs\": ${DELAY_MS},
        \"maxMovies\": ${MAX_MOVIES},
        \"maxTvShows\": ${MAX_TVSHOWS},
        \"pauseBetweenBatchesSeconds\": ${PAUSE_BETWEEN_BATCHES}
    }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "$LOG_PREFIX HTTP Response Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "$LOG_PREFIX Enrichment completed successfully!"
    echo "$LOG_PREFIX Response: $BODY"

    # Extract and display key metrics
    MOVIES_PROCESSED=$(echo "$BODY" | grep -o '"totalMoviesProcessed":[0-9]*' | cut -d':' -f2)
    MOVIES_ENRICHED=$(echo "$BODY" | grep -o '"totalMoviesEnriched":[0-9]*' | cut -d':' -f2)
    MOVIES_NOTFOUND=$(echo "$BODY" | grep -o '"totalMoviesNotFound":[0-9]*' | cut -d':' -f2)
    MOVIES_FAILED=$(echo "$BODY" | grep -o '"totalMoviesFailed":[0-9]*' | cut -d':' -f2)
    TVSHOWS_PROCESSED=$(echo "$BODY" | grep -o '"totalTvShowsProcessed":[0-9]*' | cut -d':' -f2)
    TVSHOWS_ENRICHED=$(echo "$BODY" | grep -o '"totalTvShowsEnriched":[0-9]*' | cut -d':' -f2)
    TVSHOWS_NOTFOUND=$(echo "$BODY" | grep -o '"totalTvShowsNotFound":[0-9]*' | cut -d':' -f2)
    TVSHOWS_FAILED=$(echo "$BODY" | grep -o '"totalTvShowsFailed":[0-9]*' | cut -d':' -f2)
    REMAINING_MOVIES=$(echo "$BODY" | grep -o '"remainingMovies":[0-9]*' | cut -d':' -f2)
    REMAINING_TVSHOWS=$(echo "$BODY" | grep -o '"remainingTvShows":[0-9]*' | cut -d':' -f2)

    echo ""
    echo "$LOG_PREFIX Summary - Movies:"
    echo "$LOG_PREFIX   - Processed: $MOVIES_PROCESSED"
    echo "$LOG_PREFIX   - Enriched: $MOVIES_ENRICHED"
    echo "$LOG_PREFIX   - Not Found: $MOVIES_NOTFOUND"
    echo "$LOG_PREFIX   - Failed: $MOVIES_FAILED"
    echo "$LOG_PREFIX   - Remaining: $REMAINING_MOVIES"
    echo ""
    echo "$LOG_PREFIX Summary - TV Shows:"
    echo "$LOG_PREFIX   - Processed: $TVSHOWS_PROCESSED"
    echo "$LOG_PREFIX   - Enriched: $TVSHOWS_ENRICHED"
    echo "$LOG_PREFIX   - Not Found: $TVSHOWS_NOTFOUND"
    echo "$LOG_PREFIX   - Failed: $TVSHOWS_FAILED"
    echo "$LOG_PREFIX   - Remaining: $REMAINING_TVSHOWS"
else
    echo "$LOG_PREFIX ERROR: Enrichment failed!"
    echo "$LOG_PREFIX Response: $BODY"
    exit 1
fi

echo ""
echo "$LOG_PREFIX Completed at $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="
