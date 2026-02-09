# ============================================
# Smart Invoice System - Windows Setup Script
# ============================================
# This script automates the setup process

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Smart Invoice Management System " -ForegroundColor Cyan
Write-Host " Windows Quick Start Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check Node.js
Write-Host "[1/6] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "✗ Node.js not found" -ForegroundColor Red
    Write-Host "`nPlease install Node.js 18+ from: https://nodejs.org" -ForegroundColor Yellow
    Write-Host "After installation, run this script again.`n" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "✓ npm installed: v$npmVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ npm not found" -ForegroundColor Red
    exit 1
}

# Check .env file
Write-Host "`n[2/6] Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path .env) {
    Write-Host "✓ .env file found" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    if (Test-Path .env.example) {
        Write-Host "Creating .env from template..." -ForegroundColor Yellow
        Copy-Item .env.example .env
        Write-Host "✓ Created .env file" -ForegroundColor Green
        
        Write-Host "`n⚠️  IMPORTANT: Configure your database connections!" -ForegroundColor Magenta
        Write-Host "   Edit the .env file and update:" -ForegroundColor White
        Write-Host "   - MONGODB_URI (MongoDB Atlas connection)" -ForegroundColor White
        Write-Host "   - POSTGRES_URI (Neon/PostgreSQL connection)" -ForegroundColor White
        Write-Host "   - JWT_SECRET (random secret key)" -ForegroundColor White
        
        Write-Host "`nOpening .env file for editing..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        notepad .env
        
        Write-Host "`nPress Enter after updating .env file..." -ForegroundColor Yellow
        Read-Host
    } else {
        Write-Host "✗ .env.example template not found" -ForegroundColor Red
        exit 1
    }
}

# Install backend dependencies
Write-Host "`n[3/6] Checking backend dependencies..." -ForegroundColor Yellow
if (-not (Test-Path node_modules)) {
    Write-Host "Installing backend dependencies (this may take a few minutes)..." -ForegroundColor Yellow
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

# Install frontend dependencies
Write-Host "`n[4/6] Checking frontend dependencies..." -ForegroundColor Yellow
if (-not (Test-Path client/node_modules)) {
    Write-Host "Installing frontend dependencies (this may take a few minutes)..." -ForegroundColor Yellow
    Push-Location client
    npm install
    Pop-Location
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to install frontend dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ Frontend dependencies already installed" -ForegroundColor Green
}

# Database seeding
Write-Host "`n[5/6] Database initialization..." -ForegroundColor Yellow
Write-Host "Would you like to seed the database now?" -ForegroundColor White
Write-Host "(Creates tables and demo users: Owner, Staff, Accountant)" -ForegroundColor Gray
Write-Host "Seed database? [Y/n]: " -NoNewline -ForegroundColor Yellow
$seedResponse = Read-Host

if ($seedResponse -eq '' -or $seedResponse -eq 'y' -or $seedResponse -eq 'Y') {
    Write-Host "`nSeeding database..." -ForegroundColor Yellow
    node server/seed.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database seeded successfully!" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  Database seeding failed" -ForegroundColor Yellow
        Write-Host "This might be due to:" -ForegroundColor White
        Write-Host "  - Incorrect database credentials in .env" -ForegroundColor White
        Write-Host "  - Database already seeded" -ForegroundColor White
        Write-Host "  - Network connectivity issues" -ForegroundColor White
        Write-Host "`nYou can run 'node server/seed.js' manually later." -ForegroundColor Yellow
    }
} else {
    Write-Host "Skipped database seeding" -ForegroundColor Gray
    Write-Host "Run 'node server/seed.js' when ready" -ForegroundColor Yellow
}

# Display completion message
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Setup Complete! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n📦 Installation Summary:" -ForegroundColor Yellow
Write-Host "   ✓ Node.js and npm verified" -ForegroundColor Green
Write-Host "   ✓ Environment configured" -ForegroundColor Green
Write-Host "   ✓ Dependencies installed" -ForegroundColor Green
Write-Host "   ✓ Ready to start!" -ForegroundColor Green

Write-Host "`n🚀 To start development servers:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White

Write-Host "`n🌐 Application URLs:" -ForegroundColor Yellow
Write-Host "   Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Backend:   http://localhost:5000" -ForegroundColor Cyan

Write-Host "`n👤 Demo Login Accounts:" -ForegroundColor Yellow
Write-Host "   Owner:      owner@invoice.com / admin123" -ForegroundColor White
Write-Host "   Staff:      staff@invoice.com / staff123" -ForegroundColor White
Write-Host "   Accountant: accountant@invoice.com / accountant123" -ForegroundColor White

Write-Host "`n📚 Documentation:" -ForegroundColor Yellow
Write-Host "   README.md           - Main documentation" -ForegroundColor White
Write-Host "   SETUP.md            - Detailed setup guide" -ForegroundColor White
Write-Host "   TROUBLESHOOTING.md  - Common issues" -ForegroundColor White

Write-Host "`n========================================`n" -ForegroundColor Cyan

# Ask to start servers
Write-Host "[6/6] Start development servers now? [Y/n]: " -NoNewline -ForegroundColor Yellow
$startNow = Read-Host

if ($startNow -eq '' -or $startNow -eq 'y' -or $startNow -eq 'Y') {
    Write-Host "`n🚀 Starting development servers..." -ForegroundColor Green
    Write-Host "   Backend:  http://localhost:5000" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "`n💡 Tip: Press Ctrl+C to stop the servers" -ForegroundColor Gray
    Write-Host "💡 Tip: Open http://localhost:5173 in your browser`n" -ForegroundColor Gray
    Start-Sleep -Seconds 2
    npm run dev
} else {
    Write-Host "`n✅ Setup complete! Run 'npm run dev' when ready to start." -ForegroundColor Green
    Write-Host "Happy coding! 🚀`n" -ForegroundColor Cyan
}
