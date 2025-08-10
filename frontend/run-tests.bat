@echo off
echo Running ProjectLoopbreaker Frontend Tests...
echo.

echo Installing dependencies if needed...
call npm install

echo.
echo Running tests...
call npm run test:run

echo.
echo Tests completed!
pause
