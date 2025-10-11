#!/bin/bash

# Echo Copilot - Automated Setup Script
# For macOS and Linux
# This script automates the installation steps from INSTALL_GUIDE.md

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}$1${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Main script starts here
clear
echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║         🚀 Echo Copilot - Automated Setup Script 🚀             ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Check Prerequisites
print_header "Step 1: Checking Prerequisites"

# Check Node.js
if check_command node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js is installed: $NODE_VERSION"
else
    print_error "Node.js is not installed!"
    print_info "Please install Node.js from: https://nodejs.org"
    print_info "After installation, run this script again."
    exit 1
fi

# Check npm
if check_command npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm is installed: v$NPM_VERSION"
else
    print_error "npm is not installed!"
    exit 1
fi

# Check Python
PYTHON_CMD=""
if check_command python3; then
    PYTHON_CMD="python3"
elif check_command python; then
    PYTHON_CMD="python"
else
    print_error "Python is not installed!"
    print_info "Please install Python 3.10+ from: https://www.python.org"
    exit 1
fi

PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
print_success "Python is installed: $PYTHON_VERSION"

# Check Python version (should be 3.10+)
PYTHON_MAJOR=$($PYTHON_CMD -c 'import sys; print(sys.version_info.major)')
PYTHON_MINOR=$($PYTHON_CMD -c 'import sys; print(sys.version_info.minor)')

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 10 ]); then
    print_error "Python 3.10 or higher is required!"
    print_info "You have Python $PYTHON_VERSION"
    print_info "Please upgrade Python and run this script again."
    exit 1
fi

# Check Git
if check_command git; then
    GIT_VERSION=$(git --version | awk '{print $3}')
    print_success "Git is installed: v$GIT_VERSION"
else
    print_error "Git is not installed!"
    print_info "Please install Git from: https://git-scm.com"
    exit 1
fi

# Check Ollama (optional but recommended)
if check_command ollama; then
    print_success "Ollama is installed"
    
    # Check if llama3 model is downloaded
    if ollama list | grep -q "llama3"; then
        print_success "llama3 model is already downloaded"
    else
        print_warning "llama3 model is not downloaded"
        echo ""
        read -p "Would you like to download llama3 model now? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Downloading llama3 model (this will take a few minutes)..."
            ollama pull llama3
            print_success "llama3 model downloaded"
        else
            print_warning "You can download it later with: ollama pull llama3"
        fi
    fi
else
    print_warning "Ollama is not installed"
    print_info "Echo will work without Ollama, but AI features will be disabled"
    print_info "Install Ollama from: https://ollama.com"
fi

# Step 2: Install Root Dependencies
print_header "Step 2: Installing Root Dependencies"

print_info "Running: npm install"
if npm install; then
    print_success "Root dependencies installed"
else
    print_error "Failed to install root dependencies"
    exit 1
fi

# Step 3: Setup Python Backend
print_header "Step 3: Setting Up Python Backend"

cd python-workers

# Create virtual environment
print_info "Creating Python virtual environment..."
if $PYTHON_CMD -m venv .venv; then
    print_success "Virtual environment created"
else
    print_error "Failed to create virtual environment"
    exit 1
fi

# Activate virtual environment
print_info "Activating virtual environment..."
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
    print_success "Virtual environment activated"
else
    print_error "Failed to activate virtual environment"
    exit 1
fi

# Install Python dependencies
print_info "Installing Python dependencies (this may take 5-15 minutes)..."
print_warning "Please be patient, downloading AI libraries..."

if pip install --upgrade pip > /dev/null 2>&1; then
    print_success "pip upgraded"
fi

if pip install -r requirements.txt; then
    print_success "Python dependencies installed"
else
    print_error "Failed to install Python dependencies"
    print_info "You may need to install system dependencies first"
    print_info "Check INSTALL_GUIDE.md for troubleshooting"
    exit 1
fi

# Deactivate venv
deactivate

cd ..

# Step 4: Setup Electron App
print_header "Step 4: Setting Up Electron App"

cd electron-app

print_info "Installing Electron dependencies..."
if npm install; then
    print_success "Electron dependencies installed"
else
    print_error "Failed to install Electron dependencies"
    exit 1
fi

# Build TypeScript
print_info "Building TypeScript main process..."
if npm run build:main; then
    print_success "TypeScript compiled successfully"
else
    print_error "Failed to compile TypeScript"
    exit 1
fi

cd ..

# Step 5: Verify Installation
print_header "Step 5: Verifying Installation"

# Check if all key files exist
declare -a required_files=(
    "python-workers/.venv/bin/activate"
    "python-workers/requirements.txt"
    "electron-app/node_modules"
    "electron-app/dist/main/index.js"
    "node_modules"
)

all_good=true
for file in "${required_files[@]}"; do
    if [ -e "$file" ]; then
        print_success "Found: $file"
    else
        print_error "Missing: $file"
        all_good=false
    fi
done

if [ "$all_good" = false ]; then
    print_error "Installation incomplete!"
    exit 1
fi

# Final success message
echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║              ✅ Installation Complete! ✅                        ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

print_header "🎉 Next Steps"
echo ""
echo "To start Echo Copilot:"
echo ""
echo "  1. Make sure Ollama is running (if installed)"
echo "  2. Run this command:"
echo ""
echo -e "     ${GREEN}npm run dev${NC}"
echo ""
echo "  3. Wait for the Electron window to open"
echo "  4. Look for the green 'Connected' status"
echo ""

print_header "📚 Documentation"
echo ""
echo "  • Full guide:        README.md"
echo "  • Setup details:     SETUP_COMPLETE.md"
echo "  • Install help:      INSTALL_GUIDE.md"
echo "  • API docs:          http://127.0.0.1:8000/docs (when running)"
echo ""

print_header "🐛 Troubleshooting"
echo ""
echo "If you encounter issues:"
echo ""
echo "  • Backend won't start:  Check python-workers/.venv is activated"
echo "  • Ollama errors:        Run 'ollama serve' in another terminal"
echo "  • Port conflicts:       Kill process on port 8000 or 5173"
echo "  • Build errors:         Delete node_modules and run setup again"
echo ""
echo "For detailed troubleshooting, see INSTALL_GUIDE.md"
echo ""

print_success "Setup complete! Run 'npm run dev' to start Echo Copilot"
echo ""


