# PowerShell script to run foundation seed SQL
# This script connects to your NeonDB and runs the foundation seed SQL

param(
    [Parameter(Mandatory=$false)]
    [string]$DatabaseUrl = $env:DATABASE_URL
)

if (-not $DatabaseUrl) {
    Write-Host "❌ DATABASE_URL environment variable not found" -ForegroundColor Red
    Write-Host "Please set DATABASE_URL or pass it as a parameter:" -ForegroundColor Yellow
    Write-Host "  .\run-foundation-seed.ps1 -DatabaseUrl 'your-connection-string'" -ForegroundColor Yellow
    exit 1
}

Write-Host "🌱 Running Foundation Seed SQL..." -ForegroundColor Green

# Extract connection details from DATABASE_URL
try {
    $uri = [System.Uri]$DatabaseUrl
    $host = $uri.Host
    $port = $uri.Port
    $database = $uri.LocalPath.TrimStart('/')
    $userInfo = $uri.UserInfo.Split(':')
    $username = $userInfo[0]
    $password = $userInfo[1]
    
    # Build psql command
    $env:PGPASSWORD = $password
    $psqlCommand = "psql -h $host -p $port -U $username -d $database -f prisma/foundation_seed.sql"
    
    Write-Host "📊 Connecting to database: $database@$host" -ForegroundColor Blue
    Write-Host "🔄 Executing SQL seed file..." -ForegroundColor Blue
    
    # Run the SQL file
    Invoke-Expression $psqlCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Foundation seed completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔑 Default login credentials:" -ForegroundColor Cyan
        Write-Host "   Email: admin@assumption.ac.th" -ForegroundColor White
        Write-Host "   Password: password123" -ForegroundColor White
        Write-Host ""
        Write-Host "📚 Faculty accounts created:" -ForegroundColor Cyan
        Write-Host "   - chair.engineering@assumption.ac.th (CHAIRPERSON)" -ForegroundColor White
        Write-Host "   - chair.science@assumption.ac.th (CHAIRPERSON)" -ForegroundColor White
        Write-Host "   - chair.management@assumption.ac.th (CHAIRPERSON)" -ForegroundColor White
        Write-Host "   - cs.faculty@assumption.ac.th (FACULTY)" -ForegroundColor White
        Write-Host "   - bba.faculty@assumption.ac.th (FACULTY)" -ForegroundColor White
        Write-Host "   - mkt.faculty@assumption.ac.th (FACULTY)" -ForegroundColor White
    } else {
        Write-Host "❌ Seed failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error parsing DATABASE_URL or running psql: $_" -ForegroundColor Red
    Write-Host "Make sure psql is installed and accessible in PATH" -ForegroundColor Yellow
}

# Clean up
$env:PGPASSWORD = $null
