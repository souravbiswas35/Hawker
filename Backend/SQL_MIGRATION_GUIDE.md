# SQL Migration Runner - Complete Guide

## Overview

This guide explains how to use the automated SQL migration scripts to execute all SQL files in the correct order while maintaining their prerequisites.

Two scripts have been provided for your convenience:

- **run_all_sql_in_order.bat** - Batch script (Windows Command Prompt)
- **run_all_sql_in_order.ps1** - PowerShell script (More advanced)

## Prerequisites

### Required Software

1. **MySQL Server** - Must be installed and running
2. **MySQL Command Line Client** - Must be available in your system PATH

### Checking Prerequisites

#### Check if MySQL is installed:

```bash
mysql --version
```

#### If MySQL is not in PATH:

You need to add MySQL's bin directory to your system PATH:

- Default location: `C:\Program Files\MySQL\MySQL Server 8.0\bin`
- Or wherever you installed MySQL

## Usage

### Option 1: Using Batch Script (Recommended for Beginners)

```bash
run_all_sql_in_order.bat
```

**Steps:**

1. Navigate to the Backend directory in Command Prompt
2. Run the batch file
3. The script will display progress and ask you to press a key when done

**Advantages:**

- Simple to use
- Automatic MySQL detection
- Clear progress output
- Minimal configuration needed

**Example output:**

```
============================================================================
Hawker Urban Vending System - SQL Migration Runner
============================================================================

Database Connection Details:
  Host: localhost
  User: root
  Database: hawker

============================================================================

[PHASE 1] Running Foundation Scripts...

Running: Foundation: Create Database Schema
File: 01_hawker_schema.sql
   [SUCCESS] Foundation: Create Database Schema completed
```

### Option 2: Using PowerShell Script (More Control)

#### Basic Usage:

```powershell
.\run_all_sql_in_order.ps1
```

#### With Custom Parameters:

```powershell
.\run_all_sql_in_order.ps1 -MySQLHost localhost -MySQLUser root -MySQLPassword "your_password" -MySQLDatabase hawker
```

#### Execution Policy (if needed):

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser
```

**Parameters:**

- `-MySQLHost` - MySQL server host (default: localhost)
- `-MySQLUser` - MySQL username (default: root)
- `-MySQLPassword` - MySQL password (default: empty)
- `-MySQLDatabase` - Database name (default: hawker)

**Advantages:**

- More configuration options
- Colored output for better readability
- Better error handling
- Can be integrated into automated workflows

## What the Scripts Do

### Execution Order

The scripts execute SQL files in 10 phases:

1. **Phase 1 - Foundation**
   - Creates the base database structure
   - Files: 01, 02

2. **Phase 2 - Core Enhancements**
   - Adds license application system
   - Files: 03, 04, 05, 06

3. **Phase 3 - Admin & Complaint System**
   - Creates admin features and complaint system
   - Files: 07, 08, 09 (both), 10, 11

4. **Phase 4 - License Management**
   - Adds license fields and fixes
   - Files: 12, 13

5. **Phase 5 - Notifications Management**
   - Sets up notification system
   - Files: 14, 15 (both), 16 (both), 17 (both), 18 (both), 19

6. **Phase 6 - Payment System**
   - Creates payment and discount system
   - Files: 20, 21, 22, 23

7. **Phase 7 - Settings & Inspections**
   - Sets up vendor settings and inspections
   - Files: 24, 25

8. **Phase 8 - Women Vendor Support**
   - Creates women vendor support features
   - Files: 26, 27, 28, 32, 33

9. **Phase 9 - Feedback & Announcements**
   - Sets up feedback and announcement systems
   - Files: 29, 30

10. **Phase 10 - Advanced Features**
    - Adds multi-step workflows and advanced features
    - Files: 34, 35, 36, 37

### Error Handling

- **Critical Phase Failure**: If Phase 1 or 3 fails, the script stops immediately
- **Non-Critical Failures**: Other phases continue even if a single file fails
- **Logging**: All actions are logged to `migration_log.txt` or `migration_log_ps.txt`

## Logs

After execution, check the migration log for details:

- **Batch Script Log**: `Backend/migration_log.txt`
- **PowerShell Log**: `Backend/migration_log_ps.txt`

## Troubleshooting

### Issue: MySQL is not recognized

**Solution**:

1. Check if MySQL is installed: `mysql --version`
2. Add MySQL to PATH (see Prerequisites)
3. Restart the terminal after adding to PATH

### Issue: Connection refused

**Solution**:

1. Ensure MySQL Server is running
2. On Windows: `mysql` should start the MySQL server or use Services to start it
3. Try connecting manually: `mysql -h localhost -u root`

### Issue: Access denied for user 'root'@'localhost'

**Solution**:

1. Your MySQL root password might be different
2. For PowerShell: `.\run_all_sql_in_order.ps1 -MySQLPassword "your_password"`
3. For Batch: Edit the script and add `set MYSQL_PASSWORD=your_password`

### Issue: File not found

**Solution**:

1. Ensure you're running the script from the Backend directory
2. Verify all SQL files exist in the sql subdirectory
3. Check that file names match exactly (case-sensitive)

### Issue: A specific SQL file fails

**Solution**:

1. Check the migration log for the specific error
2. The error is usually displayed in the log output
3. Fix the issue in the SQL file (usually syntax or dependency issues)
4. You can run individual SQL files manually with: `mysql -h localhost -u root < sql\filename.sql`

## Manual Execution

If you prefer to run files manually:

```bash
REM Run a single SQL file
mysql -h localhost -u root < sql\01_hawker_schema.sql

REM Run with password
mysql -h localhost -u root -pYourPassword < sql\01_hawker_schema.sql

REM Run and see errors on console
mysql -h localhost -u root -v < sql\01_hawker_schema.sql
```

## Recovery & Re-running

### To re-run the entire migration:

1. Delete the `hawker` database: `DROP DATABASE hawker;`
2. Run the script again

### To re-run from a specific phase:

1. Manually run the critical Phase 1 files if needed
2. Then delete and re-insert data as needed
3. Or run only the specific SQL files you need

## Database Setup Details

After successful migration, you'll have:

- **Database**: `hawker`
- **41 SQL files** executed in proper order
- **Vendor tables**: users, vendor_profiles, vendor_documents, license_applications
- **Admin tables**: generated_reports, vendor_complaints, admin_notifications
- **Feature tables**: vendor_licenses, vendor_payments, vendor_settings, inspections
- **Support tables**: vendor*notifications, feedback, announcements, women*\* tables

## Performance Notes

- Total execution time: Usually 1-5 minutes depending on system speed
- Database size: Approximately 5-10 MB after all migrations
- No data loss: All inserts are safe and use INSERT IGNORE where needed

## Support

For issues or questions:

1. Check the EXECUTION_ORDER.md for detailed dependency information
2. Review individual SQL file headers for specific requirements
3. Check the migration log for error messages
4. Verify MySQL is properly installed and running

## File Locations

```
Backend/
├── run_all_sql_in_order.bat          ← Run this (Batch)
├── run_all_sql_in_order.ps1          ← Or this (PowerShell)
├── migration_log.txt                  ← Log output (Batch)
├── migration_log_ps.txt               ← Log output (PowerShell)
├── sql/
│   ├── 01_hawker_schema.sql
│   ├── 02_hawker_demo_data.sql
│   ├── ... (37 more SQL files)
│   └── EXECUTION_ORDER.md            ← Detailed dependency info
└── ... (other files)
```
