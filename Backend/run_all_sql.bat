@echo off
REM Script to run all SQL files in order
REM This will execute all SQL files from the sql directory

echo ========================================
echo Running all SQL files in order...
echo ========================================
echo.

REM Set your MySQL credentials here
SET MYSQL_USER=root
SET MYSQL_PASSWORD=your_password
SET MYSQL_HOST=localhost
SET MYSQL_DATABASE=hawker

REM Check if MySQL is accessible
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% -e "USE %MYSQL_DATABASE%; SELECT 1;" >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Cannot connect to MySQL database.
    echo Please check your MySQL credentials and ensure the database exists.
    echo.
    echo Current settings:
    echo   Host: %MYSQL_HOST%
    echo   User: %MYSQL_USER%
    echo   Database: %MYSQL_DATABASE%
    echo.
    pause
    exit /b 1
)

echo Connected to MySQL successfully.
echo.

REM Get the directory where this script is located
SET SCRIPT_DIR=%~dp0
SET SQL_DIR=%SCRIPT_DIR%sql

REM Check if sql directory exists
IF NOT EXIST "%SQL_DIR%" (
    echo ERROR: SQL directory not found at %SQL_DIR%
    pause
    exit /b 1
)

REM Create a temporary combined SQL file
SET COMBINED_SQL=%TEMP%\hawker_all_sql_%RANDOM%.sql

echo Combining all SQL files into a single script...
echo USE hawker; > "%COMBINED_SQL%"
echo. >> "%COMBINED_SQL%"
echo SET FOREIGN_KEY_CHECKS = 0; >> "%COMBINED_SQL%"
echo. >> "%COMBINED_SQL%"

REM Process SQL files in numerical order
for /f "delims=" %%f in ('dir /b /o:n "%SQL_DIR%\*.sql"') do (
    echo Adding: %%f
    echo. >> "%COMBINED_SQL%"
    echo -- ======================================== >> "%COMBINED_SQL%"
    echo -- Running file: %%f >> "%COMBINED_SQL%"
    echo -- ======================================== >> "%COMBINED_SQL%"
    echo. >> "%COMBINED_SQL%"
    type "%SQL_DIR%\%%f" >> "%COMBINED_SQL%"
    echo. >> "%COMBINED_SQL%"
)

echo SET FOREIGN_KEY_CHECKS = 1; >> "%COMBINED_SQL%"
echo. >> "%COMBINED_SQL%"

echo.
echo Executing combined SQL script...
echo.

REM Run the combined SQL file
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < "%COMBINED_SQL%"

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS: All SQL files executed successfully!
    echo ========================================
) ELSE (
    echo.
    echo ========================================
    echo ERROR: Some SQL files failed to execute.
    echo ========================================
    echo.
    echo The combined SQL file has been saved at:
    echo %COMBINED_SQL%
    echo.
    echo You can review it manually and run it separately:
    echo mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% ^< "%COMBINED_SQL%"
)

REM Clean up the temporary file
del "%COMBINED_SQL%" >nul 2>&1

echo.
pause


