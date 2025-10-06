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

      // Generate response
      const response = await this.generateResponse(prompt, options);

      // Parse and format suggestions
      const suggestions = this.parseSuggestions(response);

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
    
    // Check rate limits
    if (!this.checkRateLimit(provider)) {
      throw new Error(`Rate limit exceeded for ${provider}`);
    }

    try {
      switch (provider) {
        case 'openai':
          return await this.generateWithOpenAI(prompt, options);
        case 'anthropic':
          return await this.generateWithAnthropic(prompt, options);
        case 'google':
          return await this.generateWithGoogle(prompt, options);
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error with ${provider}:`, error);
      // Try fallback provider
      const fallbackProvider = this.getFallbackProvider(provider);
      if (fallbackProvider && fallbackProvider !== provider) {
        return await this.generateResponse(prompt, { ...options, provider: fallbackProvider });
      }
      throw error;
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

  redactPII(text) {
    // Simple PII redaction - in production, use more sophisticated methods
    const patterns = [
      { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' },
      { regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN]' },
      { regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARD]' },
      { regex: /\b\d{3}-\d{3}-\d{4}\b/g, replacement: '[PHONE]' }
    ];

    let redacted = text;
    patterns.forEach(({ regex, replacement }) => {
      redacted = redacted.replace(regex, replacement);
    });

    return redacted;
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
      throw new Error(`Provider ${provider} not initialized`);
    }
    this.currentProvider = provider;
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