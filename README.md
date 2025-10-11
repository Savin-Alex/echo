# Echo - AI Copilot with Whisper & Ollama

Echo is a privacy-first AI copilot desktop application built with Electron, React, and FastAPI. It provides real-time transcription, AI-powered summarization, and intelligent assistance using local models.

## 🌟 Features

### Core Capabilities
- **Real-time Speech Recognition**: Local Whisper ASR with multiple model sizes
- **Local LLM Integration**: Ollama support for privacy-first text generation
- **Context Management**: Vector store with semantic search using ChromaDB
- **OCR Support**: Extract text from images with Tesseract/EasyOCR
- **Voice Analysis**: Audio quality metrics and speech characteristics
- **Privacy-First**: PII redaction, local processing, encrypted storage

### Services
- **ASR**: `/asr/transcribe`, `/asr/transcribe-file`, `/asr/models`, `/asr/status`
- **LLM**: `/llm/summarize`, `/llm/reply`, `/llm/generate`, `/llm/coaching`, `/llm/meeting-notes`
- **Context**: `/context/load`, `/context/search`, `/context/clear`, `/context/load-file`
- **OCR**: `/ocr/extract`, `/ocr/extract-file`
- **Voice**: `/voice/analyze`, `/voice/change`, `/voice/clone`

## 📋 Prerequisites

### Required
- **Node.js**: 18+ (for Electron and React)
- **Python**: 3.10+ (for FastAPI backend)
- **Ollama**: Local LLM runtime ([Install from ollama.com](https://ollama.com))

### Optional
- **Tesseract OCR**: For OCR functionality
- **CUDA/ROCm**: For GPU-accelerated inference (faster-whisper)

## 🚀 Quick Start

### 1. Install Ollama and Pull a Model

```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download

# Pull a model (llama3 recommended)
ollama pull llama3
```

### 2. Setup Python Backend

```bash
cd python-workers

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# macOS/Linux:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Setup Electron App

```bash
cd electron-app
npm install
```

### 4. Install Root Dependencies

```bash
cd ..  # Back to project root
npm install
```

## 🎮 Development

### Start Development Environment

From the project root:

```bash
# Start both Python backend and Electron app
npm run dev
```

This will:
1. Start FastAPI backend on `http://127.0.0.1:8000`
2. Start Vite dev server on `http://localhost:5173`
3. Launch Electron with hot reload

### Individual Services

```bash
# Start only Python backend
npm run dev:python

# Start only Electron app
npm run dev:electron
```

### Access API Documentation

While the backend is running, visit:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## 🏗️ Build

### Build for Production

```bash
# Build Python backend
npm run build:python

# Build Electron app
npm run build:electron

# Build everything
npm run build
```

### Create Distributables

```bash
cd electron-app

# macOS
npm run dist

# Windows (cross-compile may require additional setup)
npm run dist

# Linux
npm run dist
```

Distributables will be in `dist/` directory.

## 🧪 Testing

```bash
# Test Python backend
npm run test:python

# Test Electron app
npm run test:electron

# Test everything
npm test
```

## 📁 Project Structure

```
echo/
├── python-workers/              # FastAPI backend
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── routes/              # API endpoints
│   │   │   ├── asr.py           # Speech recognition
│   │   │   ├── llm.py           # LLM operations
│   │   │   ├── context.py       # Context management
│   │   │   ├── ocr.py           # OCR
│   │   │   └── voice.py         # Voice processing
│   │   └── core/                # Business logic
│   │       ├── asr_whisper.py   # Whisper integration
│   │       ├── llm_router.py    # Ollama client
│   │       ├── vectorstore.py   # ChromaDB
│   │       ├── embedder.py      # Sentence transformers
│   │       ├── ocr_engine.py    # Tesseract/EasyOCR
│   │       ├── voice_engine.py  # Audio analysis
│   │       └── redactor.py      # PII detection
│   └── requirements.txt
│
├── electron-app/                # Electron + React
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # App lifecycle
│   │   └── ipc/                 # IPC handlers
│   ├── preload/                 # Secure bridge
│   │   └── index.ts
│   └── renderer/                # React UI
│       ├── src/
│       │   ├── main.tsx         # React entry
│       │   ├── App.tsx          # Root component
│       │   ├── pages/           # Page components
│       │   ├── components/      # Reusable components
│       │   └── i18n.ts          # Translations
│       └── index.html
│
└── package.json                 # Root workspace config
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root (or copy `.env.example`):

```bash
# Backend
BACKEND_PORT=8000
BACKEND_HOST=127.0.0.1

# Ollama
OLLAMA_HOST=http://localhost:11434

# Whisper
WHISPER_MODEL=base
WHISPER_DEVICE=cpu

# Embeddings
EMBEDDING_MODEL=all-MiniLM-L6-v2
CHROMA_PERSIST_DIR=./data/chroma

# Privacy
LOCAL_ONLY=true
PII_REDACTION=true
```

### Whisper Models

Available models (size/accuracy trade-off):
- `tiny` - 39 MB, fastest
- `base` - 74 MB, good balance ✅
- `small` - 244 MB, better accuracy
- `medium` - 769 MB, high accuracy
- `large` - 1550 MB, best accuracy

### Ollama Models

Recommended models:
- `llama3` - Fast and capable ✅
- `mistral` - Good for reasoning
- `codellama` - Optimized for code
- `phi3` - Very lightweight

Pull models with: `ollama pull <model-name>`

## 🔧 Troubleshooting

### Backend Not Starting

**Issue**: Python backend fails to start

**Solutions**:
```bash
# Check Python version
python --version  # Should be 3.10+

# Recreate virtual environment
cd python-workers
rm -rf .venv
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### Ollama Not Connecting

**Issue**: LLM requests fail with "Ollama not available"

**Solutions**:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama (if not running)
ollama serve

# Pull a model
ollama pull llama3

# Check models
ollama list
```

### Whisper Not Loading

**Issue**: ASR requests return stub responses

**Solutions**:
```bash
# Install PyTorch with appropriate backend
# CPU-only (smaller):
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu

# CUDA (GPU):
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118

# Reinstall faster-whisper
pip install --upgrade faster-whisper
```

### Electron Won't Start

**Issue**: Electron fails to launch

**Solutions**:
```bash
# Clean and reinstall
cd electron-app
rm -rf node_modules dist
npm install
npm run build:main

# Check for errors
npm run dev:main
```

## 🌍 Internationalization

Echo supports multiple languages:
- English (en)
- Turkish (tr)
- French (fr)

Add more languages in `electron-app/renderer/src/i18n.ts`.

## 🔒 Privacy & Security

- **Local Processing**: All transcription and LLM inference happens on your device
- **PII Redaction**: Automatic detection and masking of sensitive information
- **No Telemetry**: Zero data sent to external servers
- **Encrypted Storage**: Secure credential and data storage
- **Sandboxed Renderer**: Electron security best practices

## 📝 License

ISC License - see LICENSE file

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## 📚 Documentation

- [API Documentation](http://127.0.0.1:8000/docs) (when running)
- [Architecture Guide](BUILD.md)
- [Security Improvements](SECURITY_IMPROVEMENTS.md)

## 🎯 Roadmap

- [ ] Real-time audio streaming with WebSocket
- [ ] Advanced OCR with layout analysis
- [ ] Voice cloning integration
- [ ] Multi-language ASR
- [ ] Cloud model fallback (optional)
- [ ] Session recording and replay
- [ ] Advanced analytics dashboard

---

**Made with ❤️ by CriticalSuccess**
