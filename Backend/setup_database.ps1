# Database Setup Script for Hawker License Application System
# This script will run the SQL schema updates

Write-Host "Setting up database for enhanced license application system..."

# Check if MySQL is available
try {
    $mysqlVersion = mysql --version
    Write-Host "Found MySQL: $mysqlVersion"
} catch {
    Write-Host "Error: MySQL is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Run schema updates
Write-Host "Running schema update 03_license_application_schema.sql..."
try {
    Get-Content sql/03_license_application_schema.sql | mysql -u root -p
    Write-Host "✓ Schema update completed successfully" -ForegroundColor Green
} catch {
    Write-Host "Error running schema update: $_" -ForegroundColor Red
}

# Run demo data
Write-Host "Running demo data 04_demo_data_license_app.sql..."
try {
    Get-Content sql/04_demo_data_license_app.sql | mysql -u root -p
    Write-Host "✓ Demo data inserted successfully" -ForegroundColor Green
} catch {
    Write-Host "Error inserting demo data: $_" -ForegroundColor Red
}

Write-Host "Database setup completed!" -ForegroundColor Green
Write-Host "You can now start the backend server."
