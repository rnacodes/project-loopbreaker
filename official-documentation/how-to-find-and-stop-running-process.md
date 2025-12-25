How to Find and Stop Running Backend in the Future
--------------------------------------------------

Here's what I did, which you can use anytime:

### Method 1: Find by Port Number (Recommended)

# Find what's running on port 5033

netstat -ano | findstr ":5033"

# This shows the Process ID (PID) in the last column

# Stop it (replace 14092 with the actual PID)

Stop-Process -Id 14092 -Force

### Method 2: Find All Dotnet Processes

# List all dotnet processes

Get-Process -Name "dotnet"

# Stop a specific one

Stop-Process -Id <PID> -Force

# Or stop ALL dotnet processes (use with caution!)

Get-Process -Name "dotnet" | Stop-Process -Force



### Method 3: Using Task Manager

1. Press Ctrl + Shift + Esc to open Task Manager

2. Go to the "Details" tab

3. Find dotnet.exe processes

4. Look for one using port 5033 (or sort by CPU/Memory to find active ones)

5. Right-click → "End task"
