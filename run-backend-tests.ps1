# PowerShell script to run all backend tests with detailed logging
$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "test-results-backend-$timestamp.log"

Write-Host "Running ProjectLoopbreaker Backend Tests..." -ForegroundColor Green
Write-Host "Log file: $logFile" -ForegroundColor Cyan

# Function to log and display results
function Write-TestResult {
    param(
        [string]$Message,
        [string]$Color = "White",
        [bool]$LogToFile = $true
    )
    
    Write-Host $Message -ForegroundColor $Color
    if ($LogToFile) {
        Add-Content -Path $logFile -Value "$(Get-Date -Format 'HH:mm:ss'): $Message"
    }
}

# Function to run tests and capture results
function Invoke-TestRun {
    param(
        [string]$TestProject,
        [string]$TestType,
        [bool]$WithCoverage = $false
    )
    
    Write-TestResult "`n=== Running $TestType ===" "Yellow"
    
    $testArgs = @(
        "test", $TestProject,
        "--verbosity", "detailed",
        "--logger", "console;verbosity=detailed",
        "--logger", "trx;LogFileName=$TestType-results-$timestamp.trx"
    )
    
    if ($WithCoverage) {
        $testArgs += @("--collect", "XPlat Code Coverage", "--results-directory", "./TestResults")
    }
    
    Write-TestResult "Command: dotnet $($testArgs -join ' ')" "Gray"
    
    $output = & dotnet @testArgs 2>&1
    $exitCode = $LASTEXITCODE
    
    # Log all output
    $output | ForEach-Object { Add-Content -Path $logFile -Value $_ }
    
    # Parse and display test results
    $passedTests = ($output | Select-String "Passed!").Count
    $failedTests = ($output | Select-String "Failed!").Count
    $skippedTests = ($output | Select-String "Skipped!").Count
    $totalTests = $passedTests + $failedTests + $skippedTests
    
    Write-TestResult "`n--- $TestType Results ---" "Cyan"
    Write-TestResult "Total Tests: $totalTests" "White"
    Write-TestResult "Passed: $passedTests" "Green"
    Write-TestResult "Failed: $failedTests" "Red"
    Write-TestResult "Skipped: $skippedTests" "Yellow"
    
    # Show failed tests details
    if ($failedTests -gt 0) {
        Write-TestResult "`n--- Failed Tests Details ---" "Red"
        $failedTestDetails = $output | Select-String -Pattern "Failed.*:" -Context 2
        foreach ($detail in $failedTestDetails) {
            Write-TestResult $detail.Line "Red"
            if ($detail.Context.PreContext) {
                foreach ($line in $detail.Context.PreContext) {
                    Write-TestResult "  $line" "DarkRed"
                }
            }
            if ($detail.Context.PostContext) {
                foreach ($line in $detail.Context.PostContext) {
                    Write-TestResult "  $line" "DarkRed"
                }
            }
        }
    }
    
    return $exitCode
}

# Change to the tests directory
Set-Location "tests"

# Initialize log file
Write-TestResult "Backend Test Run Started at $(Get-Date)" "Green"
Write-TestResult "=========================================" "Green"

# Run Unit Tests
$unitTestResult = Invoke-TestRun -TestProject "ProjectLoopbreaker.UnitTests" -TestType "Unit Tests"

if ($unitTestResult -ne 0) {
    Write-TestResult "`n❌ Unit tests failed!" "Red"
    Write-TestResult "Check the log file for details: $logFile" "Yellow"
    Set-Location ".."
    exit 1
}

# Run Integration Tests
$integrationTestResult = Invoke-TestRun -TestProject "ProjectLoopbreaker.IntegrationTests" -TestType "Integration Tests"

if ($integrationTestResult -ne 0) {
    Write-TestResult "`n❌ Integration tests failed!" "Red"
    Write-TestResult "Check the log file for details: $logFile" "Yellow"
    Set-Location ".."
    exit 1
}

# Run All Tests with Coverage
Write-TestResult "`n=== Running All Tests with Coverage ===" "Yellow"
$coverageResult = Invoke-TestRun -TestProject "." -TestType "All Tests" -WithCoverage $true

# Final Summary
Write-TestResult "`n=========================================" "Green"
Write-TestResult "Backend Test Run Completed at $(Get-Date)" "Green"

if ($unitTestResult -eq 0 -and $integrationTestResult -eq 0) {
    Write-TestResult "✅ All backend tests completed successfully!" "Green"
    Write-TestResult "📊 Coverage report generated in ./TestResults/" "Cyan"
} else {
    Write-TestResult "❌ Some tests failed!" "Red"
}

Write-TestResult "📝 Detailed log saved to: $logFile" "Cyan"
Write-TestResult "📋 Test result files (.trx) saved in current directory" "Cyan"

# Return to root directory
Set-Location ".."
