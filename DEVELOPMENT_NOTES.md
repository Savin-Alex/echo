# Development Notes for Echo Copilot

## Expected Warnings in Development Mode

### ⚠️ CSP Warning (EXPECTED - NOT AN ERROR)

When running in development mode, you will see this warning:

```
Electron Security Warning (Insecure Content-Security-Policy) 
This renderer process has either no Content Security
Policy set or a policy with "unsafe-eval" enabled.
```

**This is NORMAL and EXPECTED in development!**

**Why it appears:**
- Vite's Hot Module Replacement (HMR) requires `'unsafe-eval'` to work
- This allows instant code updates without page reload during development
- The warning message itself says: "This warning will not show up once the app is packaged"

**Security status:**
- ✅ Development: Permissive CSP for Vite HMR
- ✅ Production: Strict CSP configured in `main/index.ts`
- ✅ No security risk: Only affects development builds

**To verify CSP works in production:**
```bash
npm run build
npm run dist
# The packaged app will have strict CSP with no warnings
```

### ⚠️ Optional Library Warnings (EXPECTED)

You'll see these warnings on startup:

```
faster-whisper not installed, using stub mode
pytesseract not installed, using stub mode
sentence-transformers not installed, using stub mode
chromadb not installed, using stub mode
librosa not installed, using stub mode
```

**This is NORMAL!** These are optional AI libraries.

**What works WITHOUT these:**
- ✅ FastAPI backend
- ✅ Electron UI
- ✅ Backend health monitoring
- ✅ Settings management
- ✅ Ollama LLM integration (if Ollama installed)

**To install optional AI features:**
```bash
cd python-workers
source .venv/bin/activate
pip install -r requirements-ai.txt
```

## Actual Errors to Watch For

### ❌ REAL ERROR: Port Already in Use

```
ERROR: [Errno 48] error while attempting to bind on address ('127.0.0.1', 8000): address already in use
```

**Fix:**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
# Then restart
npm run dev
```

### ❌ REAL ERROR: Module Not Found

```
ModuleNotFoundError: No module named 'fastapi'
```

**Fix:**
```bash
cd python-workers
source .venv/bin/activate
pip install -r requirements.txt
```

### ❌ REAL ERROR: Electron Can't Find index.js

```
Cannot find module '/path/to/dist/main/index.js'
```

**Fix:**
```bash
cd electron-app
npm run build:main
```

## Development Workflow

### Normal Startup Sequence

1. **Terminal Output You'll See:**
```
[PY] INFO: Uvicorn running on http://127.0.0.1:8000
[VITE] Local: http://localhost:5173/
[ELECTRON] Electron app ready
```

2. **Browser Console (Expected):**
- ⚠️ CSP Warning (normal in dev)
- Some Electron internal warnings (normal)

3. **Application Window:**
- Should show "Echo Copilot" title
- Status badge: "Connected" (green) or "Disconnected" (red)
- Text input area
- Summarize/Reply buttons

### Verification Commands

**Check Backend:**
```bash
curl http://127.0.0.1:8000/health
# Should return: {"status":"healthy",...}
```

**Check Ollama:**
```bash
curl http://127.0.0.1:8000/llm/models
# Should list available models
```

**Check All Endpoints:**
```bash
open http://127.0.0.1:8000/docs
# Opens Swagger UI with all 22+ endpoints
```

## Hot Reload in Development

### What Auto-Reloads:

**Python Backend (uvicorn --reload):**
- ✅ Changes to any `.py` file in `python-workers/app/`
- ✅ Automatic server restart
- ✅ See reload message in terminal

**React Frontend (Vite HMR):**
- ✅ Changes to any `.tsx`, `.ts`, `.css` in `renderer/src/`
- ✅ Instant browser update (no page reload)
- ✅ State preserved during updates

**Electron Main Process:**
- ❌ Does NOT auto-reload
- Manual: Stop (Ctrl+C) → `npm run dev` to restart

### Making Changes

**To edit Python backend:**
1. Edit files in `python-workers/app/`
2. Save
3. See "[PY] INFO: ... detected changes, reloading"
4. Test immediately

**To edit React UI:**
1. Edit files in `electron-app/renderer/src/`
2. Save
3. See "[VITE] ... hmr update ..."
4. UI updates instantly

**To edit Electron main:**
1. Edit files in `electron-app/main/`
2. Save
3. Stop app (Ctrl+C)
4. Rebuild: `cd electron-app && npm run build:main`
5. Restart: `cd .. && npm run dev`

## Performance Notes

### Startup Time
- **Cold start**: 5-10 seconds
- **After changes**: < 1 second (hot reload)
- **TypeScript rebuild**: 1-2 seconds

### Memory Usage
- **Python backend**: ~100-200 MB (without AI libs)
- **Python backend**: ~500MB-2GB (with Whisper/embeddings)
- **Electron + React**: ~200-400 MB
- **Total**: ~300-600 MB minimal, ~1-3 GB with full AI

### CPU Usage
- **Idle**: < 5%
- **During LLM generation**: 50-100% (one core)
- **During transcription**: Depends on Whisper model

## Debugging Tips

### Backend Not Responding

```bash
# Check if process is running
ps aux | grep uvicorn

# Check logs manually
cd python-workers
source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
# Watch for errors
```

### Frontend Not Loading

```bash
# Check if Vite is running
ps aux | grep vite

# Start Vite manually
cd electron-app/renderer
npx vite
# Open http://localhost:5173 in browser to see if it works
```

### Electron Window Empty/Black

**Possible causes:**
1. Vite server not running → Check above
2. Wrong URL in main/index.ts → Should be http://localhost:5173
3. React errors → Check browser console (F12)

## Common Development Scenarios

### Scenario: "I changed Python code but nothing happens"

**Check:**
1. Is uvicorn showing "detected changes, reloading"?
2. Are there Python syntax errors in terminal?
3. Is the file saved?

### Scenario: "I changed React code but UI doesn't update"

**Check:**
1. Is Vite showing HMR update message?
2. Is the file in `renderer/src/`?
3. Check browser console for errors

### Scenario: "Backend shows 'Disconnected'"

**Fixes:**
1. Wait 5-10 seconds (backend might still be starting)
2. Check terminal for Python errors
3. Try manual health check: `curl http://127.0.0.1:8000/health`
4. If still failing, restart: Ctrl+C then `npm run dev`

## Production Build

### Create Production Build

```bash
# Build everything
npm run build

# Create distributable
cd electron-app
npm run dist
```

**Result:**
- macOS: `.dmg` and `.zip` in `dist/` folder
- Windows: `.exe` installer in `dist/`
- Linux: `.AppImage`, `.deb`, `.rpm` in `dist/`

**Production CSP:**
- ✅ No 'unsafe-eval'
- ✅ No CSP warnings
- ✅ Strict security policy
- ✅ All features work normally

## Summary

**Warnings in Development:**
- CSP Warning → Expected (Vite HMR needs it)
- Optional library warnings → Expected (AI features are optional)
- Autofill errors → Expected (Electron DevTools, harmless)

**Actual Errors:**
- Port conflicts → Kill processes and restart
- Module not found → Install dependencies
- Build errors → Check syntax and TypeScript

**The app is working correctly if you see:**
- ✅ Green "Connected" status
- ✅ Can type text and get responses (with Ollama)
- ✅ Language switcher works
- ✅ No red error messages in terminal

---

**TL;DR**: CSP warning in dev mode is NORMAL and SAFE. It will disappear in production builds.

