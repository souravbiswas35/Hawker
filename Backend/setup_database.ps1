# Database Setup Script for Hawker License Application System
# This script runs SQL schema/data updates in sequence.

Write-Host "Setting up database for enhanced license application system..."

# Check if MySQL is available
try {
    $mysqlVersion = mysql --version
    Write-Host "Found MySQL: $mysqlVersion"
}
catch {
    Write-Host "Error: MySQL is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Run schema/data scripts in order
$scripts = @(
    "sql/01_hawker_schema.sql",
    "sql/02_hawker_demo_data.sql",
    "sql/03_license_application_schema.sql",
    "sql/04_demo_data_license_app.sql",
    "sql/05_fix_license_application_status.sql",
    "sql/06_backfill_application_audit_logs.sql",
    "sql/07_admin_feature_schema.sql",
    "sql/08_final_admin_setup.sql",
    "sql/09_vendor_license_renewal_schema.sql"
)

foreach ($script in $scripts) {
    Write-Host "Running $script..."
    try {
        Get-Content $script | mysql -u root -p
        if ($LASTEXITCODE -ne 0) {
            throw "MySQL returned exit code $LASTEXITCODE"
        }
        Write-Host "Completed $script" -ForegroundColor Green
    }
    catch {
        Write-Host "Error running $script : $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Database setup completed!" -ForegroundColor Green
Write-Host "You can now start the backend server."
