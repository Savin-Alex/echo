/**
 * Main App Component
 */

import React, { useState, useEffect } from 'react';
import { I18nProvider } from './i18n';
import Dashboard from './pages/Dashboard';
import { ContextPage } from './pages/ContextPage';

type Page = 'dashboard' | 'context';

const App: React.FC = () => {
  const [settings, setSettings] = useState({
    language: 'en',
    privacy: 'local',
    whisperModel: 'base',
    ollamaModel: 'llama3',
    theme: 'dark'
  });
  
  const [backendStatus, setBackendStatus] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  
  useEffect(() => {
    // Load settings
    window.echo.getSettings().then((loadedSettings) => {
      setSettings((prev) => ({ ...prev, ...loadedSettings }));
    });
    
    // Check backend status
    const checkBackend = async () => {
      const ok = await window.echo.ping();
      setBackendStatus(ok);
    };
    
    checkBackend();
    
    // Poll backend status every 5 seconds
    const interval = setInterval(checkBackend, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const updateSettings = async (newSettings: Partial<typeof settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await window.echo.setSettings(updated);
  };
  
  return (
    <I18nProvider language={settings.language}>
      <div className="app-container">
        {/* Navigation */}
        <nav className="app-nav">
          <button
            className={`nav-button ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            🎯 Dashboard
          </button>
          <button
            className={`nav-button ${currentPage === 'context' ? 'active' : ''}`}
            onClick={() => setCurrentPage('context')}
          >
            🗂️ Context (RAG)
          </button>
        </nav>
        
        {/* Page Content */}
        <div className="app-content">
          {currentPage === 'dashboard' && (
            <Dashboard
              settings={settings}
              setSettings={updateSettings}
              backendStatus={backendStatus}
            />
          )}
          {currentPage === 'context' && (
            <ContextPage />
          )}
        </div>
      </div>
    </I18nProvider>
  );
};

export default App;




