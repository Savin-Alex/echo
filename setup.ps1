# Echo Copilot - Automated Setup Script
# For Windows (PowerShell)
# This script automates the installation steps from INSTALL_GUIDE.md

$ErrorActionPreference = "Stop"

# Functions
function Print-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
}

function Print-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Print-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Test-Command {
    param([string]$Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) {
            return $true
        }
    }
    catch {
        return $false
    }
}

# Main script starts here
Clear-Host
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗"
Write-Host "║                                                                  ║"
Write-Host "║         🚀 Echo Copilot - Automated Setup Script 🚀             ║"
Write-Host "║                                                                  ║"
Write-Host "╚══════════════════════════════════════════════════════════════════╝"
Write-Host ""

# Step 1: Check Prerequisites
Print-Header "Step 1: Checking Prerequisites"

# Check Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    Print-Success "Node.js is installed: $nodeVersion"
} else {
    Print-Error "Node.js is not installed!"
    Print-Info "Please install Node.js from: https://nodejs.org"
    Print-Info "After installation, restart PowerShell and run this script again."
    exit 1
}

# Check npm
if (Test-Command "npm") {
    $npmVersion = npm --version
    Print-Success "npm is installed: v$npmVersion"
} else {
    Print-Error "npm is not installed!"
    exit 1
}

# Check Python
$pythonCmd = $null
if (Test-Command "python") {
    $pythonCmd = "python"
} elseif (Test-Command "python3") {
    $pythonCmd = "python3"
} else {
    Print-Error "Python is not installed!"
    Print-Info "Please install Python 3.10+ from: https://www.python.org"
    Print-Info "Make sure to check 'Add Python to PATH' during installation!"
    exit 1
}

$pythonVersion = & $pythonCmd --version
Print-Success "Python is installed: $pythonVersion"

# Check Python version (should be 3.10+)
$pyVersionCheck = & $pythonCmd -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"
$pyMajor, $pyMinor = $pyVersionCheck.Split('.')
if ([int]$pyMajor -lt 3 -or ([int]$pyMajor -eq 3 -and [int]$pyMinor -lt 10)) {
    Print-Error "Python 3.10 or higher is required!"
    Print-Info "You have Python $pythonVersion"
    Print-Info "Please upgrade Python and run this script again."
    exit 1
}

# Check Git
if (Test-Command "git") {
    $gitVersion = git --version
    Print-Success "Git is installed: $gitVersion"
} else {
    Print-Error "Git is not installed!"
    Print-Info "Please install Git from: https://git-scm.com"
    exit 1
}

# Check Ollama (optional but recommended)
if (Test-Command "ollama") {
    Print-Success "Ollama is installed"
    
    # Check if llama3 model is downloaded
    $ollamaList = ollama list
    if ($ollamaList -match "llama3") {
        Print-Success "llama3 model is already downloaded"
    } else {
        Print-Warning "llama3 model is not downloaded"
        Write-Host ""
        $download = Read-Host "Would you like to download llama3 model now? (y/n)"
        if ($download -eq "y" -or $download -eq "Y") {
            Print-Info "Downloading llama3 model (this will take a few minutes)..."
            ollama pull llama3
            Print-Success "llama3 model downloaded"
        } else {
            Print-Warning "You can download it later with: ollama pull llama3"
        }
    }
} else {
    Print-Warning "Ollama is not installed"
    Print-Info "Echo will work without Ollama, but AI features will be disabled"
    Print-Info "Install Ollama from: https://ollama.com"
}

# Step 2: Install Root Dependencies
Print-Header "Step 2: Installing Root Dependencies"

Print-Info "Running: npm install"
try {
    npm install
    Print-Success "Root dependencies installed"
} catch {
    Print-Error "Failed to install root dependencies"
    exit 1
}

# Step 3: Setup Python Backend
Print-Header "Step 3: Setting Up Python Backend"

Set-Location python-workers

# Create virtual environment
Print-Info "Creating Python virtual environment..."
try {
    & $pythonCmd -m venv .venv
    Print-Success "Virtual environment created"
} catch {
    Print-Error "Failed to create virtual environment"
    exit 1
}

# Activate virtual environment
Print-Info "Activating virtual environment..."
if (Test-Path ".venv\Scripts\Activate.ps1") {
    & .venv\Scripts\Activate.ps1
    Print-Success "Virtual environment activated"
} else {
    Print-Error "Failed to activate virtual environment"
    exit 1
}

# Install Python dependencies
Print-Info "Installing Python dependencies (this may take 5-15 minutes)..."
Print-Warning "Please be patient, downloading AI libraries..."

try {
    python -m pip install --upgrade pip | Out-Null
    Print-Success "pip upgraded"
} catch {
    Print-Warning "Could not upgrade pip, continuing..."
}

try {
    pip install -r requirements.txt
    Print-Success "Python dependencies installed"
} catch {
    Print-Error "Failed to install Python dependencies"
    Print-Info "You may need to install Microsoft C++ Build Tools first"
    Print-Info "Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/"
    Print-Info "Check INSTALL_GUIDE.md for troubleshooting"
    exit 1
}

# Deactivate venv
deactivate

Set-Location ..

# Step 4: Setup Electron App
Print-Header "Step 4: Setting Up Electron App"

Set-Location electron-app

Print-Info "Installing Electron dependencies..."
try {
    npm install
    Print-Success "Electron dependencies installed"
} catch {
    Print-Error "Failed to install Electron dependencies"
    exit 1
}

# Build TypeScript
Print-Info "Building TypeScript main process..."
try {
    npm run build:main
    Print-Success "TypeScript compiled successfully"
} catch {
    Print-Error "Failed to compile TypeScript"
    exit 1
}

Set-Location ..

# Step 5: Verify Installation
Print-Header "Step 5: Verifying Installation"

# Check if all key files exist
$requiredFiles = @(
    "python-workers\.venv\Scripts\activate.ps1",
    "python-workers\requirements.txt",
    "electron-app\node_modules",
    "electron-app\dist\main\index.js",
    "node_modules"
)

$allGood = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Print-Success "Found: $file"
    } else {
        Print-Error "Missing: $file"
        $allGood = $false
    }
}

if (-not $allGood) {
    Print-Error "Installation incomplete!"
    exit 1
}

# Final success message
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗"
Write-Host "║                                                                  ║"
Write-Host "║              ✅ Installation Complete! ✅                        ║"
Write-Host "║                                                                  ║"
Write-Host "╚══════════════════════════════════════════════════════════════════╝"
Write-Host ""

Print-Header "🎉 Next Steps"
Write-Host ""
Write-Host "To start Echo Copilot:"
Write-Host ""
Write-Host "  1. Make sure Ollama is running (if installed)"
Write-Host "  2. Run this command:"
Write-Host ""
Write-Host "     npm run dev" -ForegroundColor Green
Write-Host ""
Write-Host "  3. Wait for the Electron window to open"
Write-Host "  4. Look for the green 'Connected' status"
Write-Host ""

Print-Header "📚 Documentation"
Write-Host ""
Write-Host "  • Full guide:        README.md"
Write-Host "  • Setup details:     SETUP_COMPLETE.md"
Write-Host "  • Install help:      INSTALL_GUIDE.md"
Write-Host "  • API docs:          http://127.0.0.1:8000/docs (when running)"
Write-Host ""

Print-Header "🐛 Troubleshooting"
Write-Host ""
Write-Host "If you encounter issues:"
Write-Host ""
Write-Host "  • Backend won't start:  Check python-workers\.venv is activated"
Write-Host "  • Ollama errors:        Run 'ollama serve' in another terminal"
Write-Host "  • Port conflicts:       Kill process on port 8000 or 5173"
Write-Host "  • Build errors:         Delete node_modules and run setup again"
Write-Host ""
Write-Host "For detailed troubleshooting, see INSTALL_GUIDE.md"
Write-Host ""

Print-Success "Setup complete! Run 'npm run dev' to start Echo Copilot"
Write-Host ""


