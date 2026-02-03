# Test Book Enrichment Service
# This script tests the book enrichment API endpoints

param(
    [string]$ApiBaseUrl = "http://localhost:5033/api",
    [string]$BookId = "",
    [switch]$TestStatus,
    [switch]$TestSingleBook,
    [switch]$TestBatchRun,
    [switch]$All
)

# Colors for output
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Fail { param($msg) Write-Host $msg -ForegroundColor Red }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }

# Get auth token
function Get-AuthToken {
    $username = $env:AUTH_USERNAME
    $password = $env:AUTH_PASSWORD

    if (-not $username -or -not $password) {
        Write-Fail "AUTH_USERNAME and AUTH_PASSWORD environment variables must be set"
        exit 1
    }

    Write-Info "Authenticating..."
    try {
        $body = @{
            username = $username
            password = $password
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$ApiBaseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
        Write-Success "Authentication successful"
        return $response.token
    }
    catch {
        Write-Fail "Authentication failed: $_"
        exit 1
    }
}

# Test enrichment status endpoint
function Test-EnrichmentStatus {
    param($token)

    Write-Info "`n=== Testing GET /api/bookenrichment/status ==="

    try {
        $headers = @{ Authorization = "Bearer $token" }
        $response = Invoke-RestMethod -Uri "$ApiBaseUrl/bookenrichment/status" -Method Get -Headers $headers

        Write-Success "Status endpoint successful"
        Write-Host "  Books needing enrichment: $($response.booksNeedingEnrichment)"
        return $response
    }
    catch {
        Write-Fail "Status endpoint failed: $_"
        return $null
    }
}

# Test single book enrichment
function Test-SingleBookEnrichment {
    param($token, $bookId)

    Write-Info "`n=== Testing POST /api/bookenrichment/{id} ==="

    if (-not $bookId) {
        Write-Info "No book ID provided. Fetching a book to test with..."

        try {
            $headers = @{ Authorization = "Bearer $token" }
            $mediaResponse = Invoke-RestMethod -Uri "$ApiBaseUrl/media?mediaType=Book&pageSize=10" -Method Get -Headers $headers

            if ($mediaResponse.items -and $mediaResponse.items.Count -gt 0) {
                # Find a book with ISBN but no description
                $testBook = $null
                foreach ($item in $mediaResponse.items) {
                    if ($item.mediaType -eq "Book") {
                        $bookDetails = Invoke-RestMethod -Uri "$ApiBaseUrl/book/$($item.id)" -Method Get -Headers $headers
                        if ($bookDetails.isbn -and (-not $bookDetails.description -or $bookDetails.description -eq "")) {
                            $testBook = $bookDetails
                            break
                        }
                        # If no book without description, just use the first book with ISBN
                        if (-not $testBook -and $bookDetails.isbn) {
                            $testBook = $bookDetails
                        }
                    }
                }

                if ($testBook) {
                    $bookId = $testBook.id
                    Write-Info "  Using book: '$($testBook.title)' (ID: $bookId)"
                    Write-Info "  ISBN: $($testBook.isbn)"
                    Write-Info "  Has description: $($testBook.description -ne $null -and $testBook.description -ne '')"
                }
                else {
                    Write-Fail "No books with ISBN found to test"
                    return $null
                }
            }
            else {
                Write-Fail "No books found in library"
                return $null
            }
        }
        catch {
            Write-Fail "Failed to fetch books: $_"
            return $null
        }
    }

    try {
        $headers = @{ Authorization = "Bearer $token" }
        $response = Invoke-RestMethod -Uri "$ApiBaseUrl/bookenrichment/$bookId" -Method Post -Headers $headers

        Write-Success "Single book enrichment endpoint successful"
        Write-Host "  Book Title: $($response.bookTitle)"
        Write-Host "  Success: $($response.success)"

        if ($response.success) {
            Write-Host "  Description length: $($response.description.Length) characters"
            if ($response.description.Length -gt 200) {
                Write-Host "  Description preview: $($response.description.Substring(0, 200))..."
            }
            else {
                Write-Host "  Description: $($response.description)"
            }
        }
        elseif ($response.alreadyHasDescription) {
            Write-Info "  Book already has a description"
        }
        elseif ($response.noIsbn) {
            Write-Info "  Book has no ISBN"
        }
        else {
            Write-Info "  Error: $($response.errorMessage)"
        }

        return $response
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) {
            Write-Fail "Book not found (404)"
        }
        else {
            Write-Fail "Single book enrichment failed: $_"
        }
        return $null
    }
}

# Test batch enrichment run
function Test-BatchRun {
    param($token)

    Write-Info "`n=== Testing POST /api/bookenrichment/run ==="

    try {
        $headers = @{
            Authorization = "Bearer $token"
            "Content-Type" = "application/json"
        }
        $body = @{
            batchSize = 2
            delayBetweenCallsMs = 1000
        } | ConvertTo-Json

        Write-Info "Running batch enrichment with batchSize=2..."
        $response = Invoke-RestMethod -Uri "$ApiBaseUrl/bookenrichment/run" -Method Post -Headers $headers -Body $body

        Write-Success "Batch enrichment endpoint successful"
        Write-Host "  Total processed: $($response.totalProcessed)"
        Write-Host "  Enriched count: $($response.enrichedCount)"
        Write-Host "  Failed count: $($response.failedCount)"
        Write-Host "  Skipped count: $($response.skippedCount)"

        if ($response.errors -and $response.errors.Count -gt 0) {
            Write-Info "  Errors:"
            foreach ($err in $response.errors) {
                Write-Host "    - $err"
            }
        }

        return $response
    }
    catch {
        Write-Fail "Batch enrichment failed: $_"
        return $null
    }
}

# Main execution
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "  Book Enrichment Service Test Script  " -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

# Determine which tests to run
$runAll = $All -or (-not $TestStatus -and -not $TestSingleBook -and -not $TestBatchRun)

# Get authentication token
$token = Get-AuthToken

if ($runAll -or $TestStatus) {
    Test-EnrichmentStatus -token $token
}

if ($runAll -or $TestSingleBook) {
    Test-SingleBookEnrichment -token $token -bookId $BookId
}

if ($runAll -or $TestBatchRun) {
    Test-BatchRun -token $token
}

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "  Tests Complete  " -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow
