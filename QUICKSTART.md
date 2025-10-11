# 🚀 Echo Copilot - Quick Start

## ⚡ Already Installed? Start Here!

```bash
npm run dev
```

That's it! The app will open automatically.

---

## 🆕 First Time Setup?

### Option 1: Automated Setup (Recommended)

**macOS/Linux:**
```bash
./setup.sh
```

**Windows:**
```powershell
.\setup.ps1
```

### Option 2: Manual Setup

```bash
# 1. Setup Python backend
cd python-workers
python3 -m venv .venv
source .venv/bin/activate          # macOS/Linux
# .venv\Scripts\Activate.ps1       # Windows
pip install -r requirements.txt

# 2. Build Electron
cd ../electron-app
npm install
npm run build:main

# 3. Run it!
cd ..
npm run dev
```

---

## 📖 Full Guides

- **New to coding?** → Read `INSTALL_GUIDE.md` (step-by-step for beginners)
- **Want details?** → Read `README.md` (technical documentation)
- **Just installed?** → Read `READY_TO_RUN.md` (verification & testing)
- **Need automation?** → Read `QUICK_SETUP.md` (script usage)

---

## 🐛 Common Issues

### "Disconnected" Status

```bash
# Check if Ollama is running
ollama list

# If not, start it or pull a model:
ollama pull llama3
```

### Backend Won't Start

```bash
# Manually start to see errors
cd python-workers
source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Port Already in Use

```bash
# macOS/Linux
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <number> /F
```

---

## 🎯 Quick Commands

```bash
npm run dev              # Start everything
npm run dev:python       # Start only Python backend
npm run dev:electron     # Start only Electron app
npm run build            # Build for production
npm test                 # Run tests
```

---

## 📚 API Docs

While running, visit: **http://127.0.0.1:8000/docs**

---

## ✨ Features

- ✅ Text summarization
- ✅ Reply suggestions
- ✅ Multi-language (en/tr/fr)
- ✅ Privacy-first (local AI)
- ⚠️ ASR, OCR, RAG (install requirements-ai.txt)

---

**Questions?** Open an issue: https://github.com/Savin-Alex/echo/issues

