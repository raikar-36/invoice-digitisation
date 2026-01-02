#!/bin/bash

# Quick Start Script for Smart Invoice System (Linux/macOS)
# This script helps verify your setup is working

echo ""
echo "=================================="
echo "Smart Invoice System - Quick Start"
echo "=================================="
echo ""

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js installed: $NODE_VERSION"
else
    echo "✗ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✓ npm installed: $NPM_VERSION"
else
    echo "✗ npm not found. Please install npm"
    exit 1
fi

# Check if .env exists
echo ""
echo "Checking environment configuration..."
if [ -f .env ]; then
    echo "✓ .env file found"
else
    echo "✗ .env file not found"
    echo "Creating .env from template..."
    cp .env.example .env
    echo "✓ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your database credentials!"
    echo "   - MONGODB_URI (MongoDB Atlas connection string)"
    echo "   - POSTGRES_URI (NeonDB or PostgreSQL connection string)"
    echo ""
    echo "Press Enter after updating .env..."
    read
fi

# Check if node_modules exists
echo ""
echo "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        echo "✓ Backend dependencies installed"
    else
        echo "✗ Failed to install backend dependencies"
        exit 1
    fi
else
    echo "✓ Backend dependencies already installed"
fi

if [ ! -d "client/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd client
    npm install
    cd ..
    if [ $? -eq 0 ]; then
        echo "✓ Frontend dependencies installed"
    else
        echo "✗ Failed to install frontend dependencies"
        exit 1
    fi
else
    echo "✓ Frontend dependencies already installed"
fi

# Ask if user wants to seed database
echo ""
echo "=================================="
echo "Database Setup"
echo "=================================="
echo ""
echo "Would you like to seed the database now?"
echo "(This creates initial users and tables)"
read -p "y/n: " response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Seeding database..."
    node server/seed.js
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓ Database seeded successfully!"
    else
        echo ""
        echo "✗ Database seeding failed. Check your .env credentials."
        echo "You can run 'node server/seed.js' manually later."
    fi
else
    echo "Skipping database seeding."
    echo "You can run 'node server/seed.js' later."
fi

# Display next steps
echo ""
echo "=================================="
echo "Setup Complete! 🎉"
echo "=================================="

echo ""
echo "To start the application:"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:5173"

echo ""
echo "Demo Login Accounts:"
echo "  Owner:      owner@invoice.com / admin123"
echo "  Staff:      staff@invoice.com / staff123"
echo "  Accountant: accountant@invoice.com / accountant123"

echo ""
echo "=================================="
echo ""
read -p "Would you like to start the servers now? (y/n): " startNow

if [[ "$startNow" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Starting development servers..."
    echo "Backend: http://localhost:5000"
    echo "Frontend: http://localhost:5173"
    echo ""
    echo "Press Ctrl+C to stop the servers"
    echo ""
    sleep 2
    npm run dev
else
    echo ""
    echo "Great! When ready, run: npm run dev"
    echo "Happy coding! 🚀"
    echo ""
fi
