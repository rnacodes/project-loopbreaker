# PowerShell script to start the ProjectLoopbreaker backend API
$ErrorActionPreference = "Continue"

Write-Host "Starting ProjectLoopbreaker Backend API..." -ForegroundColor Green
Write-Host "This will start the API server on http://localhost:5000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Change to the backend project directory
Set-Location "src\ProjectLoopbreaker"

try {
    # Run the API project
    Write-Host "Starting API server..." -ForegroundColor Yellow
    dotnet run --project ProjectLoopbreaker.Web.API
} catch {
    Write-Host "Error starting the API server: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure you have .NET 6.0 or later installed and the project builds successfully." -ForegroundColor Yellow
    Write-Host "You can also try running: dotnet build ProjectLoopbreaker.Web.API" -ForegroundColor Yellow
} finally {
    # Return to root directory
    Set-Location "..\.."
}
