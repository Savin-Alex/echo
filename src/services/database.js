/*
 * Encrypted SQLite database service for Echo.
 * 
 * This module provides secure storage for sessions, transcripts, suggestions,
 * integrations, and user profiles. All sensitive data is encrypted using
 * AES-256 encryption with keys stored in the OS keychain.
 */

const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

// Try to load keytar, fallback to file-based storage if not available
let keytar;
try {
  keytar = require('keytar');
} catch (error) {
  console.warn('keytar not available, using file-based key storage');
  keytar = null;
}

class DatabaseService {
  constructor() {
    this.db = null;
    this.encryptionKey = null;
    this.serviceName = 'echo-copilot';
    this.accountName = 'encryption-key';
    this.dbPath = path.join(app.getPath('userData'), 'echo.db');
    this.keyPath = path.join(app.getPath('userData'), 'echo.key');
  }

  async initialize() {
    try {
      // Get or create encryption key
      await this.initializeEncryptionKey();
      
      // Initialize database
      await this.initializeDatabase();
      
      // Create tables
      this.createTables();
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async initializeEncryptionKey() {
    try {
      if (keytar) {
        // Use OS keychain for secure key storage
        let key = await keytar.getPassword(this.serviceName, this.accountName);
        
        if (!key) {
          // Generate new key and store in keychain
          key = crypto.randomBytes(32).toString('base64');
          await keytar.setPassword(this.serviceName, this.accountName, key);
        }
        
        this.encryptionKey = Buffer.from(key, 'base64');
      } else {
        // Fallback to file-based storage (less secure)
        if (fs.existsSync(this.keyPath)) {
          const keyData = fs.readFileSync(this.keyPath, 'utf8');
          this.encryptionKey = Buffer.from(keyData, 'base64');
        } else {
          // Generate new key
          const key = crypto.randomBytes(32);
          this.encryptionKey = key;
          fs.writeFileSync(this.keyPath, key.toString('base64'), { mode: 0o600 });
        }
      }
    } catch (error) {
      console.error('Failed to initialize encryption key:', error);
      throw error;
    }
  }

  async initializeDatabase() {
    try {
      // Ensure directory exists
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
    } catch (error) {
      console.error('Failed to initialize database connection, falling back to in-memory:', error);
      // Fall back to in-memory database instead of crashing
      this.db = new Database(':memory:');
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.inMemory = true;
    }
  }

  createTables() {
    // Set up database with security pragmas
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('secure_delete = ON');
    
    const tables = [
      // Sessions table
      `CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME,
        mode TEXT NOT NULL,
        title TEXT,
        source_app TEXT,
        metadata TEXT
      )`,

      // Transcripts table
      `CREATE TABLE IF NOT EXISTS transcripts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        speaker TEXT,
        text TEXT,
        confidence REAL,
        FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
      )`,

      // Suggestions table
      `CREATE TABLE IF NOT EXISTS suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        channel TEXT,
        content TEXT,
        accepted BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
      )`,

      // Actions table
      `CREATE TABLE IF NOT EXISTS actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        owner TEXT,
        text TEXT,
        due_date DATETIME,
        completed BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
      )`,

      // Integrations table
      `CREATE TABLE IF NOT EXISTS integrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider TEXT NOT NULL UNIQUE,
        access_token_encrypted TEXT,
        refresh_token_encrypted TEXT,
        scopes TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Profiles table
      `CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resume_blob_encrypted TEXT,
        jd_blob_encrypted TEXT,
        role TEXT,
        industry TEXT,
        preferences TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Metrics table
      `CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        clarity_score REAL,
        wpm REAL,
        filler_rate REAL,
        talk_ratio REAL,
        interruption_count INTEGER DEFAULT 0,
        FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
      )`,

      // Context cache table
      `CREATE TABLE IF NOT EXISTS context_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE,
        value_encrypted TEXT,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    tables.forEach(table => {
      this.db.exec(table);
    });

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_transcripts_session_id ON transcripts (session_id)',
      'CREATE INDEX IF NOT EXISTS idx_suggestions_session_id ON suggestions (session_id)',
      'CREATE INDEX IF NOT EXISTS idx_actions_session_id ON actions (session_id)',
      'CREATE INDEX IF NOT EXISTS idx_metrics_session_id ON metrics (session_id)',
      'CREATE INDEX IF NOT EXISTS idx_context_cache_key ON context_cache (key)',
      'CREATE INDEX IF NOT EXISTS idx_context_cache_expires ON context_cache (expires_at)'
    ];

    indexes.forEach(index => {
      this.db.exec(index);
    });
  }

  // Encryption/Decryption methods using AES-256-GCM
  encrypt(plaintext) {
    if (!plaintext) return null;
    
    try {
      const iv = crypto.randomBytes(12); // 96-bit IV for GCM
      const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      const authTag = cipher.getAuthTag();
      
      // Combine IV + authTag + encrypted data
      const combined = Buffer.concat([iv, authTag, encrypted]);
      return combined.toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

  decrypt(encryptedData) {
    if (!encryptedData) return null;
    
    try {
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const iv = combined.subarray(0, 12);
      const authTag = combined.subarray(12, 28);
      const encrypted = combined.subarray(28);
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, null, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  }

  // Session management
  createSession(type, mode, title = null, sourceApp = null, metadata = null) {
    const stmt = this.db.prepare(`
      INSERT INTO sessions (type, mode, title, source_app, metadata)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(type, mode, title, sourceApp, 
      metadata ? JSON.stringify(metadata) : null);
    
    return result.lastInsertRowid;
  }

  updateSession(sessionId, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    const stmt = this.db.prepare(`UPDATE sessions SET ${fields} WHERE id = ?`);
    stmt.run(...values, sessionId);
  }

  getSession(sessionId) {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    return stmt.get(sessionId);
  }

  getRecentSessions(limit = 10) {
    const stmt = this.db.prepare(`
      SELECT * FROM sessions 
      ORDER BY started_at DESC 
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  // Transcript management
  addTranscript(sessionId, speaker, text, confidence = null) {
    const stmt = this.db.prepare(`
      INSERT INTO transcripts (session_id, speaker, text, confidence)
      VALUES (?, ?, ?, ?)
    `);
    
    return stmt.run(sessionId, speaker, text, confidence);
  }

  getTranscripts(sessionId) {
    const stmt = this.db.prepare(`
      SELECT * FROM transcripts 
      WHERE session_id = ? 
      ORDER BY timestamp ASC
    `);
    return stmt.all(sessionId);
  }

  // Suggestions management
  addSuggestion(sessionId, channel, content) {
    const stmt = this.db.prepare(`
      INSERT INTO suggestions (session_id, channel, content)
      VALUES (?, ?, ?)
    `);
    
    return stmt.run(sessionId, channel, content);
  }

  markSuggestionAccepted(suggestionId) {
    const stmt = this.db.prepare(`
      UPDATE suggestions SET accepted = TRUE WHERE id = ?
    `);
    stmt.run(suggestionId);
  }

  getSuggestions(sessionId) {
    const stmt = this.db.prepare(`
      SELECT * FROM suggestions 
      WHERE session_id = ? 
      ORDER BY timestamp ASC
    `);
    return stmt.all(sessionId);
  }

  // Actions management
  addAction(sessionId, owner, text, dueDate = null) {
    const stmt = this.db.prepare(`
      INSERT INTO actions (session_id, owner, text, due_date)
      VALUES (?, ?, ?, ?)
    `);
    
    return stmt.run(sessionId, owner, text, dueDate);
  }

  getActions(sessionId) {
    const stmt = this.db.prepare(`
      SELECT * FROM actions 
      WHERE session_id = ? 
      ORDER BY timestamp ASC
    `);
    return stmt.all(sessionId);
  }

  // Integration management
  saveIntegration(provider, accessToken, refreshToken = null, scopes = null) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO integrations 
      (provider, access_token_encrypted, refresh_token_encrypted, scopes)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(
      provider,
      this.encrypt(accessToken),
      this.encrypt(refreshToken),
      scopes ? JSON.stringify(scopes) : null
    );
  }

  getIntegration(provider) {
    const stmt = this.db.prepare('SELECT * FROM integrations WHERE provider = ?');
    const row = stmt.get(provider);
    
    if (row) {
      return {
        ...row,
        access_token: this.decrypt(row.access_token_encrypted),
        refresh_token: this.decrypt(row.refresh_token_encrypted),
        scopes: row.scopes ? JSON.parse(row.scopes) : null
      };
    }
    
    return null;
  }

  // Profile management
  saveProfile(profileData) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO profiles 
      (id, resume_blob_encrypted, jd_blob_encrypted, role, industry, preferences)
      VALUES (1, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      this.encrypt(profileData.resume),
      this.encrypt(profileData.jobDescription),
      profileData.role,
      profileData.industry,
      profileData.preferences ? JSON.stringify(profileData.preferences) : null
    );
  }

  getProfile() {
    const stmt = this.db.prepare('SELECT * FROM profiles WHERE id = 1');
    const row = stmt.get();
    
    if (row) {
      return {
        ...row,
        resume: this.decrypt(row.resume_blob_encrypted),
        jobDescription: this.decrypt(row.jd_blob_encrypted),
        preferences: row.preferences ? JSON.parse(row.preferences) : null
      };
    }
    
    return null;
  }

  // Metrics management
  saveMetrics(sessionId, metrics) {
    const stmt = this.db.prepare(`
      INSERT INTO metrics 
      (session_id, clarity_score, wpm, filler_rate, talk_ratio, interruption_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      sessionId,
      metrics.clarityScore,
      metrics.wpm,
      metrics.fillerRate,
      metrics.talkRatio,
      metrics.interruptionCount
    );
  }

  getMetrics(sessionId) {
    const stmt = this.db.prepare('SELECT * FROM metrics WHERE session_id = ?');
    return stmt.get(sessionId);
  }

  // Context cache management
  setContextCache(key, value, ttlSeconds = 3600) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO context_cache (key, value_encrypted, expires_at)
      VALUES (?, ?, ?)
    `);
    
    stmt.run(key, this.encrypt(JSON.stringify(value)), expiresAt.toISOString());
  }

  getContextCache(key) {
    const stmt = this.db.prepare(`
      SELECT value_encrypted FROM context_cache 
      WHERE key = ? AND expires_at > datetime('now')
    `);
    
    const row = stmt.get(key);
    if (row) {
      return JSON.parse(this.decrypt(row.value_encrypted));
    }
    
    return null;
  }

  // Cleanup methods
  cleanupExpiredCache() {
    const stmt = this.db.prepare(`
      DELETE FROM context_cache WHERE expires_at <= datetime('now')
    `);
    return stmt.run();
  }

  deleteSession(sessionId) {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
    return stmt.run(sessionId);
  }

  // Privacy controls
  async wipeAllData() {
    const tables = [
      'sessions', 'transcripts', 'suggestions', 'actions', 
      'integrations', 'profiles', 'metrics', 'context_cache'
    ];
    
    // Use transaction for atomicity
    const transaction = this.db.transaction(() => {
      tables.forEach(table => {
        this.db.prepare(`DELETE FROM ${table}`).run();
      });
    });
    
    transaction();
    
    // Also remove encryption key from keychain
    if (keytar) {
      try {
        await keytar.deletePassword(this.serviceName, this.accountName);
      } catch (error) {
        console.error('Error removing key from keychain:', error);
      }
    }
    
    // Remove key file if it exists
    if (fs.existsSync(this.keyPath)) {
      try {
        fs.unlinkSync(this.keyPath);
      } catch (error) {
        console.error('Error removing key file:', error);
      }
    }
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new DatabaseService();
