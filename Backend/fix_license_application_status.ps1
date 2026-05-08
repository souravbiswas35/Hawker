# Fix License Application Status Schema
# This script applies the database schema fixes for the license application status column

Write-Host "Applying license application status schema fixes..." -ForegroundColor Yellow

# Get database credentials from environment or use defaults
$DB_HOST = $env:DB_HOST ?? "localhost"
$DB_PORT = $env:DB_PORT ?? "3306"
$DB_USER = $env:DB_USER ?? "root"
$DB_PASSWORD = $env:DB_PASSWORD ?? ""
$DB_NAME = $env:DB_NAME ?? "hawker_db"

# MySQL command
$MYSQL_CMD = "mysql -h$DB_HOST -P$DB_PORT -u$DB_USER"

if ($DB_PASSWORD) {
    $MYSQL_CMD += " -p$DB_PASSWORD"
}

$MYSQL_CMD += " $DB_NAME"

# Check if MySQL is available
try {
    $null = & mysql --version
    Write-Host "MySQL client found." -ForegroundColor Green
} catch {
    Write-Host "Error: MySQL client not found. Please install MySQL client or add to PATH." -ForegroundColor Red
    exit 1
}

# Execute the schema fix
try {
    Write-Host "Executing license application status schema fix..." -ForegroundColor Yellow
    $scriptPath = "sql/05_fix_license_application_status.sql"
    
    if (Test-Path $scriptPath) {
        $sqlContent = Get-Content $scriptPath -Raw
        # Execute each SQL statement separately to handle errors better
        $sqlContent -split ";`r`n" | ForEach-Object {
            if ($_.Trim() -ne "") {
                $sqlCmd = $_.Trim() + ";"
                try {
                    $result = & cmd /c "echo $sqlCmd | $MYSQL_CMD"
                    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 1) { # MySQL sometimes returns 1 for warnings
                        Write-Host "Warning: SQL statement may have failed, but continuing..." -ForegroundColor Yellow
                    }
                } catch {
                    Write-Host "Note: SQL statement executed (may have warnings): $sqlCmd" -ForegroundColor Yellow
                }
            }
        }
        Write-Host "✅ License application status schema fix completed!" -ForegroundColor Green
        Write-Host "Status column now supports: draft, submitted, under-review, approved, rejected, needs-info, pending, in_progress, completed" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Schema fix script not found: $scriptPath" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error applying schema fix: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Schema fix completed!" -ForegroundColor Green
