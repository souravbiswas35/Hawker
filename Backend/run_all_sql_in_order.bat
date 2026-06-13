@echo off
REM ============================================================================
REM Hawker Urban Vending System - Complete SQL Migration Runner
REM ============================================================================
REM This script executes all SQL files in the correct order with prerequisites
REM It maintains dependency order as defined in EXECUTION_ORDER.md
REM ============================================================================

setlocal enabledelayedexpansion

REM Set database connection parameters
set MYSQL_HOST=localhost
set MYSQL_USER=root
set MYSQL_PASSWORD=mysql123
set MYSQL_DATABASE=hawker
set SQL_DIR=%~dp0sql

REM Check if MySQL is installed and accessible
mysql --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: MySQL is not installed or not in PATH
    echo Please ensure MySQL is installed and added to your system PATH
    echo.
    pause
    exit /b 1
)

REM Check if sql directory exists
if not exist "%SQL_DIR%" (
    echo.
    echo ERROR: SQL directory not found: %SQL_DIR%
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo Hawker Urban Vending System - SQL Migration Runner
echo ============================================================================
echo.
echo Database Connection Details:
echo   Host: %MYSQL_HOST%
echo   User: %MYSQL_USER%
echo   Database: %MYSQL_DATABASE%
echo   SQL Directory: %SQL_DIR%
echo.
echo ============================================================================
echo.

REM Initialize counters and tracking
setlocal enabledelayedexpansion
set "SUCCESS_COUNT=0"
set "FAIL_COUNT=0"
set "START_TIME=%date% %time%"

REM Create a temporary file to track execution
set "LOG_FILE=%SQL_DIR%\..\migration_log.txt"
(
    echo Migration Log - %date% %time%
    echo ============================================================================
) > "%LOG_FILE%"

REM ============================================================================
REM PHASE 1: FOUNDATION
REM ============================================================================
echo [PHASE 1] Running Foundation Scripts...
call :run_sql "01_hawker_schema.sql" "Foundation: Create Database Schema"
if !ERRORLEVEL! neq 0 goto :ERROR_EXIT

call :run_sql "02_hawker_demo_data.sql" "Foundation: Insert Demo Data"

REM ============================================================================
REM PHASE 2: CORE ENHANCEMENTS
REM ============================================================================
echo.
echo [PHASE 2] Running Core Enhancement Scripts...
call :run_sql "03_license_application_schema.sql" "Core: License Application Schema"
if !ERRORLEVEL! neq 0 goto :ERROR_EXIT

call :run_sql "04_demo_data_license_app.sql" "Core: License Application Demo Data"
call :run_sql "05_fix_license_application_status.sql" "Core: Fix License Status ENUM"
call :run_sql "06_add_profile_picture.sql" "Core: Add Profile Picture Support"

REM ============================================================================
REM PHASE 3: ADMIN & COMPLAINT SYSTEM
REM ============================================================================
echo.
echo [PHASE 3] Running Admin and Complaint System Scripts...
call :run_sql "07_admin_feature_schema.sql" "Admin: Feature Schema"
if !ERRORLEVEL! neq 0 goto :ERROR_EXIT

call :run_sql "08_final_admin_setup.sql" "Admin: Final Setup"
if !ERRORLEVEL! neq 0 goto :ERROR_EXIT

call :run_sql "09_vendor_license_renewal_schema.sql" "Admin: License Renewal Schema"
call :run_sql "09_vendor_notifications_schema.sql" "Admin: Notifications Schema"
call :run_sql "10_vendor_complaints_evidence.sql" "Admin: Complaint Evidence"
call :run_sql "11_complaint_comments.sql" "Admin: Complaint Comments"

REM ============================================================================
REM PHASE 4: LICENSE MANAGEMENT
REM ============================================================================
echo.
echo [PHASE 4] Running License Management Scripts...
call :run_sql "12_add_license_fileds.sql" "License: Add License Fields"
call :run_sql "13_fix_approved_licenses.sql" "License: Fix Approved Licenses"

REM ============================================================================
REM PHASE 5: NOTIFICATIONS MANAGEMENT
REM ============================================================================
echo.
echo [PHASE 5] Running Notifications Management Scripts...
call :run_sql "14_verify_and_populate_notifications.sql" "Notifications: Verify and Populate"
call :run_sql "15_add_notification_hidden_field.sql" "Notifications: Add Hidden Field"
call :run_sql "15_populate_vending_zones.sql" "Notifications: Populate Vending Zones"
call :run_sql "16_add_profile_picture_blob.sql" "Notifications: Add Profile Picture BLOB"
call :run_sql "16_enhance_notifications_schema.sql" "Notifications: Enhance Schema"
call :run_sql "17_fix_approved_license_fields.sql" "Notifications: Fix License Fields"
call :run_sql "17_update_existing_notifications.sql" "Notifications: Update Existing"
call :run_sql "18_insert_test_notification.sql" "Notifications: Insert Test Data"
call :run_sql "18_sync_vendor_profile_data.sql" "Notifications: Sync Profile Data"
call :run_sql "19_add_zone_details.sql" "Notifications: Add Zone Details"

REM ============================================================================
REM PHASE 6: PAYMENT SYSTEM
REM ============================================================================
echo.
echo [PHASE 6] Running Payment System Scripts...
call :run_sql "20_vendor_payment_schema.sql" "Payment: Schema Setup"
call :run_sql "21_create_missing_payment_tables.sql" "Payment: Create Missing Tables"
call :run_sql "22_insert_discount_codes.sql" "Payment: Insert Discount Codes"
call :run_sql "23_add_license_payment_connection.sql" "Payment: Link to Licenses"

REM ============================================================================
REM PHASE 7: SETTINGS & INSPECTIONS
REM ============================================================================
echo.
echo [PHASE 7] Running Settings and Inspections Scripts...
call :run_sql "24_vendor_settings_schema.sql" "Settings: Vendor Settings"
call :run_sql "25_inspections_schema.sql" "Settings: Inspections Schema"

REM ============================================================================
REM PHASE 8: WOMEN VENDOR SUPPORT
REM ============================================================================
echo.
echo [PHASE 8] Running Women Vendor Support Scripts...
call :run_sql "26_women_vendor_support_schema.sql" "Women: Support Schema"
call :run_sql "27_add_gender_column.sql" "Women: Add Gender Column"
call :run_sql "28_enhance_women_scheme_applications.sql" "Women: Enhance Scheme Applications"
call :run_sql "32_women_community_features_simple.sql" "Women: Community Features"
call :run_sql "33_add_community_post_counts.sql" "Women: Community Post Counts"

REM ============================================================================
REM PHASE 9: FEEDBACK & ANNOUNCEMENTS
REM ============================================================================
echo.
echo [PHASE 9] Running Feedback and Announcements Scripts...
call :run_sql "29_feedback_system.sql" "Feedback: System Setup"
call :run_sql "30_announcement_system.sql" "Feedback: Announcement System"

REM ============================================================================
REM PHASE 10: ADVANCED FEATURES & FINALIZATION
REM ============================================================================
echo.
echo [PHASE 10] Running Advanced Features and Finalization Scripts...
call :run_sql "34_fix_corrupted_notifications.sql" "Advanced: Fix Corrupted Notifications"
call :run_sql "35_multi_step_approval_workflow.sql" "Advanced: Multi-Step Approval Workflow"
call :run_sql "36_update_notification_action_types.sql" "Advanced: Update Action Types"
call :run_sql "37_add_zone_rectangle_coordinates.sql" "Advanced: Add Zone Coordinates"

REM ============================================================================
REM COMPLETION
REM ============================================================================
goto :SUCCESS_EXIT

:run_sql
setlocal enabledelayedexpansion
set "SQL_FILE=%1"
set "DESCRIPTION=%2"
set "SQL_PATH=%SQL_DIR%\!SQL_FILE!"

echo.
echo Running: !DESCRIPTION!
echo File: !SQL_FILE!

if not exist "!SQL_PATH!" (
    echo   [ERROR] File not found: !SQL_PATH!
    echo   [ERROR] !DESCRIPTION! >> "%LOG_FILE%"
    set /a FAIL_COUNT+=1
    exit /b 1
)

if defined MYSQL_PASSWORD (
    mysql -h !MYSQL_HOST! -u !MYSQL_USER! -p!MYSQL_PASSWORD! < "!SQL_PATH!" 2>> "%LOG_FILE%"
) else (
    mysql -h !MYSQL_HOST! -u !MYSQL_USER! < "!SQL_PATH!" 2>> "%LOG_FILE%"
)

if errorlevel 1 (
    echo   [FAILED] Error executing !SQL_FILE!
    echo   [FAILED] !DESCRIPTION! >> "%LOG_FILE%"
    set /a FAIL_COUNT+=1
    exit /b 1
) else (
    echo   [SUCCESS] !DESCRIPTION! completed
    echo   [SUCCESS] !DESCRIPTION! >> "%LOG_FILE%"
    set /a SUCCESS_COUNT+=1
)
endlocal & set "SUCCESS_COUNT=%SUCCESS_COUNT%" & set "FAIL_COUNT=%FAIL_COUNT%"
exit /b 0

:ERROR_EXIT
echo.
echo ============================================================================
echo ERROR: Critical script failed!
echo ============================================================================
echo.
echo Migration stopped at a critical file. Please check the error above.
echo.
type "%LOG_FILE%"
echo.
pause
exit /b 1

:SUCCESS_EXIT
echo.
echo ============================================================================
echo Migration Complete!
echo ============================================================================
echo.
echo Summary:
echo   Successful Scripts: !SUCCESS_COUNT!
echo   Failed Scripts: !FAIL_COUNT!
echo   Start Time: !START_TIME!
echo   End Time: %date% %time%
echo.
echo Log file: %LOG_FILE%
echo.
echo Migration log contents:
type "%LOG_FILE%"
echo.
pause
exit /b 0
