# 🚀 Quick Setup Scripts

Automated installation scripts for Echo Copilot. These scripts follow the steps in [INSTALL_GUIDE.md](INSTALL_GUIDE.md) automatically.

## Prerequisites

You still need to install these manually:
- **Node.js 18+** from https://nodejs.org
- **Python 3.10+** from https://www.python.org
- **Git** from https://git-scm.com
- **Ollama** (optional) from https://ollama.com

## Usage

### macOS / Linux

```bash
# Make the script executable (first time only)
chmod +x setup.sh

# Run the setup script
./setup.sh
```

### Windows (PowerShell)

```powershell
# Run PowerShell as Administrator (recommended)
# Navigate to the echo folder, then:

# If you get an execution policy error, run this first:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run the setup script
.\setup.ps1
```

### Windows (Command Prompt)

```cmd
# Run PowerShell from cmd:
powershell -ExecutionPolicy Bypass -File setup.ps1
```

## What the Scripts Do

Both scripts perform these steps automatically:

1. ✅ **Check Prerequisites**
   - Verify Node.js, Python, and Git are installed
   - Check versions meet minimum requirements
   - Check if Ollama is installed (optional)
   - Optionally download llama3 model

2. ✅ **Install Root Dependencies**
   - Run `npm install` in root directory
   - Install concurrently and other dev tools

3. ✅ **Setup Python Backend**
   - Create Python virtual environment (`.venv`)
   - Activate virtual environment
   - Install all Python dependencies from `requirements.txt`
   - This step takes 5-15 minutes (downloads AI libraries)

4. ✅ **Setup Electron App**
   - Install Electron and React dependencies
   - Compile TypeScript main process
   - Build renderer assets

5. ✅ **Verify Installation**
   - Check all required files are present
   - Confirm virtual environment is set up
   - Verify compiled JavaScript exists

## After Setup

Once the script completes successfully:

```bash
# Start Echo Copilot
npm run dev
```

Wait for:
- Python backend to start on port 8000
- Vite dev server to start on port 5173
- Electron window to open

Look for the **green "Connected" status** in the top-right corner.

## Troubleshooting

### Script Fails: "Command not found"

**Problem**: Node.js, Python, or Git not installed

**Solution**: Install the missing prerequisite, then run the script again

### Script Fails: Python version too old

**Problem**: Python version is below 3.10

**Solution**: 
1. Uninstall old Python
2. Install Python 3.10+ from python.org
3. Restart terminal/PowerShell
4. Run script again

### Script Fails: pip install errors

**macOS/Linux**:
```bash
# Install development tools
# macOS:
xcode-select --install

# Ubuntu/Debian:
sudo apt-get install python3-dev build-essential

# Run script again
./setup.sh
```

**Windows**:
1. Install Microsoft C++ Build Tools
2. Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
3. Run script again

### Script Succeeds but `npm run dev` Fails

**Backend not starting**:
```bash
# Manually start backend to see errors
cd python-workers
source .venv/bin/activate  # macOS/Linux
# or: .venv\Scripts\Activate.ps1  # Windows
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Port already in use**:
```bash
# macOS/Linux - kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Windows - kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Permission Denied (macOS/Linux)

```bash
# Make script executable
chmod +x setup.sh

# If still fails, run with bash explicitly:
bash setup.sh
```

### Execution Policy Error (Windows)

```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or run with bypass:
powershell -ExecutionPolicy Bypass -File setup.ps1
```

## Manual Setup

If the automated script doesn't work for your system, follow the detailed step-by-step guide in:

📖 **[INSTALL_GUIDE.md](INSTALL_GUIDE.md)**

## What Gets Installed

### System-wide (you install manually):
- Node.js & npm
- Python 3.10+
- Git
- Ollama (optional)

### Project-specific (script installs):
- Root npm packages (concurrently, etc.)
- Python virtual environment in `python-workers/.venv/`
- Python AI libraries (FastAPI, Whisper, ChromaDB, etc.)
- Electron & React dependencies
- TypeScript compiler output

## Directory Structure After Setup

```
echo/
├── node_modules/                    ← Root dependencies (concurrently)
├── python-workers/
│   ├── .venv/                       ← Python virtual environment ✨
│   │   ├── bin/                     (macOS/Linux)
│   │   └── Scripts/                 (Windows)
│   └── requirements.txt
├── electron-app/
│   ├── node_modules/                ← Electron dependencies
│   └── dist/
│       └── main/
│           └── index.js             ← Compiled TypeScript ✨
├── setup.sh                         ← This script (macOS/Linux)
├── setup.ps1                        ← This script (Windows)
└── package.json
```

## Time Estimates

- **Prerequisites already installed**: 5-10 minutes
- **Need to install prerequisites**: 20-30 minutes
- **Slow internet**: 15-20 minutes (Python packages are large)
- **Fast internet**: 3-5 minutes

## Success Indicators

You'll see these messages if everything worked:

```
✅ Node.js is installed: v20.10.0
✅ Python is installed: Python 3.11.5
✅ Git is installed: v2.40.0
✅ Virtual environment created
✅ Python dependencies installed
✅ Electron dependencies installed
✅ TypeScript compiled successfully

╔══════════════════════════════════════════════════════════════════╗
║              ✅ Installation Complete! ✅                        ║
╚══════════════════════════════════════════════════════════════════╝
```

## Need Help?

1. Check [INSTALL_GUIDE.md](INSTALL_GUIDE.md) for detailed troubleshooting
2. Check [README.md](README.md) for general documentation
3. Open an issue on GitHub: https://github.com/Savin-Alex/echo/issues

---

**Ready to install? Run the appropriate script above!** 🚀


