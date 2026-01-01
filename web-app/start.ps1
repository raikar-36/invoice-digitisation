# Quick Start Script for Smart Invoice System
# This script helps verify your setup is working

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "Smart Invoice System - Quick Start" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check if .env exists
Write-Host "`nChecking environment configuration..." -ForegroundColor Yellow
if (Test-Path .env) {
    Write-Host "✓ .env file found" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    Write-Host "Creating .env from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✓ Created .env file" -ForegroundColor Green
    Write-Host "`n⚠️  IMPORTANT: Edit .env and add your database credentials!" -ForegroundColor Magenta
    Write-Host "   - MONGODB_URI (MongoDB Atlas connection string)" -ForegroundColor White
    Write-Host "   - POSTGRES_URI (NeonDB or PostgreSQL connection string)" -ForegroundColor White
    Write-Host "`nPress any key after updating .env..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Check if node_modules exists
Write-Host "`nChecking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path node_modules)) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to install backend dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ Backend dependencies already installed" -ForegroundColor Green
}

if (-not (Test-Path client/node_modules)) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location client
    npm install
    Set-Location ..
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to install frontend dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ Frontend dependencies already installed" -ForegroundColor Green
}

# Ask if user wants to seed database
Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "Database Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "`nWould you like to seed the database now?" -ForegroundColor Yellow
Write-Host "(This creates initial users and tables)" -ForegroundColor Gray
Write-Host "y/n: " -NoNewline -ForegroundColor Yellow
$response = Read-Host

if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "`nSeeding database..." -ForegroundColor Yellow
    node server/seed.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ Database seeded successfully!" -ForegroundColor Green
    } else {
        Write-Host "`n✗ Database seeding failed. Check your .env credentials." -ForegroundColor Red
        Write-Host "You can run 'node server/seed.js' manually later." -ForegroundColor Yellow
    }
} else {
    Write-Host "Skipping database seeding." -ForegroundColor Gray
    Write-Host "You can run 'node server/seed.js' later." -ForegroundColor Yellow
}

# Display next steps
Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "Setup Complete! 🎉" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan

Write-Host "`nTo start the application:" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor White
Write-Host "`nThen open: http://localhost:5173" -ForegroundColor Cyan

Write-Host "`nDemo Login Accounts:" -ForegroundColor Yellow
Write-Host "  Owner:      owner@invoice.com / admin123" -ForegroundColor White
Write-Host "  Staff:      staff@invoice.com / staff123" -ForegroundColor White
Write-Host "  Accountant: accountant@invoice.com / accountant123" -ForegroundColor White

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "`nWould you like to start the servers now? (y/n): " -NoNewline -ForegroundColor Yellow
$startNow = Read-Host

if ($startNow -eq 'y' -or $startNow -eq 'Y') {
    Write-Host "`nStarting development servers..." -ForegroundColor Green
    Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "`nPress Ctrl+C to stop the servers`n" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    npm run dev
} else {
    Write-Host "`nGreat! When ready, run: npm run dev" -ForegroundColor Green
    Write-Host "Happy coding! 🚀`n" -ForegroundColor Cyan
}
