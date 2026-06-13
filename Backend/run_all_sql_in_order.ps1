# ============================================================================
# Hawker Urban Vending System - Complete SQL Migration Runner (PowerShell)
# ============================================================================
# This script executes all SQL files in the correct order with prerequisites
# It maintains dependency order as defined in EXECUTION_ORDER.md
# ============================================================================

param(
    [string]$MySQLHost = "localhost",
    [string]$MySQLUser = "root",
    [string]$MySQLPassword = "",
    [string]$MySQLDatabase = "hawker"
)

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SqlDir = Join-Path $ScriptDir "sql"
$LogFile = Join-Path $ScriptDir "migration_log_ps.txt"

# Initialize counters
$SuccessCount = 0
$FailCount = 0
$StartTime = Get-Date

# Color codes for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Phase = "Cyan"
    Info = "White"
}

function Write-Status {
    param(
        [string]$Message,
        [string]$Status = "Info"
    )
    $Color = $Colors[$Status]
    Write-Host $Message -ForegroundColor $Color
}

function Test-MySQLInstallation {
    try {
        $version = mysql --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Status "MySQL is installed: $version" "Success"
            return $true
        }
    }
    catch {
        Write-Status "ERROR: MySQL is not installed or not in PATH" "Error"
        return $false
    }
}

function Run-SqlFile {
    param(
        [string]$FileName,
        [string]$Description
    )
    
    $FilePath = Join-Path $SqlDir $FileName
    
    Write-Host ""
    Write-Status "Running: $Description" "Info"
    Write-Host "File: $FileName"
    
    if (-not (Test-Path $FilePath)) {
        Write-Status "  [ERROR] File not found: $FilePath" "Error"
        "[ERROR] $Description - File not found" | Add-Content $LogFile
        $script:FailCount++
        return $false
    }
    
    try {
        $SQLContent = Get-Content $FilePath -Raw
        
        # Build the mysql command
        if ($MySQLPassword) {
            $MySQLCmd = @"
mysql -h $MySQLHost -u $MySQLUser -p$MySQLPassword -e "source $FilePath"
"@
        }
        else {
            $MySQLCmd = @"
mysql -h $MySQLHost -u $MySQLUser -e "source $FilePath"
"@
        }
        
        # Execute using cmd to properly handle MySQL redirection
        $Result = & cmd /c "mysql -h $MySQLHost -u $MySQLUser $(if($MySQLPassword) { '-p' + $MySQLPassword } else { '' }) < `"$FilePath`" 2>&1"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "  [SUCCESS] $Description completed" "Success"
            "[SUCCESS] $Description" | Add-Content $LogFile
            $script:SuccessCount++
            return $true
        }
        else {
            Write-Status "  [FAILED] Error executing $FileName" "Error"
            if ($Result) {
                Write-Host $Result -ForegroundColor Red
            }
            "[FAILED] $Description - Exit Code: $LASTEXITCODE" | Add-Content $LogFile
            $script:FailCount++
            return $false
        }
    }
    catch {
        Write-Status "  [ERROR] Exception: $_" "Error"
        "[ERROR] $Description - Exception: $_" | Add-Content $LogFile
        $script:FailCount++
        return $false
    }
}

# ============================================================================
# MAIN SCRIPT
# ============================================================================

Clear-Host
Write-Host ""
Write-Status "============================================================================" "Phase"
Write-Status "Hawker Urban Vending System - SQL Migration Runner" "Phase"
Write-Status "============================================================================" "Phase"
Write-Host ""

# Validate environment
if (-not (Test-Path $SqlDir)) {
    Write-Status "ERROR: SQL directory not found: $SqlDir" "Error"
    exit 1
}

Write-Status "Database Connection Details:" "Info"
Write-Host "  Host: $MySQLHost"
Write-Host "  User: $MySQLUser"
Write-Host "  Database: $MySQLDatabase"
Write-Host "  SQL Directory: $SqlDir"
Write-Host ""

if (-not (Test-MySQLInstallation)) {
    Write-Status "Please ensure MySQL is installed and added to your system PATH" "Error"
    exit 1
}

# Create log file
"Migration Log - $(Get-Date)" | Set-Content $LogFile
"============================================================================" | Add-Content $LogFile
"" | Add-Content $LogFile

# ============================================================================
# PHASE 1: FOUNDATION
# ============================================================================
Write-Status "[PHASE 1] Running Foundation Scripts..." "Phase"
Run-SqlFile "01_hawker_schema.sql" "Foundation: Create Database Schema"
if ($FailCount -gt 0) {
    Write-Status "ERROR: Foundation phase failed!" "Error"
    exit 1
}

Run-SqlFile "02_hawker_demo_data.sql" "Foundation: Insert Demo Data"

# ============================================================================
# PHASE 2: CORE ENHANCEMENTS
# ============================================================================
Write-Status "[PHASE 2] Running Core Enhancement Scripts..." "Phase"
Run-SqlFile "03_license_application_schema.sql" "Core: License Application Schema"
if ($FailCount -gt 0) {
    Write-Status "ERROR: Core phase failed!" "Error"
    exit 1
}

Run-SqlFile "04_demo_data_license_app.sql" "Core: License Application Demo Data"
Run-SqlFile "05_fix_license_application_status.sql" "Core: Fix License Status ENUM"
Run-SqlFile "06_add_profile_picture.sql" "Core: Add Profile Picture Support"

# ============================================================================
# PHASE 3: ADMIN & COMPLAINT SYSTEM
# ============================================================================
Write-Status "[PHASE 3] Running Admin and Complaint System Scripts..." "Phase"
Run-SqlFile "07_admin_feature_schema.sql" "Admin: Feature Schema"
if ($FailCount -gt 0) {
    Write-Status "ERROR: Admin phase failed!" "Error"
    exit 1
}

Run-SqlFile "08_final_admin_setup.sql" "Admin: Final Setup"
if ($FailCount -gt 0) {
    Write-Status "ERROR: Admin setup failed!" "Error"
    exit 1
}

Run-SqlFile "09_vendor_license_renewal_schema.sql" "Admin: License Renewal Schema"
Run-SqlFile "09_vendor_notifications_schema.sql" "Admin: Notifications Schema"
Run-SqlFile "10_vendor_complaints_evidence.sql" "Admin: Complaint Evidence"
Run-SqlFile "11_complaint_comments.sql" "Admin: Complaint Comments"

# ============================================================================
# PHASE 4: LICENSE MANAGEMENT
# ============================================================================
Write-Status "[PHASE 4] Running License Management Scripts..." "Phase"
Run-SqlFile "12_add_license_fileds.sql" "License: Add License Fields"
Run-SqlFile "13_fix_approved_licenses.sql" "License: Fix Approved Licenses"

# ============================================================================
# PHASE 5: NOTIFICATIONS MANAGEMENT
# ============================================================================
Write-Status "[PHASE 5] Running Notifications Management Scripts..." "Phase"
Run-SqlFile "14_verify_and_populate_notifications.sql" "Notifications: Verify and Populate"
Run-SqlFile "15_add_notification_hidden_field.sql" "Notifications: Add Hidden Field"
Run-SqlFile "15_populate_vending_zones.sql" "Notifications: Populate Vending Zones"
Run-SqlFile "16_add_profile_picture_blob.sql" "Notifications: Add Profile Picture BLOB"
Run-SqlFile "16_enhance_notifications_schema.sql" "Notifications: Enhance Schema"
Run-SqlFile "17_fix_approved_license_fields.sql" "Notifications: Fix License Fields"
Run-SqlFile "17_update_existing_notifications.sql" "Notifications: Update Existing"
Run-SqlFile "18_insert_test_notification.sql" "Notifications: Insert Test Data"
Run-SqlFile "18_sync_vendor_profile_data.sql" "Notifications: Sync Profile Data"
Run-SqlFile "19_add_zone_details.sql" "Notifications: Add Zone Details"

# ============================================================================
# PHASE 6: PAYMENT SYSTEM
# ============================================================================
Write-Status "[PHASE 6] Running Payment System Scripts..." "Phase"
Run-SqlFile "20_vendor_payment_schema.sql" "Payment: Schema Setup"
Run-SqlFile "21_create_missing_payment_tables.sql" "Payment: Create Missing Tables"
Run-SqlFile "22_insert_discount_codes.sql" "Payment: Insert Discount Codes"
Run-SqlFile "23_add_license_payment_connection.sql" "Payment: Link to Licenses"

# ============================================================================
# PHASE 7: SETTINGS & INSPECTIONS
# ============================================================================
Write-Status "[PHASE 7] Running Settings and Inspections Scripts..." "Phase"
Run-SqlFile "24_vendor_settings_schema.sql" "Settings: Vendor Settings"
Run-SqlFile "25_inspections_schema.sql" "Settings: Inspections Schema"

# ============================================================================
# PHASE 8: WOMEN VENDOR SUPPORT
# ============================================================================
Write-Status "[PHASE 8] Running Women Vendor Support Scripts..." "Phase"
Run-SqlFile "26_women_vendor_support_schema.sql" "Women: Support Schema"
Run-SqlFile "27_add_gender_column.sql" "Women: Add Gender Column"
Run-SqlFile "28_enhance_women_scheme_applications.sql" "Women: Enhance Scheme Applications"
Run-SqlFile "32_women_community_features_simple.sql" "Women: Community Features"
Run-SqlFile "33_add_community_post_counts.sql" "Women: Community Post Counts"

# ============================================================================
# PHASE 9: FEEDBACK & ANNOUNCEMENTS
# ============================================================================
Write-Status "[PHASE 9] Running Feedback and Announcements Scripts..." "Phase"
Run-SqlFile "29_feedback_system.sql" "Feedback: System Setup"
Run-SqlFile "30_announcement_system.sql" "Feedback: Announcement System"

# ============================================================================
# PHASE 10: ADVANCED FEATURES & FINALIZATION
# ============================================================================
Write-Status "[PHASE 10] Running Advanced Features and Finalization Scripts..." "Phase"
Run-SqlFile "34_fix_corrupted_notifications.sql" "Advanced: Fix Corrupted Notifications"
Run-SqlFile "35_multi_step_approval_workflow.sql" "Advanced: Multi-Step Approval Workflow"
Run-SqlFile "36_update_notification_action_types.sql" "Advanced: Update Action Types"
Run-SqlFile "37_add_zone_rectangle_coordinates.sql" "Advanced: Add Zone Coordinates"

# ============================================================================
# COMPLETION
# ============================================================================
Write-Host ""
Write-Status "============================================================================" "Phase"
Write-Status "Migration Complete!" "Phase"
Write-Status "============================================================================" "Phase"
Write-Host ""

$EndTime = Get-Date
$Duration = $EndTime - $StartTime

Write-Status "Summary:" "Info"
Write-Host "  Successful Scripts: $SuccessCount"
Write-Host "  Failed Scripts: $FailCount"
Write-Host "  Start Time: $StartTime"
Write-Host "  End Time: $EndTime"
Write-Host "  Duration: $($Duration.ToString())"
Write-Host ""
Write-Host "Log file: $LogFile"
Write-Host ""

Write-Status "Log file contents:" "Info"
Get-Content $LogFile

Write-Host ""
if ($FailCount -eq 0) {
    Write-Status "All migrations completed successfully!" "Success"
    exit 0
}
else {
    Write-Status "Some migrations failed. Please review the log." "Error"
    exit 1
}
