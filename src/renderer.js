/*
 * Enhanced renderer script for the Echo overlay window.
 * Handles real-time suggestions, coaching prompts, stealth mode,
 * and interactive UI elements with smooth animations.
 */

class EchoRenderer {
  constructor() {
    this.isStealthMode = false;
    this.currentSessionId = null;
    this.coachingInterval = null;
    this.lastCoachingTime = 0;
    this.coachingRateLimit = 7000; // 7 seconds
    
    this.initializeElements();
    this.setupEventListeners();
    this.startCoachingLoop();
  }

  initializeElements() {
    // Main elements
    this.overlay = document.getElementById('overlay');
    this.suggestionsContainer = document.getElementById('suggestions');
    this.questionSection = document.getElementById('question-section');
    this.questionText = document.getElementById('question-text');
    this.coachingSection = document.getElementById('coaching-section');
    this.coachingContent = document.getElementById('coaching-content');
    this.statusIndicator = document.getElementById('status-indicator');
    this.hotkeys = document.getElementById('hotkeys');

    // Buttons
    this.closeButton = document.getElementById('btn-close');
    this.stealthButton = document.getElementById('btn-stealth');
    this.settingsButton = document.getElementById('btn-settings');
  }

  setupEventListeners() {
    // Close button
    this.closeButton.addEventListener('click', () => {
      this.closeOverlay();
    });

    // Stealth mode toggle
    this.stealthButton.addEventListener('click', () => {
      this.toggleStealthMode();
    });

    // Settings button
    this.settingsButton.addEventListener('click', () => {
      this.showSettings();
    });

    // Hotkey display
    this.overlay.addEventListener('mouseenter', () => {
      this.showHotkeys();
    });

    this.overlay.addEventListener('mouseleave', () => {
      this.hideHotkeys();
    });

    // Suggestion clicks
    this.suggestionsContainer.addEventListener('click', (e) => {
      const suggestion = e.target.closest('.suggestion');
      if (suggestion) {
        this.selectSuggestion(suggestion);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
  }

  startCoachingLoop() {
    // Generate coaching prompts periodically
    this.coachingInterval = setInterval(() => {
      this.generateCoachingPrompt();
    }, this.coachingRateLimit);
  }

  async generateCoachingPrompt() {
    const now = Date.now();
    if (now - this.lastCoachingTime < this.coachingRateLimit) {
      return;
    }

    try {
      // Get current transcript context
      const context = await window.echo.getPartialTranscript();
      if (!context || context.length < 20) {
        return;
      }

      // Generate coaching suggestions
      const coaching = await this.analyzeSpeech(context);
      if (coaching) {
        this.displayCoaching(coaching);
        this.lastCoachingTime = now;
      }
    } catch (error) {
      console.error('Error generating coaching prompt:', error);
    }
  }

  async analyzeSpeech(transcript) {
    // Simple speech analysis for coaching prompts
    const analysis = {
      pace: this.analyzePace(transcript),
      clarity: this.analyzeClarity(transcript),
      confidence: this.analyzeConfidence(transcript)
    };

    return this.generateCoachingMessage(analysis);
  }

  analyzePace(transcript) {
    const words = transcript.split(' ').length;
    const timeEstimate = transcript.length * 0.06; // Rough estimate
    const wpm = Math.round((words / timeEstimate) * 60);
    
    if (wpm > 180) return { level: 'fast', message: 'Slow down slightly' };
    if (wpm < 120) return { level: 'slow', message: 'Speak a bit faster' };
    return { level: 'good', message: 'Good pace' };
  }

  analyzeClarity(transcript) {
    const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'well'];
    const words = transcript.toLowerCase().split(' ');
    const fillerCount = words.filter(word => fillerWords.includes(word)).length;
    const fillerRate = (fillerCount / words.length) * 100;

    if (fillerRate > 5) return { level: 'poor', message: 'Reduce filler words' };
    if (fillerRate > 2) return { level: 'fair', message: 'Fewer filler words' };
    return { level: 'good', message: 'Clear speech' };
  }

  analyzeConfidence(transcript) {
    const uncertainPhrases = ['i think', 'maybe', 'perhaps', 'i guess', 'sort of'];
    const lowerTranscript = transcript.toLowerCase();
    const uncertainCount = uncertainPhrases.filter(phrase => 
      lowerTranscript.includes(phrase)
    ).length;

    if (uncertainCount > 2) return { level: 'low', message: 'Be more decisive' };
    if (uncertainCount > 0) return { level: 'medium', message: 'Show more confidence' };
    return { level: 'high', message: 'Confident tone' };
  }

  generateCoachingMessage(analysis) {
    const messages = [];
    
    if (analysis.pace.level !== 'good') {
      messages.push({
        icon: '🚦',
        text: analysis.pace.message,
        type: analysis.pace.level
      });
    }

    if (analysis.clarity.level !== 'good') {
      messages.push({
        icon: '🎯',
        text: analysis.clarity.message,
        type: analysis.clarity.level
      });
    }

    if (analysis.confidence.level !== 'high') {
      messages.push({
        icon: '🧭',
        text: analysis.confidence.message,
        type: analysis.confidence.level
      });
    }

    return messages.length > 0 ? messages : null;
  }

  displayCoaching(coaching) {
    if (!coaching || coaching.length === 0) {
      this.coachingSection.style.display = 'none';
      return;
    }

    this.coachingContent.innerHTML = '';
    
    coaching.forEach(item => {
      const coachingItem = document.createElement('div');
      coachingItem.classList.add('coaching-item');
      
      // Security: Use textContent instead of innerHTML to prevent XSS
      const iconSpan = document.createElement('span');
      iconSpan.classList.add('coaching-icon');
      iconSpan.textContent = item.icon;
      
      const textSpan = document.createElement('span');
      textSpan.textContent = item.text;
      
      coachingItem.appendChild(iconSpan);
      coachingItem.appendChild(textSpan);
      
      this.coachingContent.appendChild(coachingItem);
    });

    this.coachingSection.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.coachingSection.style.display = 'none';
    }, 5000);
  }

  displaySuggestions(suggestions, options = {}) {
    // Clear existing suggestions
    this.suggestionsContainer.innerHTML = '';

    if (!suggestions || suggestions.length === 0) {
      this.showEmptyState();
      return;
    }

    // Show current question if provided
    if (options.question) {
      this.questionText.textContent = options.question;
      this.questionSection.style.display = 'block';
    } else {
      this.questionSection.style.display = 'none';
    }

    // Render suggestions
    suggestions.forEach((suggestion, index) => {
      const suggestionElement = this.createSuggestionElement(suggestion, index);
      this.suggestionsContainer.appendChild(suggestionElement);
    });

    // Animate suggestions in
    this.animateSuggestions();
  }

  createSuggestionElement(suggestion, index) {
    const div = document.createElement('div');
    div.classList.add('suggestion');
    div.dataset.index = index;

    // Handle both string and object suggestions
    const text = typeof suggestion === 'string' ? suggestion : suggestion.text;
    const confidence = typeof suggestion === 'object' ? suggestion.confidence : 0.9;

    // Security: Use textContent and createElement instead of innerHTML
    const textDiv = document.createElement('div');
    textDiv.classList.add('suggestion-text');
    textDiv.textContent = text;
    
    const metaDiv = document.createElement('div');
    metaDiv.classList.add('suggestion-meta');
    
    const suggestionNumberSpan = document.createElement('span');
    suggestionNumberSpan.textContent = `Suggestion ${index + 1}`;
    
    const confidenceDiv = document.createElement('div');
    confidenceDiv.classList.add('suggestion-confidence');
    
    const confidenceSpan = document.createElement('span');
    confidenceSpan.textContent = `${Math.round(confidence * 100)}%`;
    
    const confidenceBarDiv = document.createElement('div');
    confidenceBarDiv.classList.add('confidence-bar');
    
    const confidenceFillDiv = document.createElement('div');
    confidenceFillDiv.classList.add('confidence-fill');
    confidenceFillDiv.style.width = `${confidence * 100}%`;
    
    confidenceBarDiv.appendChild(confidenceFillDiv);
    confidenceDiv.appendChild(confidenceSpan);
    confidenceDiv.appendChild(confidenceBarDiv);
    metaDiv.appendChild(suggestionNumberSpan);
    metaDiv.appendChild(confidenceDiv);
    
    div.appendChild(textDiv);
    div.appendChild(metaDiv);

    return div;
  }

  animateSuggestions() {
    const suggestions = this.suggestionsContainer.querySelectorAll('.suggestion');
    suggestions.forEach((suggestion, index) => {
      suggestion.style.opacity = '0';
      suggestion.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        suggestion.style.transition = 'all 0.3s ease';
        suggestion.style.opacity = '1';
        suggestion.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  showEmptyState() {
    this.suggestionsContainer.innerHTML = '';
    
    const emptyStateDiv = document.createElement('div');
    emptyStateDiv.classList.add('empty-state');
    
    const iconDiv = document.createElement('div');
    iconDiv.classList.add('empty-icon');
    iconDiv.textContent = '💭';
    
    const mainTextDiv = document.createElement('div');
    mainTextDiv.textContent = 'Waiting for suggestions...';
    
    const subTextDiv = document.createElement('div');
    subTextDiv.style.fontSize = '0.7rem';
    subTextDiv.style.marginTop = '0.5rem';
    subTextDiv.style.opacity = '0.6';
    subTextDiv.textContent = 'Press Alt+Shift+S for suggestions';
    
    emptyStateDiv.appendChild(iconDiv);
    emptyStateDiv.appendChild(mainTextDiv);
    emptyStateDiv.appendChild(subTextDiv);
    
    this.suggestionsContainer.appendChild(emptyStateDiv);
  }

  showLoadingState() {
    this.suggestionsContainer.innerHTML = '';
    
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('loading');
    
    const spinnerDiv = document.createElement('div');
    spinnerDiv.classList.add('loading-spinner');
    
    const textSpan = document.createElement('span');
    textSpan.textContent = 'Generating suggestions...';
    
    loadingDiv.appendChild(spinnerDiv);
    loadingDiv.appendChild(textSpan);
    
    this.suggestionsContainer.appendChild(loadingDiv);
  }

  selectSuggestion(suggestionElement) {
    // Add selection animation
    suggestionElement.style.background = 'var(--accent-color)';
    suggestionElement.style.color = '#000';
    
    setTimeout(() => {
      suggestionElement.style.background = '';
      suggestionElement.style.color = '';
    }, 200);

    // Copy suggestion text to clipboard (if supported)
    const text = suggestionElement.querySelector('.suggestion-text').textContent;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }

    // Emit selection event
    window.echo.onSuggestionSelected?.(text);
  }

  toggleStealthMode() {
    this.isStealthMode = !this.isStealthMode;
    this.overlay.classList.toggle('stealth-mode', this.isStealthMode);
    
    // Update button state
    this.stealthButton.textContent = this.isStealthMode ? '👁️‍🗨️' : '👁️';
    this.stealthButton.title = this.isStealthMode ? 'Exit stealth mode' : 'Enter stealth mode';
    
    // Update status indicator
    this.statusIndicator.style.background = this.isStealthMode ? 'var(--warning-color)' : 'var(--success-color)';
  }

  showSettings() {
    // Emit settings event to main process
    window.echo.onSettingsRequested?.();
  }

  showHotkeys() {
    this.hotkeys.classList.add('show');
  }

  hideHotkeys() {
    this.hotkeys.classList.remove('show');
  }

  handleKeyboardShortcuts(e) {
    // Handle overlay-specific shortcuts
    if (e.key === 'Escape') {
      this.closeOverlay();
    }
  }

  closeOverlay() {
    // Clean up
    if (this.coachingInterval) {
      clearInterval(this.coachingInterval);
    }
    
    // Close window
    window.close();
  }

  updateStatus(status) {
    const colors = {
      active: 'var(--success-color)',
      inactive: 'var(--error-color)',
      warning: 'var(--warning-color)'
    };
    
    this.statusIndicator.style.background = colors[status] || colors.active;
  }
}

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  const renderer = new EchoRenderer();

  // Ensure window.echo is available with safe fallbacks
  window.echo = window.echo || {};
  
  // Subscribe to suggestion events from the main process
  if (window.echo.onSuggestions) {
    window.echo.onSuggestions((suggestions, options) => {
      renderer.displaySuggestions(suggestions, options);
    });
  } else {
    console.warn('window.echo.onSuggestions not available');
  }

  // Subscribe to web lookup events
  if (window.echo.onWebLookup) {
    window.echo.onWebLookup(() => {
      renderer.suggestionsContainer.innerHTML = '';
      
      const suggestionDiv = document.createElement('div');
      suggestionDiv.classList.add('suggestion');
      
      const textDiv = document.createElement('div');
      textDiv.classList.add('suggestion-text');
      textDiv.textContent = 'Web lookup feature coming soon...';
      
      const metaDiv = document.createElement('div');
      metaDiv.classList.add('suggestion-meta');
      
      const metaSpan = document.createElement('span');
      metaSpan.textContent = 'Feature Preview';
      
      metaDiv.appendChild(metaSpan);
      suggestionDiv.appendChild(textDiv);
      suggestionDiv.appendChild(metaDiv);
      
      renderer.suggestionsContainer.appendChild(suggestionDiv);
    });
  } else {
    console.warn('window.echo.onWebLookup not available');
  }

  // Subscribe to transcript updates
  if (window.echo.onTranscript) {
    window.echo.onTranscript((transcript) => {
      // Update coaching based on new transcript
      renderer.generateCoachingPrompt();
    });
  } else {
    console.warn('window.echo.onTranscript not available');
  }

  // Subscribe to session updates
  if (window.echo.onSessionUpdate) {
    window.echo.onSessionUpdate((session) => {
      renderer.currentSessionId = session.id;
      renderer.updateStatus(session.isActive ? 'active' : 'inactive');
    });
  } else {
    console.warn('window.echo.onSessionUpdate not available');
  }

  // Make renderer available globally for debugging
  window.echoRenderer = renderer;
});