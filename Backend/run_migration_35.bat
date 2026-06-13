@echo off
REM Script to run the multi-step approval workflow migration

echo ========================================
echo Running Multi-Step Approval Workflow Migration
echo ========================================
echo.

REM Set your MySQL credentials here
SET MYSQL_USER=root
SET MYSQL_PASSWORD=root123Sakibul
SET MYSQL_HOST=localhost
SET MYSQL_DATABASE=hawker

REM Get the directory where this script is located
SET SCRIPT_DIR=%~dp0
SET SQL_FILE=%SCRIPT_DIR%sql\35_multi_step_approval_workflow.sql

REM Check if SQL file exists
IF NOT EXIST "%SQL_FILE%" (
    echo ERROR: SQL file not found at %SQL_FILE%
    pause
    exit /b 1
)

echo Running migration file: 35_multi_step_approval_workflow.sql
echo.

REM Run the SQL file
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p %MYSQL_DATABASE% < "%SQL_FILE%"

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS: Migration executed successfully!
    echo ========================================
) ELSE (
    echo.
    echo ========================================
    echo ERROR: Migration failed to execute.
    echo ========================================
    echo.
    echo Please check your MySQL credentials and ensure the database exists.
    echo Current settings:
    echo   Host: %MYSQL_HOST%
    echo   User: %MYSQL_USER%
    echo   Database: %MYSQL_DATABASE%
)

echo.
pause
