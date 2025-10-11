import { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import './ContextPage.css';

interface ContextStats {
  total_documents: number;
  collection_name: string;
  embedding_model: string;
  embedding_dimension: number;
}

interface SearchResult {
  id: string;
  text: string;
  metadata: Record<string, any>;
  distance?: number;
}

export function ContextPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<ContextStats | null>(null);
  const [documentText, setDocumentText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const result = await window.echo.contextStats();
      setStats(result);
    } catch (error) {
      console.error('Failed to load context stats:', error);
    }
  };

  const handleAddDocument = async () => {
    if (!documentText.trim()) {
      showMessage('error', 'Please enter some text');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await window.echo.contextLoad(documentText);
      
      if (result.success) {
        showMessage('success', `Document added! Total: ${result.count}`);
        setDocumentText('');
        await loadStats();
      } else {
        showMessage('error', 'Failed to add document');
      }
    } catch (error) {
      showMessage('error', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showMessage('error', 'Please enter a search query');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await window.echo.contextSearch(searchQuery);
      setSearchResults(result.matches || []);
      
      if (result.matches.length === 0) {
        showMessage('error', 'No results found');
      }
    } catch (error) {
      showMessage('error', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear all context documents?')) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await window.echo.contextClear();
      showMessage('success', 'All documents cleared');
      setSearchResults([]);
      await loadStats();
    } catch (error) {
      showMessage('error', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div className="context-page">
      <header className="context-header">
        <h1>🗂️ Context Management (RAG)</h1>
        <p className="subtitle">Load documents to enhance LLM responses with relevant context</p>
      </header>

      {/* Stats Section */}
      <div className="stats-card">
        <h3>📊 Vector Store Status</h3>
        {stats ? (
          <div className="stats-grid">
            <div className="stat">
              <span className="stat-label">Documents:</span>
              <span className="stat-value">{stats.total_documents}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Model:</span>
              <span className="stat-value">{stats.embedding_model}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Dimensions:</span>
              <span className="stat-value">{stats.embedding_dimension}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Collection:</span>
              <span className="stat-value">{stats.collection_name}</span>
            </div>
          </div>
        ) : (
          <p className="loading">Loading stats...</p>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Add Document Section */}
      <div className="section">
        <h3>➕ Add Document</h3>
        <textarea
          className="input-textarea"
          value={documentText}
          onChange={(e) => setDocumentText(e.target.value)}
          placeholder="Enter document text (meeting notes, knowledge base, etc.)..."
          rows={6}
        />
        <div className="button-row">
          <button
            className="btn-primary"
            onClick={handleAddDocument}
            disabled={isLoading || !documentText.trim()}
          >
            {isLoading ? '⏳ Adding...' : '➕ Add to Context'}
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="section">
        <h3>🔍 Semantic Search</h3>
        <input
          type="text"
          className="input-text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for relevant documents..."
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <div className="button-row">
          <button
            className="btn-primary"
            onClick={handleSearch}
            disabled={isLoading || !searchQuery.trim()}
          >
            {isLoading ? '⏳ Searching...' : '🔍 Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="search-results">
            <h4>Results ({searchResults.length}):</h4>
            {searchResults.map((result, idx) => (
              <div key={result.id} className="result-card">
                <div className="result-header">
                  <span className="result-index">#{idx + 1}</span>
                  {result.distance !== undefined && (
                    <span className="result-score">
                      Score: {(1 - result.distance).toFixed(3)}
                    </span>
                  )}
                </div>
                <p className="result-text">{result.text}</p>
                {result.metadata && Object.keys(result.metadata).length > 0 && (
                  <div className="result-metadata">
                    {Object.entries(result.metadata).map(([key, value]) => (
                      <span key={key} className="metadata-tag">
                        {key}: {JSON.stringify(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions Section */}
      <div className="section">
        <h3>⚙️ Actions</h3>
        <div className="button-row">
          <button
            className="btn-secondary"
            onClick={loadStats}
            disabled={isLoading}
          >
            🔄 Refresh Stats
          </button>
          <button
            className="btn-danger"
            onClick={handleClear}
            disabled={isLoading || !stats || stats.total_documents === 0}
          >
            🗑️ Clear All
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="info-box">
        <h4>💡 How to use:</h4>
        <ul>
          <li>Add documents containing relevant information or knowledge</li>
          <li>Use semantic search to find related content</li>
          <li>Enable "Use Context" in Summarize/Reply to use RAG</li>
          <li>Documents are embedded and stored locally with ChromaDB</li>
        </ul>
      </div>
    </div>
  );
}

