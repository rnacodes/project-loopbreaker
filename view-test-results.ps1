# PowerShell script to view test results and logs
param(
    [string]$LogType = "all",  # all, backend, frontend, master
    [int]$Lines = 50           # Number of lines to show
)

Write-Host "ProjectLoopbreaker Test Results Viewer" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Function to display log file contents
function Show-LogFile {
    param(
        [string]$Pattern,
        [string]$Description
    )
    
    $logFiles = Get-ChildItem -Path "." -Filter $Pattern | Sort-Object LastWriteTime -Descending
    
    if ($logFiles.Count -eq 0) {
        Write-Host "No $Description log files found." -ForegroundColor Yellow
        return
    }
    
    $latestLog = $logFiles[0]
    Write-Host "`n--- $Description (Latest: $($latestLog.Name)) ---" -ForegroundColor Cyan
    Write-Host "File: $($latestLog.FullName)" -ForegroundColor Gray
    Write-Host "Size: $([math]::Round($latestLog.Length / 1KB, 2)) KB" -ForegroundColor Gray
    Write-Host "Modified: $($latestLog.LastWriteTime)" -ForegroundColor Gray
    
    Write-Host "`nLast $Lines lines:" -ForegroundColor White
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    Get-Content $latestLog.FullName -Tail $Lines | ForEach-Object {
        # Color code different types of log entries
        if ($_ -match "ERROR|Failed|❌") {
            Write-Host $_ -ForegroundColor Red
        } elseif ($_ -match "SUCCESS|Passed|✅") {
            Write-Host $_ -ForegroundColor Green
        } elseif ($_ -match "WARNING|Warning") {
            Write-Host $_ -ForegroundColor Yellow
        } elseif ($_ -match "INFO|Info") {
            Write-Host $_ -ForegroundColor Cyan
        } else {
            Write-Host $_ -ForegroundColor White
        }
    }
}

# Function to show test summary
function Show-TestSummary {
    Write-Host "`n--- Test Summary ---" -ForegroundColor Cyan
    
    # Count log files
    $backendLogs = (Get-ChildItem -Path "." -Filter "test-results-backend-*.log").Count
    $frontendLogs = (Get-ChildItem -Path "." -Filter "test-results-frontend-*.log").Count
    $masterLogs = (Get-ChildItem -Path "." -Filter "test-results-master-*.log").Count
    
    Write-Host "Backend test runs: $backendLogs" -ForegroundColor White
    Write-Host "Frontend test runs: $frontendLogs" -ForegroundColor White
    Write-Host "Master test runs: $masterLogs" -ForegroundColor White
    
    # Show latest test results
    $latestMaster = Get-ChildItem -Path "." -Filter "test-results-master-*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    
    if ($latestMaster) {
        Write-Host "`nLatest test run: $($latestMaster.Name)" -ForegroundColor Cyan
        $summary = Get-Content $latestMaster.FullName | Select-String -Pattern "Backend tests:|Frontend tests:|ALL TESTS|SOME TESTS" | Select-Object -Last 3
        foreach ($line in $summary) {
            if ($line.Line -match "PASSED|✅") {
                Write-Host $line.Line -ForegroundColor Green
            } elseif ($line.Line -match "FAILED|❌") {
                Write-Host $line.Line -ForegroundColor Red
            } else {
                Write-Host $line.Line -ForegroundColor White
            }
        }
    }
}

# Main execution
switch ($LogType.ToLower()) {
    "backend" {
        Show-LogFile "test-results-backend-*.log" "Backend Tests"
    }
    "frontend" {
        Show-LogFile "test-results-frontend-*.log" "Frontend Tests"
    }
    "master" {
        Show-LogFile "test-results-master-*.log" "Master Test Run"
    }
    "all" {
        Show-TestSummary
        Show-LogFile "test-results-master-*.log" "Master Test Run"
        Show-LogFile "test-results-backend-*.log" "Backend Tests"
        Show-LogFile "test-results-frontend-*.log" "Frontend Tests"
    }
    default {
        Write-Host "Invalid log type. Use: all, backend, frontend, or master" -ForegroundColor Red
        Write-Host "Usage: .\view-test-results.ps1 -LogType [all|backend|frontend|master] -Lines [number]" -ForegroundColor Yellow
    }
}

Write-Host "`n=====================================" -ForegroundColor Green
Write-Host "Use -Lines parameter to show more/fewer lines" -ForegroundColor Gray
Write-Host "Example: .\view-test-results.ps1 -LogType backend -Lines 100" -ForegroundColor Gray
