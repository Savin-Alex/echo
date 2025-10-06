# Echo - AI Interview, Meeting & Workplace Copilot

Echo is a privacy-first desktop application that provides real-time AI assistance during interviews, meetings, and workplace conversations. Built with Electron, it features local speech recognition, multiple LLM providers, and a stealth overlay interface.

## Features

### 🎯 Real-Time AI Assistance
- **Live Transcription**: Local Whisper ASR with streaming partials
- **Context-Aware Suggestions**: AI-powered responses based on conversation context
- **Multiple LLM Providers**: Support for OpenAI GPT, Anthropic Claude, and Google Gemini
- **Stealth Overlay**: Transparent window that stays on top without appearing in screen shares

### 🎤 Audio & Speech Processing
- **System Audio Capture**: Records audio from video calls (Zoom, Teams, Meet, etc.)
- **Microphone Support**: Direct microphone input for better audio quality
- **Real-Time Coaching**: Live feedback on speaking pace, clarity, and confidence
- **Privacy-First**: All transcription happens locally by default

### 💼 Workplace Integration
- **Jira Integration**: Improve issue descriptions and acceptance criteria
- **Confluence Support**: Generate summaries and structure documentation
- **Messenger Integration**: Inline suggestions for Telegram, WhatsApp, Slack
- **Post-Session Analytics**: Detailed performance metrics and summaries

### 🔒 Privacy & Security
- **Local-First Architecture**: Data stays on your device
- **Encrypted Storage**: AES-256 encryption for all sensitive data
- **PII Redaction**: Automatic removal of personal information before LLM calls
- **Configurable Retention**: Control how long data is stored

## Installation

### Prerequisites
- Node.js 18+ 
- macOS 12+ or Windows 10/11
- Microphone and screen recording permissions

### Setup
```bash
# Clone the repository
git clone https://github.com/criticalsuccess/echo.git
cd echo

# Install dependencies
npm install

# Start the application
npm start
```

### First-Time Setup
1. **Grant Permissions**: Allow microphone and screen recording access when prompted
2. **Configure LLM**: Set up API keys for your preferred LLM provider
3. **Upload Resume**: Add your resume and job description for better context
4. **Test Audio**: Verify audio capture is working properly

## Usage

### Global Shortcuts
- `Alt+Shift+E`: Toggle overlay visibility
- `Alt+Shift+S`: Request AI suggestions
- `Alt+Shift+W`: Perform web lookup
- `Alt+Shift+R`: Start new session
- `Alt+Shift+T`: Stop current session
- `Alt+Shift+M`: Toggle stealth mode
- `Alt+Shift+?`: Show all shortcuts

### Basic Workflow
1. **Start Session**: Press `Alt+Shift+R` or use the menu to begin
2. **Join Your Call**: Start your interview, meeting, or conversation
3. **Get Suggestions**: Press `Alt+Shift+S` when you need help
4. **View Coaching**: Real-time feedback appears automatically
5. **End Session**: Press `Alt+Shift+T` to stop and generate summary

### Stealth Mode
Enable stealth mode to make the overlay nearly invisible:
- Reduces opacity to 30%
- Scales down the interface
- Hover to temporarily restore full visibility
- Perfect for screen sharing scenarios

## Configuration

### LLM Provider Setup

#### OpenAI (GPT-4)
```javascript
// In settings or environment variables
{
  "openai": {
    "apiKey": "your-openai-api-key",
    "model": "gpt-4"
  }
}
```

#### Anthropic (Claude)
```javascript
{
  "anthropic": {
    "apiKey": "your-anthropic-api-key",
    "model": "claude-3-sonnet-20240229"
  }
}
```

#### Google (Gemini)
```javascript
{
  "google": {
    "apiKey": "your-google-api-key",
    "model": "gemini-pro"
  }
}
```

### Model Selection
Choose from different Whisper models based on your needs:
- **tiny**: Fastest, lowest accuracy (39 MB)
- **base**: Good balance (74 MB)
- **small**: Better accuracy (244 MB)
- **medium**: High accuracy (769 MB)
- **large**: Best accuracy (1550 MB)

### Privacy Settings
```javascript
{
  "privacy": {
    "redactPII": true,
    "localOnly": true,
    "dataRetention": "7d", // 1d, 7d, 30d, manual
    "encryption": true
  }
}
```

## Architecture

### Core Components
- **Main Process**: Electron main process managing application lifecycle
- **ASR Service**: Local Whisper integration for speech recognition
- **LLM Service**: Multi-provider LLM integration with prompt pipelines
- **Database Service**: Encrypted SQLite for session and user data
- **Overlay Renderer**: Transparent UI for real-time assistance

### Data Flow
1. **Audio Capture**: System audio + microphone → ASR Service
2. **Transcription**: Whisper processes audio → Database storage
3. **Context Enrichment**: Transcript + profile + session data
4. **LLM Processing**: Context → AI suggestions → Overlay display
5. **Analytics**: Session metrics → Performance insights

### Security Model
- **Local Processing**: Whisper runs entirely on device
- **Encrypted Storage**: All data encrypted with AES-256
- **Secure Keychain**: API keys stored in OS keychain
- **PII Redaction**: Automatic removal of sensitive information
- **No Telemetry**: Zero data sent to external servers

## Development

### Project Structure
```
src/
├── main.js              # Electron main process
├── preload.js           # Secure IPC bridge
├── renderer.js          # Overlay UI logic
├── index.html           # Overlay interface
└── services/
    ├── asr.js           # Speech recognition
    ├── llm.js           # Language model integration
    └── database.js      # Encrypted data storage
```

### Building
```bash
# Development build
npm run dev

# Production build
npm run build

# Create distributables
npm run dist
```

### Testing
```bash
# Run tests (when implemented)
npm test

# Lint code
npm run lint
```

## API Reference

### ASR Service
```javascript
// Initialize with model size
await ASRService.initialize('tiny');

// Start session
await ASRService.startSession(sessionId, options);

// Get current transcript
const transcript = await ASRService.getPartialTranscript();

// Stop session
await ASRService.stopSession();
```

### LLM Service
```javascript
// Get suggestions with context
const suggestions = await LLMService.getSuggestions(context, {
  pipeline: 'interview',
  sessionId: sessionId,
  redactPII: true
});

// Generate session summary
const summary = await LLMService.generateSessionSummary(sessionId);
```

### Database Service
```javascript
// Create session
const sessionId = await DatabaseService.createSession(type, mode, title);

// Save transcript
await DatabaseService.addTranscript(sessionId, speaker, text, confidence);

// Get session data
const session = await DatabaseService.getSession(sessionId);
```

## Troubleshooting

### Common Issues

#### Audio Not Working
1. Check microphone permissions in System Preferences
2. Verify audio loopback is installed correctly
3. Test with different audio sources

#### LLM Not Responding
1. Verify API keys are correctly set
2. Check internet connection
3. Review rate limits for your provider

#### Overlay Not Visible
1. Check if stealth mode is enabled
2. Verify window is not minimized
3. Try toggling with `Alt+Shift+E`

#### Performance Issues
1. Try a smaller Whisper model (tiny/base)
2. Reduce audio quality settings
3. Close other resource-intensive applications

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=echo:* npm start
```

### Logs Location
- **macOS**: `~/Library/Logs/echo/`
- **Windows**: `%APPDATA%/echo/logs/`

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Privacy Policy

Echo is designed with privacy as a core principle:
- All speech recognition happens locally
- No data is sent to external servers without explicit consent
- All stored data is encrypted
- Users have full control over data retention and deletion

## Support

- **Documentation**: [docs.echo.copilot](https://docs.echo.copilot)
- **Issues**: [GitHub Issues](https://github.com/criticalsuccess/echo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/criticalsuccess/echo/discussions)
- **Email**: support@echo.copilot

## Roadmap

### Version 1.1 (Q2 2024)
- [ ] Atlassian OAuth integration
- [ ] Advanced analytics dashboard
- [ ] Custom prompt templates
- [ ] Team collaboration features

### Version 1.2 (Q3 2024)
- [ ] Mobile companion app
- [ ] Advanced simulation modes
- [ ] Integration with more tools (Notion, Linear, etc.)
- [ ] Multi-language support

### Version 2.0 (Q4 2024)
- [ ] Custom model training
- [ ] Advanced privacy controls
- [ ] Enterprise features
- [ ] API for third-party integrations

---

Made with ❤️ by the CriticalSuccess team