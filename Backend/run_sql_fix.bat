@echo off
echo Applying license application status schema fix...
echo.

REM Try to find MySQL in common locations
set MYSQL_PATH=""
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" set MYSQL_PATH="C:\Program Files\MySQL\MySQL Server 8.0\bin"
if exist "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe" set MYSQL_PATH="C:\Program Files\MySQL\MySQL Server 5.7\bin"
if exist "C:\xampp\mysql\bin\mysql.exe" set MYSQL_PATH="C:\xampp\mysql\bin"
if exist "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe" set MYSQL_PATH="C:\wamp64\bin\mysql\mysql8.0.31\bin"

if %MYSQL_PATH%=="" (
    echo MySQL not found in common locations.
    echo Please ensure MySQL is installed and add it to PATH, or run this manually:
    echo mysql -u root -p hawker_db ^< sql\05_fix_license_application_status.sql
    pause
    exit /b 1
)

echo Found MySQL at: %MYSQL_PATH%
echo Executing SQL script...
%MYSQL_PATH%\mysql.exe -u root -p hawker_db < sql\05_fix_license_application_status.sql

if %errorlevel%==0 (
    echo.
    echo ✅ Schema fix completed successfully!
    echo Status column now supports: draft, submitted, under-review, approved, rejected, needs-info, pending, in_progress, completed
) else (
    echo.
    echo ❌ Error executing SQL script. Please check your MySQL credentials and try manually.
)

pause
