#!/bin/bash

# ============================================
# Smart Invoice System - Linux/macOS Setup
# ============================================
# This script automates the setup process

echo ""
echo "========================================"
echo " Smart Invoice Management System"
echo " Linux/macOS Quick Start Script"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check Node.js
echo -e "${YELLOW}[1/6] Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js not found${NC}"
    echo ""
    echo -e "${YELLOW}Please install Node.js 18+ from: https://nodejs.org${NC}"
    echo -e "${YELLOW}After installation, run this script again.${NC}"
    echo ""
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ npm installed: v$NPM_VERSION${NC}"
else
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi

# Check .env file
echo ""
echo -e "${YELLOW}[2/6] Checking environment configuration...${NC}"
if [ -f .env ]; then
    echo -e "${GREEN}✓ .env file found${NC}"
else
    echo -e "${RED}✗ .env file not found${NC}"
    if [ -f .env.example ]; then
        echo -e "${YELLOW}Creating .env from template...${NC}"
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env file${NC}"
        
        echo ""
        echo -e "${CYAN}⚠️  IMPORTANT: Configure your database connections!${NC}"
        echo "   Edit the .env file and update:"
        echo "   - MONGODB_URI (MongoDB Atlas connection)"
        echo "   - POSTGRES_URI (Neon/PostgreSQL connection)"
        echo "   - JWT_SECRET (random secret key)"
        echo ""
        echo -e "${YELLOW}Opening .env file for editing...${NC}"
        echo -e "${YELLOW}Press Enter after updating .env file...${NC}"
        
        # Try to open with default editor
        if command -v nano &> /dev/null; then
            nano .env
        elif command -v vim &> /dev/null; then
            vim .env
        else
            echo "Please edit .env manually"
            read -p ""
        fi
    else
        echo -e "${RED}✗ .env.example template not found${NC}"
        exit 1
    fi
fi

# Install backend dependencies
echo ""
echo -e "${YELLOW}[3/6] Checking backend dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies (this may take a few minutes)...${NC}"
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backend dependencies installed${NC}"
    else
        echo -e "${RED}✗ Failed to install backend dependencies${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi

# Install frontend dependencies
echo ""
echo -e "${YELLOW}[4/6] Checking frontend dependencies...${NC}"
if [ ! -d "client/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies (this may take a few minutes)...${NC}"
    cd client
    npm install
    cd ..
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
    else
        echo -e "${RED}✗ Failed to install frontend dependencies${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

# Database seeding
echo ""
echo -e "${YELLOW}[5/6] Database initialization...${NC}"
echo "Would you like to seed the database now?"
echo "(Creates tables and demo users: Owner, Staff, Accountant)"
read -p "Seed database? [Y/n]: " seedResponse

if [[ "$seedResponse" == "" || "$seedResponse" =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}Seeding database...${NC}"
    node server/seed.js
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Database seeded successfully!${NC}"
    else
        echo ""
        echo -e "${YELLOW}⚠️  Database seeding failed${NC}"
        echo "This might be due to:"
        echo "  - Incorrect database credentials in .env"
        echo "  - Database already seeded"
        echo "  - Network connectivity issues"
        echo ""
        echo -e "${YELLOW}You can run 'node server/seed.js' manually later.${NC}"
    fi
else
    echo -e "${NC}Skipped database seeding${NC}"
    echo -e "${YELLOW}Run 'node server/seed.js' when ready${NC}"
fi

# Display completion message
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN} Setup Complete! 🎉${NC}"
echo -e "${CYAN}========================================${NC}"

echo ""
echo -e "${YELLOW}📦 Installation Summary:${NC}"
echo -e "${GREEN}   ✓ Node.js and npm verified${NC}"
echo -e "${GREEN}   ✓ Environment configured${NC}"
echo -e "${GREEN}   ✓ Dependencies installed${NC}"
echo -e "${GREEN}   ✓ Ready to start!${NC}"

echo ""
echo -e "${YELLOW}🚀 To start development servers:${NC}"
echo "   npm run dev"

echo ""
echo -e "${YELLOW}🌐 Application URLs:${NC}"
echo -e "${CYAN}   Frontend:  http://localhost:5173${NC}"
echo -e "${CYAN}   Backend:   http://localhost:5000${NC}"

echo ""
echo -e "${YELLOW}👤 Demo Login Accounts:${NC}"
echo "   Owner:      owner@invoice.com / admin123"
echo "   Staff:      staff@invoice.com / staff123"
echo "   Accountant: accountant@invoice.com / accountant123"

echo ""
echo -e "${YELLOW}📚 Documentation:${NC}"
echo "   README.md           - Main documentation"
echo "   SETUP.md            - Detailed setup guide"
echo "   TROUBLESHOOTING.md  - Common issues"

echo ""
echo -e "${CYAN}========================================${NC}"
echo ""

# Ask to start servers
read -p "[6/6] Start development servers now? [Y/n]: " startNow

if [[ "$startNow" == "" || "$startNow" =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${GREEN}🚀 Starting development servers...${NC}"
    echo -e "${CYAN}   Backend:  http://localhost:5000${NC}"
    echo -e "${CYAN}   Frontend: http://localhost:5173${NC}"
    echo ""
    echo -e "${NC}💡 Tip: Press Ctrl+C to stop the servers${NC}"
    echo -e "${NC}💡 Tip: Open http://localhost:5173 in your browser${NC}"
    echo ""
    sleep 2
    npm run dev
else
    echo ""
    echo -e "${GREEN}✅ Setup complete! Run 'npm run dev' when ready to start.${NC}"
    echo -e "${CYAN}Happy coding! 🚀${NC}"
    echo ""
fi
