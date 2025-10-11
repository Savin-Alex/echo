# 🚀 Echo Copilot - Complete Installation Guide for Beginners

This guide will walk you through installing Echo Copilot from scratch, even if you've never used terminal commands before. Follow each step carefully and don't skip ahead!

## 📋 What You'll Install

1. **Node.js** - Runs JavaScript on your computer (for Electron)
2. **Python** - Programming language for AI backend
3. **Ollama** - Local AI model runner
4. **Echo Copilot** - This application

**Time Required**: 30-45 minutes  
**Internet Required**: Yes (for downloads)  
**Difficulty**: Beginner-friendly

---

## ✅ Step 1: Check What You Already Have

### 1.1 Open Terminal

**On macOS:**
1. Press `Command + Space` (⌘ + Space)
2. Type "Terminal"
3. Press Enter
4. A black or white window will open - this is your terminal

**On Windows:**
1. Press `Windows Key + R`
2. Type "cmd"
3. Press Enter
4. A black window will open - this is your command prompt

### 1.2 Check if Node.js is Installed

In the terminal, type this **exactly** and press Enter:
```bash
node --version
```

**What you might see:**
- ✅ If you see something like `v18.17.0` or `v20.10.0` → **Node.js is installed!** Skip to Step 2.
- ❌ If you see `command not found` → **Continue to 1.3 below**

### 1.3 Check if Python is Installed

Type this and press Enter:
```bash
python3 --version
```

**What you might see:**
- ✅ If you see something like `Python 3.10.11` or `Python 3.11.5` → **Python is installed!** Skip to Step 3.
- ❌ If you see `command not found` → **Continue to Step 2**

---

## 📦 Step 2: Install Node.js

### 2.1 Download Node.js

1. **Open your web browser** (Chrome, Safari, Firefox, etc.)
2. Go to: https://nodejs.org
3. You'll see **two big green buttons**
4. Click the **left button** that says "LTS" (Long Term Support)
   - Example: "20.10.0 LTS Recommended For Most Users"

### 2.2 Install Node.js

**On macOS:**
1. Find the downloaded file (usually in Downloads folder)
2. Double-click the `.pkg` file
3. Click "Continue" → "Continue" → "Agree" → "Install"
4. Enter your Mac password when asked
5. Click "Close" when done

**On Windows:**
1. Find the downloaded `.msi` file in Downloads
2. Double-click it
3. Click "Next" → "Next" → "Next" → "Install"
4. Click "Finish" when done

### 2.3 Verify Node.js Installation

1. **Close your terminal window** (this is important!)
2. **Open a NEW terminal window** (follow Step 1.1 again)
3. Type this:
```bash
node --version
```
4. You should now see a version number like `v20.10.0`
5. ✅ **Success!** Node.js is installed

---

## 🐍 Step 3: Install Python

### 3.1 Download Python

1. Go to: https://www.python.org/downloads/
2. Click the big yellow button "Download Python 3.x.x"
3. **Make sure it's version 3.10 or higher** (not 2.7!)

### 3.2 Install Python

**On macOS:**
1. Find the downloaded `.pkg` file
2. Double-click it
3. Click "Continue" through the installer
4. **IMPORTANT**: On the last screen, click "Install Certificates.command"
   - This opens a terminal window that runs automatically
   - Wait for it to say "Done"

**On Windows:**
1. Find the downloaded `.exe` file
2. Double-click it
3. **IMPORTANT**: Check the box "Add Python to PATH" at the bottom!
4. Click "Install Now"
5. Wait for installation to complete
6. Click "Close"

### 3.3 Verify Python Installation

1. **Close terminal and open a NEW one**
2. Type:
```bash
python3 --version
```
3. On Windows, you might need to try:
```bash
python --version
```
4. You should see `Python 3.10.x` or higher
5. ✅ **Success!** Python is installed

---

## 🤖 Step 4: Install Ollama (Local AI)

Ollama lets AI models run on your computer privately without sending data to the cloud.

### 4.1 Download Ollama

**On macOS:**
1. Go to: https://ollama.com/download
2. Click "Download for macOS"
3. Wait for the download (it's about 500MB)

**On Windows:**
1. Go to: https://ollama.com/download
2. Click "Download for Windows"
3. Wait for the download

**On Linux:**
1. Open terminal and run:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 4.2 Install Ollama

**On macOS:**
1. Find the downloaded `.zip` file
2. Double-click to unzip it
3. Drag "Ollama.app" to your Applications folder
4. Open Applications folder
5. Double-click Ollama
6. If you see "Ollama is from an unidentified developer":
   - Right-click Ollama
   - Click "Open"
   - Click "Open" again
7. You'll see a llama icon in your menu bar (top right) → **Ollama is running!**

**On Windows:**
1. Double-click the downloaded `OllamaSetup.exe`
2. Follow the installation wizard
3. Ollama will start automatically
4. You'll see an icon in your system tray → **Ollama is running!**

### 4.3 Download an AI Model

Now we'll download the AI brain that Echo will use.

1. Open terminal
2. Type this command and press Enter:
```bash
ollama pull llama3
```

3. **Wait patiently** - This downloads about 4GB
4. You'll see a progress bar:
```
pulling manifest
pulling 6a0746a1ec1a... 100% ▕████████████████▏ 4.7 GB
```

5. When it says "success" → ✅ **Done!**

### 4.4 Test Ollama

Let's make sure it works:
```bash
ollama list
```

You should see something like:
```
NAME            ID              SIZE      MODIFIED
llama3:latest   6a0746a1ec1a    4.7 GB    2 minutes ago
```

✅ **Perfect!** Ollama is ready.

---

## 💻 Step 5: Download Echo Copilot

### 5.1 Install Git (if you don't have it)

Check if you have Git:
```bash
git --version
```

If you see a version number → Skip to 5.2

If not:
- **macOS**: Git is usually included. If not, go to https://git-scm.com/download/mac
- **Windows**: Download from https://git-scm.com/download/win and install

### 5.2 Choose Installation Folder

We'll install Echo in a folder you can easily find.

**On macOS:**
```bash
cd ~/Documents
```

**On Windows:**
```bash
cd %USERPROFILE%\Documents
```

### 5.3 Download Echo

Type this command:
```bash
git clone https://github.com/Savin-Alex/echo.git
```

You'll see:
```
Cloning into 'echo'...
remote: Counting objects...
Receiving objects: 100% ...
```

When it finishes, type:
```bash
cd echo
```

You're now **inside** the Echo folder!

---

## 🔧 Step 6: Install Echo's Dependencies

### 6.1 Install Node.js Packages (Frontend)

Type this:
```bash
npm install
```

**What you'll see:**
- Lots of text scrolling by
- Lines like "added 397 packages"
- This takes **2-5 minutes**

**If you see errors about Python or node-gyp:**
- Don't worry! These are optional packages
- As long as it says "added X packages" at the end, you're fine

✅ When it finishes → **Frontend installed!**

---

## 🐍 Step 7: Setup Python Backend

### 7.1 Go to Python Folder

Type:
```bash
cd python-workers
```

### 7.2 Create Python Virtual Environment

A "virtual environment" keeps Echo's Python packages separate from your system.

**On macOS/Linux:**
```bash
python3 -m venv .venv
```

**On Windows:**
```bash
python -m venv .venv
```

**What happens:**
- Creates a `.venv` folder (you won't see much output)
- Takes 10-30 seconds

### 7.3 Activate Virtual Environment

This tells your terminal to use Echo's Python, not the system one.

**On macOS/Linux:**
```bash
source .venv/bin/activate
```

**On Windows (Command Prompt):**
```bash
.venv\Scripts\activate
```

**On Windows (PowerShell):**
```bash
.venv\Scripts\Activate.ps1
```

**How to know it worked:**
- Your terminal prompt will change
- You'll see `(.venv)` at the beginning of the line
- Example: `(.venv) alex@mac python-workers %`

✅ If you see `(.venv)` → **Success!**

### 7.4 Install Python Packages

**⚠️ IMPORTANT**: Make sure you see `(.venv)` in your prompt before running this!

Type:
```bash
pip install -r requirements.txt
```

**What happens:**
- Downloads and installs AI libraries
- **This is SLOW** - takes 5-15 minutes depending on internet
- You'll see lots of:
  - "Collecting package-name..."
  - "Downloading package-name..."
  - "Installing package-name..."

**Common things you might see:**
- ⚠️ Yellow warnings about pip version → **Ignore these**
- ⚠️ Warnings about dependencies → **Usually fine**
- ❌ RED errors → **Stop and ask for help**

**When finished, you'll see:**
```
Successfully installed fastapi-0.109.0 uvicorn-0.27.0 ... (and many more)
```

✅ **Done!** Python backend is ready.

---

## 🎯 Step 8: Build the Application

### 8.1 Go Back to Main Folder

Type:
```bash
cd ..
```

You should now be in the `echo` folder (not `python-workers`).

Verify by typing:
```bash
pwd
```

Should show something ending in `/echo` or `\echo`

### 8.2 Go to Electron Folder

Type:
```bash
cd electron-app
```

### 8.3 Install Electron Dependencies

Type:
```bash
npm install
```

Wait for it to finish (1-2 minutes).

### 8.4 Build the Electron Main Process

This compiles the TypeScript code to JavaScript.

Type:
```bash
npm run build:main
```

**What you'll see:**
- Might see some warnings → **Ignore them**
- Should finish quickly (5-10 seconds)
- No errors → ✅ **Success!**

---

## 🚀 Step 9: Run Echo Copilot!

### 9.1 Go Back to Main Folder

Type:
```bash
cd ..
```

You're now back in the main `echo` folder.

### 9.2 Start Echo

**This is the moment! 🎉**

Type:
```bash
npm run dev
```

**What happens:**
1. Terminal shows lots of output
2. You'll see:
   ```
   [PY] INFO: Started server process
   [PY] INFO: Uvicorn running on http://127.0.0.1:8000
   [ELECTRON] Electron app ready
   ```
3. **A window opens** - This is Echo Copilot!

### 9.3 What You Should See

In the Echo window:
- **Title**: "Echo Copilot" at the top
- **Status Badge**: Shows "Connected" with a green dot (●) or "Disconnected" with red (○)
- **Controls**: Start/Stop buttons and language selector
- **Text Area**: Big box where you can type
- **Buttons**: "Summarize" and "Reply"

---

## ✅ Step 10: Test It!

### 10.1 Wait for Green Status

1. Look at the top-right corner
2. Wait until you see **green dot (●) and "Connected"**
3. If it stays red after 30 seconds, see Troubleshooting below

### 10.2 Test Summarization

1. In the text area, type or paste:
```
We had a great meeting today. John suggested we move the deadline to next Friday. 
Sarah agreed and will update the project plan. Mike will review the budget and 
send us his feedback by Wednesday. Everyone was happy with the progress we've made.
```

2. Click the **"Summarize"** button
3. Wait 5-10 seconds
4. Below, you should see bullet points summarizing the text!

Example output:
```
• Deadline moved to next Friday
• Sarah to update project plan
• Mike reviewing budget, feedback by Wednesday
• Team satisfied with progress
```

✅ **IT WORKS!** You've successfully installed Echo Copilot!

---

## 🎊 Success! What Now?

### Daily Usage

**To start Echo in the future:**

1. Open terminal
2. Navigate to Echo folder:
   ```bash
   cd ~/Documents/echo
   ```
   (or wherever you installed it)
3. Run:
   ```bash
   npm run dev
   ```
4. Wait for the window to open
5. Look for green "Connected" status

**To stop Echo:**
- Press `Ctrl + C` in the terminal
- Or close the Echo window

### Features to Try

1. **Change Language**: Use dropdown to switch to Turkish or French
2. **Reply Suggestions**: Type a message and click "Reply" for response ideas
3. **Different Text**: Try summarizing different types of content

### Next Steps

- Read `README.md` for advanced features
- Check `SETUP_COMPLETE.md` for architecture details
- Visit http://127.0.0.1:8000/docs for API documentation (when running)

---

## 🐛 Troubleshooting Common Issues

### Issue: "Command not found" errors

**Solution:**
1. Make sure you installed Node.js and Python
2. Close terminal and open a NEW one
3. Try the commands again

### Issue: Red "Disconnected" status won't turn green

**Possible causes and fixes:**

**1. Python backend didn't start:**
- Look at terminal output
- Look for lines like `[PY] INFO: Uvicorn running`
- If you don't see these, the Python backend failed

**Fix:**
```bash
# Stop Echo (Ctrl+C in terminal)
# Go to python-workers folder
cd python-workers
# Activate venv
source .venv/bin/activate  # macOS/Linux
# or: .venv\Scripts\activate  # Windows
# Try starting backend manually
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

If you see errors here, read the error message carefully.

**2. Port 8000 already in use:**

**Fix:**
```bash
# Kill whatever is using port 8000
# macOS/Linux:
lsof -ti:8000 | xargs kill -9
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**3. Ollama not running:**

**Fix:**
- macOS: Open Ollama from Applications
- Windows: Start Ollama from Start Menu
- Linux: `ollama serve`

### Issue: Python packages won't install

**Error**: "pip: command not found"

**Fix:**
```bash
# Make sure you're in virtual environment
# You should see (.venv) in prompt
# If not, activate it:
source .venv/bin/activate  # macOS/Linux
.venv\Scripts\activate     # Windows
```

**Error**: "Microsoft Visual C++ required" (Windows)

**Fix:**
- Download "Microsoft C++ Build Tools"
- Go to: https://visualstudio.microsoft.com/visual-cpp-build-tools/
- Install it, then try `pip install -r requirements.txt` again

### Issue: Electron won't start

**Error**: "Cannot find module ..."

**Fix:**
```bash
cd electron-app
rm -rf node_modules
npm install
npm run build:main
cd ..
npm run dev
```

### Issue: Summarize/Reply does nothing

**Check:**
1. Is Ollama running? (Check for llama icon in menu bar/system tray)
2. Did you download the llama3 model? Run: `ollama list`
3. Is backend connected? (Green dot at top)

**Fix if Ollama missing model:**
```bash
ollama pull llama3
# Wait for download to complete
# Restart Echo
```

### Issue: Permission errors on macOS

**Error**: "Operation not permitted"

**Fix:**
1. Open System Preferences → Security & Privacy
2. Click "Privacy" tab
3. Select "Full Disk Access" on left
4. Click the lock to make changes
5. Add Terminal to the list
6. Restart terminal and try again

### Issue: Python version too old

**Error**: "Python 3.10 or higher required"

**Fix:**
- Uninstall old Python
- Download latest from python.org (3.10+)
- Install it
- Start over from Step 7

---

## 📞 Getting Help

### Before Asking for Help

1. Read the error message carefully
2. Check Troubleshooting section above
3. Try restarting your computer
4. Make sure all installs completed

### Where to Get Help

- **GitHub Issues**: https://github.com/Savin-Alex/echo/issues
- Include:
  - Your operating system (macOS/Windows/Linux)
  - Node version: `node --version`
  - Python version: `python3 --version`
  - The exact error message
  - What step you're on

### Useful Debug Commands

Check what's running:
```bash
# Check if Python backend is running
curl http://127.0.0.1:8000/health

# Check Ollama
ollama list

# Check Node.js
node --version

# Check Python
python3 --version
```

---

## 🎓 Understanding What You Installed

### For Learning

**Node.js (npm)**:
- Runs JavaScript on your computer
- Used by Electron (the window/app)
- Used by React (the user interface)

**Python**:
- Programming language
- Runs the AI backend (FastAPI)
- Handles all AI processing

**Ollama**:
- Runs AI models locally
- Like ChatGPT but on your computer
- Privacy-first (no data leaves your machine)

**Echo Copilot**:
- The actual application
- Frontend (what you see): React + Electron
- Backend (AI processing): Python + FastAPI
- AI brain: Ollama + Llama3

### Folder Structure Explained

```
echo/
├── electron-app/        ← The application window and UI
├── python-workers/      ← The AI backend (Python)
├── archive/             ← Backup of old code
└── package.json         ← Configuration file
```

When you run `npm run dev`:
1. Starts Python backend (port 8000)
2. Starts React dev server (port 5173)  
3. Opens Electron window
4. Electron connects to Python backend
5. You see the UI and can use the app!

---

## ✅ Checklist: Am I Ready?

Before running Echo, make sure:

- [ ] Node.js installed (`node --version` works)
- [ ] Python 3.10+ installed (`python3 --version` works)
- [ ] Ollama installed (llama icon visible)
- [ ] Llama3 model downloaded (`ollama list` shows it)
- [ ] Echo code downloaded (you have an `echo` folder)
- [ ] npm packages installed (ran `npm install` in main folder)
- [ ] Python packages installed (ran `pip install -r requirements.txt`)
- [ ] Electron built (ran `npm run build:main` in electron-app)

If all checked ✅ → Run `npm run dev` and enjoy!

---

**🎉 Congratulations!** You've successfully installed Echo Copilot!

You're now running a privacy-first AI assistant entirely on your own computer.

**Happy chatting with your local AI! 🤖**

