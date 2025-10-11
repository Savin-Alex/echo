/*
 * LLM (Language Model) service with multiple providers and prompt pipelines.
 *
 * This module interfaces with multiple LLM providers (GPT, Claude, Gemini)
 * and provides context-aware suggestions based on the current transcript,
 * resume, job description, and project data from Jira/Confluence.
 * Includes privacy controls, prompt pipelines, and response caching.
 */

// const OpenAI = require('openai'); // Commented out for now
// const Anthropic = require('@anthropic-ai/sdk'); // Commented out for now
// const { GoogleGenerativeAI } = require('@google/generative-ai'); // Commented out for now
const DatabaseService = require('./database');
const { EventEmitter } = require('events');
const crypto = require('crypto');

// Security: Provider abstraction with timeouts and validation
class LLMProvider {
  constructor(config) {
    this.name = config.name;
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs || 30000;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  async generate(messages, system, options = {}) {
    // This would be implemented by specific providers
    console.warn('Provider not implemented, returning empty response');
    return { suggestions: [], meta: { disabled: true } };
  }

  async withRetry(operation) {
    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.withTimeout(operation, this.timeoutMs);
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries && this.shouldRetry(error)) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          await this.sleep(delay);
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  async withTimeout(operation, timeoutMs) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });
    return Promise.race([operation(), timeoutPromise]);
  }

  shouldRetry(error) {
    // Retry on rate limits and server errors
    const retryableCodes = [429, 500, 502, 503, 504];
    return retryableCodes.includes(error.status) || error.message.includes('timeout');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class LLMService extends EventEmitter {
  constructor() {
    super();
    this.providers = {
      openai: null,
      anthropic: null,
      google: null
    };
    this.currentProvider = 'openai';
    this.promptPipelines = {
      interview: this.getInterviewPrompt,
      meeting: this.getMeetingPrompt,
      jira: this.getJiraPrompt,
      confluence: this.getConfluencePrompt,
      chat: this.getChatPrompt
    };
    this.responseCache = new Map();
    this.maxCacheSize = 100;
    this.cacheTimeout = 300000; // 5 minutes
    
    // Rate limiting
    this.rateLimits = {
      openai: { requests: 0, resetTime: Date.now() },
      anthropic: { requests: 0, resetTime: Date.now() },
      google: { requests: 0, resetTime: Date.now() }
    };
    
    // Security: Prompt injection prevention
    this.dangerousPatterns = [
      /ignore previous instructions?/i,
      /forget everything/i,
      /system prompt/i,
      /you are now/i,
      /act as if/i,
      /pretend to be/i,
      /roleplay as/i
    ];
    
    this.blockedCommands = [
      'execute', 'run', 'eval', 'system', 'shell', 'cmd',
      'sudo', 'admin', 'root', 'delete', 'drop', 'truncate'
    ];
  }

  async initialize(config = {}) {
    try {
      console.log('Initializing LLM service...');
      
      // Initialize providers (placeholder for now)
      console.log('Initializing LLM providers (placeholder)');

      // Set default provider
      if (config.defaultProvider) {
        this.currentProvider = config.defaultProvider;
      }

      console.log('LLM service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize LLM service:', error);
      throw error;
    }
  }

  async getSuggestions(context, options = {}) {
    const {
      pipeline = 'interview',
      sessionId = null,
      useCache = true,
      redactPII = true
    } = options;

    try {
      // Security: Validate and sanitize input
      if (!this.validateInput(context, pipeline)) {
        throw new Error('Invalid input detected');
      }
      
      // Security: Check for prompt injection
      if (this.detectPromptInjection(context)) {
        console.warn('Potential prompt injection detected, using fallback');
        return this.getFallbackSuggestions(pipeline);
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(context, pipeline);
      if (useCache && this.responseCache.has(cacheKey)) {
        const cached = this.responseCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.response;
        }
      }

      // Redact PII if requested
      const processedContext = redactPII ? this.redactPII(context) : context;

      // Get context from database
      const enrichedContext = await this.enrichContext(processedContext, sessionId);

      // Build prompt
      const prompt = this.buildPrompt(pipeline, enrichedContext, options);

      // Generate response with timeout
      const response = await this.generateResponse(prompt, options);

      // Parse and format suggestions
      const suggestions = this.parseSuggestions(response);
      
      // Security: Validate response
      if (!this.validateResponse(suggestions)) {
        console.warn('Invalid response detected, using fallback');
        return this.getFallbackSuggestions(pipeline);
      }

      // Cache response
      if (useCache) {
        this.cacheResponse(cacheKey, suggestions);
      }

      // Save to database
      if (sessionId) {
        suggestions.forEach(suggestion => {
          DatabaseService.addSuggestion(sessionId, pipeline, suggestion);
        });
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return this.getFallbackSuggestions(pipeline);
    }
  }

  async generateResponse(prompt, options = {}) {
    const provider = options.provider || this.currentProvider;
    
    // Check if provider is disabled
    if (!provider || !this.providers[provider]) {
      console.warn('No provider available, returning fallback suggestions');
      return this.getFallbackSuggestions(options.pipeline || 'interview').join('\n');
    }
    
    // Check rate limits
    if (!this.checkRateLimit(provider)) {
      console.warn(`Rate limit exceeded for ${provider}, using fallback`);
      return this.getFallbackSuggestions(options.pipeline || 'interview').join('\n');
    }

    try {
      // Security: Validate prompt before sending
      if (!this.validatePrompt(prompt)) {
        console.warn('Invalid prompt detected, using fallback');
        return this.getFallbackSuggestions(options.pipeline || 'interview').join('\n');
      }
      
      switch (provider) {
        case 'openai':
          return await this.generateWithOpenAI(prompt, options);
        case 'anthropic':
          return await this.generateWithAnthropic(prompt, options);
        case 'google':
          return await this.generateWithGoogle(prompt, options);
        default:
          console.warn(`Unknown provider: ${provider}, using fallback`);
          return this.getFallbackSuggestions(options.pipeline || 'interview').join('\n');
      }
    } catch (error) {
      console.error(`Error with ${provider}:`, error);
      // Try fallback provider
      const fallbackProvider = this.getFallbackProvider(provider);
      if (fallbackProvider && fallbackProvider !== provider) {
        return await this.generateResponse(prompt, { ...options, provider: fallbackProvider });
      }
      // Return fallback suggestions instead of throwing
      return this.getFallbackSuggestions(options.pipeline || 'interview').join('\n');
    }
  }

  async generateWithOpenAI(prompt, options = {}) {
    // Placeholder for OpenAI
    return "• Highlight your relevant experience with specific examples\n• Connect your skills to the job requirements\n• Ask clarifying questions about the role\n• Show enthusiasm for the opportunity";
  }

  async generateWithAnthropic(prompt, options = {}) {
    // Placeholder for Anthropic
    return "• Provide concrete examples from your past work\n• Demonstrate problem-solving abilities\n• Show how you've grown and learned\n• Express genuine interest in the company";
  }

  async generateWithGoogle(prompt, options = {}) {
    // Placeholder for Google
    return "• Use the STAR method (Situation, Task, Action, Result)\n• Quantify your achievements with metrics\n• Show cultural fit and values alignment\n• End with a thoughtful question about the role";
  }

  buildPrompt(pipeline, context, options = {}) {
    const promptFunction = this.promptPipelines[pipeline];
    if (!promptFunction) {
      throw new Error(`Unknown pipeline: ${pipeline}`);
    }

    return promptFunction.call(this, context, options);
  }

  getInterviewPrompt(context, options = {}) {
    const systemPrompt = `You are Echo, a discreet, privacy-first copilot for interviews. Generate concise bullet points (max 4) that directly answer the last question. Prefer the user's resume/JD context; if unknown, request clarifying detail invisibly. Avoid buzzwords; include one quantified metric/example when available.

Context: ${context.resume ? 'Resume available' : 'No resume'}
Job Description: ${context.jobDescription ? 'Available' : 'Not available'}
Current Question: ${context.currentQuestion || 'Not specified'}`;

    const userPrompt = `Based on the conversation context below, provide 2-4 concise suggestions for answering the current question:

Conversation: ${context.transcript}
Last Question: ${context.currentQuestion}

Provide actionable, specific suggestions that help the user give a strong answer.`;

    return { system: systemPrompt, user: userPrompt };
  }

  getMeetingPrompt(context, options = {}) {
    const systemPrompt = `You are Echo, a meeting copilot. Provide concise, actionable suggestions for contributing to the meeting discussion. Focus on relevant insights, questions, or action items.

Meeting Type: ${context.meetingType || 'General'}
Participants: ${context.participants || 'Unknown'}
Topic: ${context.topic || 'General discussion'}`;

    const userPrompt = `Based on the meeting context, suggest how to contribute effectively:

Meeting Discussion: ${context.transcript}
Current Topic: ${context.currentTopic}

Provide 2-3 specific suggestions for meaningful participation.`;

    return { system: systemPrompt, user: userPrompt };
  }

  getJiraPrompt(context, options = {}) {
    const systemPrompt = `You are Echo, a Jira assistant. Help improve issue descriptions and acceptance criteria. Make them clear, testable, and actionable.

Current Issue: ${context.issueKey || 'New issue'}
Issue Type: ${context.issueType || 'Task'}`;

    const userPrompt = `Improve this Jira issue description:

Current Description: ${context.currentDescription}
Requirements: ${context.requirements || 'Not specified'}

Provide an improved description and clear acceptance criteria in Given/When/Then format.`;

    return { system: systemPrompt, user: userPrompt };
  }

  getConfluencePrompt(context, options = {}) {
    const systemPrompt = `You are Echo, a Confluence assistant. Help structure and summarize documentation effectively.`;

    const userPrompt = `Based on this Confluence content, provide suggestions for:

Content: ${context.content}
Page Type: ${context.pageType || 'Documentation'}

Suggest improvements for structure, clarity, and completeness.`;

    return { system: systemPrompt, user: userPrompt };
  }

  getChatPrompt(context, options = {}) {
    const systemPrompt = `You are Echo, a chat assistant. Provide appropriate, professional responses for various messaging contexts.`;

    const userPrompt = `Suggest a response for this chat context:

Conversation: ${context.conversation}
Tone: ${options.tone || 'professional'}
Context: ${context.platform || 'general chat'}

Provide 2-3 response options with different tones if appropriate.`;

    return { system: systemPrompt, user: userPrompt };
  }

  async enrichContext(context, sessionId) {
    const enriched = {
      transcript: context,
      resume: null,
      jobDescription: null,
      activeIssues: [],
      confluencePages: []
    };

    try {
      // Get user profile
      const profile = await DatabaseService.getProfile();
      if (profile) {
        enriched.resume = profile.resume;
        enriched.jobDescription = profile.jobDescription;
      }

      // Get session context
      if (sessionId) {
        const session = await DatabaseService.getSession(sessionId);
        if (session) {
          enriched.sessionType = session.type;
          enriched.sessionMode = session.mode;
          enriched.sourceApp = session.source_app;
        }
      }

      // Get cached context
      const cachedContext = await DatabaseService.getContextCache(`session_${sessionId}`);
      if (cachedContext) {
        Object.assign(enriched, cachedContext);
      }

    } catch (error) {
      console.error('Error enriching context:', error);
    }

    return enriched;
  }

  // Security: Enhanced PII redaction
  redactPII(text) {
    if (!text || typeof text !== 'string') return text;
    
    const patterns = [
      { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },
      { regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN]' },
      { regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARD]' },
      { regex: /\b\d{3}-\d{3}-\d{4}\b/g, replacement: '[PHONE]' },
      { regex: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, replacement: '[NAME]' }, // Simple name pattern
      { regex: /\b\d{1,5}\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/gi, replacement: '[ADDRESS]' },
      { regex: /\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/g, replacement: '[ZIP]' },
      { regex: /\b(?:password|passwd|pwd)\s*[:=]\s*[^\s]+/gi, replacement: '[PASSWORD]' },
      { regex: /\b(?:token|key|secret)\s*[:=]\s*[^\s]+/gi, replacement: '[CREDENTIAL]' }
    ];

    let redacted = text;
    patterns.forEach(({ regex, replacement }) => {
      redacted = redacted.replace(regex, replacement);
    });

    return redacted;
  }

  // Security: Input validation
  validateInput(context, pipeline) {
    if (!context || typeof context !== 'string') {
      return false;
    }
    
    // Check length limits
    if (context.length > 50000) {
      return false;
    }
    
    // Check for allowed pipelines
    const allowedPipelines = ['interview', 'meeting', 'jira', 'confluence', 'chat'];
    if (!allowedPipelines.includes(pipeline)) {
      return false;
    }
    
    return true;
  }

  // Security: Prompt injection detection
  detectPromptInjection(text) {
    if (!text || typeof text !== 'string') return false;
    
    const lowerText = text.toLowerCase();
    
    // Check for dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(lowerText)) {
        return true;
      }
    }
    
    // Check for blocked commands
    for (const command of this.blockedCommands) {
      if (lowerText.includes(command)) {
        return true;
      }
    }
    
    return false;
  }

  // Security: Prompt validation
  validatePrompt(prompt) {
    if (!prompt || typeof prompt !== 'object') {
      return false;
    }
    
    // Check for required fields
    if (!prompt.system || !prompt.user) {
      return false;
    }
    
    // Check lengths
    if (prompt.system.length > 2000 || prompt.user.length > 8000) {
      return false;
    }
    
    return true;
  }

  // Security: Response validation
  validateResponse(suggestions) {
    if (!Array.isArray(suggestions)) {
      return false;
    }
    
    // Check suggestion count
    if (suggestions.length > 10) {
      return false;
    }
    
    // Validate each suggestion
    return suggestions.every(suggestion => {
      if (typeof suggestion !== 'string') {
        return false;
      }
      
      // Check length
      if (suggestion.length > 1000) {
        return false;
      }
      
      // Check for suspicious content
      return !this.detectPromptInjection(suggestion);
    });
  }

  parseSuggestions(response) {
    // Parse LLM response into structured suggestions
    const lines = response.split('\n').filter(line => line.trim());
    const suggestions = [];

    lines.forEach(line => {
      // Remove bullet points, numbers, etc.
      const cleaned = line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
      if (cleaned && cleaned.length > 10) {
        suggestions.push(cleaned);
      }
    });

    return suggestions.slice(0, 4); // Max 4 suggestions
  }

  generateCacheKey(context, pipeline) {
    return `${pipeline}_${this.hashString(context)}`;
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  cacheResponse(key, response) {
    if (this.responseCache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }

    this.responseCache.set(key, {
      response,
      timestamp: Date.now()
    });
  }

  checkRateLimit(provider) {
    const limit = this.rateLimits[provider];
    const now = Date.now();
    
    // Reset counter every minute
    if (now - limit.resetTime > 60000) {
      limit.requests = 0;
      limit.resetTime = now;
    }

    // Check limits (adjust based on provider)
    const maxRequests = {
      openai: 60,
      anthropic: 30,
      google: 60
    };

    return limit.requests < maxRequests[provider];
  }

  getFallbackProvider(currentProvider) {
    const fallbacks = {
      openai: 'anthropic',
      anthropic: 'google',
      google: 'openai'
    };
    return fallbacks[currentProvider];
  }

  getFallbackSuggestions(pipeline) {
    const fallbacks = {
      interview: [
        'Highlight your relevant experience',
        'Provide a specific example',
        'Ask a clarifying question',
        'Connect to the role requirements'
      ],
      meeting: [
        'Share a relevant insight',
        'Ask about next steps',
        'Propose an action item',
        'Clarify expectations'
      ],
      jira: [
        'Add clear acceptance criteria',
        'Include relevant context',
        'Specify completion criteria',
        'Link related issues'
      ],
      confluence: [
        'Add a summary section',
        'Include action items',
        'Structure with headings',
        'Add relevant links'
      ],
      chat: [
        'Keep it concise',
        'Use appropriate tone',
        'Include relevant context',
        'Ask if clarification needed'
      ]
    };

    return fallbacks[pipeline] || fallbacks.interview;
  }

  // Security: Token budgeting
  truncateByTokens(text, maxTokens = 1000) {
    if (!text) return text;
    
    // Simple token estimation (4 chars ≈ 1 token)
    const estimatedTokens = Math.ceil(text.length / 4);
    
    if (estimatedTokens <= maxTokens) {
      return text;
    }
    
    // Truncate to approximate token limit
    const maxChars = maxTokens * 4;
    return text.substring(0, maxChars) + '...';
  }

  // Security: Context sanitization
  sanitizeContext(context) {
    if (!context || typeof context !== 'object') {
      return context;
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'string') {
        // Remove URLs and markdown
        sanitized[key] = value
          .replace(/https?:\/\/[^\s]+/g, '[URL]')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/\*([^*]+)\*/g, '$1');
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  // Analytics and metrics
  async generateSessionSummary(sessionId) {
    try {
      const session = await DatabaseService.getSession(sessionId);
      const transcripts = await DatabaseService.getTranscripts(sessionId);
      const actions = await DatabaseService.getActions(sessionId);
      const metrics = await DatabaseService.getMetrics(sessionId);

      const summaryPrompt = `Generate a meeting summary with the following sections:
1. Key Decisions
2. Action Items (with owners and due dates)
3. Next Steps
4. Risks/Concerns

Meeting Transcript: ${transcripts.map(t => t.text).join('\n')}
Duration: ${this.calculateDuration(session.started_at, session.ended_at)}
Participants: ${session.source_app || 'Unknown'}`;

      const summary = await this.generateResponse(
        this.buildPrompt('meeting', { transcript: summaryPrompt }),
        { provider: this.currentProvider }
      );

      return {
        summary,
        actionItems: actions,
        metrics,
        duration: this.calculateDuration(session.started_at, session.ended_at)
      };
    } catch (error) {
      console.error('Error generating session summary:', error);
      return null;
    }
  }

  calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return 'Unknown';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.round(diffMs / 60000);
    return `${diffMins} minutes`;
  }

  // Provider management
  setProvider(provider) {
    if (!this.providers[provider]) {
      console.warn(`Provider ${provider} not initialized, disabling LLM`);
      this.currentProvider = null;
      return false;
    }
    this.currentProvider = provider;
    return true;
  }

  getAvailableProviders() {
    return Object.keys(this.providers).filter(provider => this.providers[provider]);
  }

  // Cleanup
  async cleanup() {
    this.responseCache.clear();
  }
}

module.exports = new LLMService();