/**
 * Main App Component
 */

import React, { useState, useEffect } from 'react';
import { I18nProvider } from './i18n';
import Dashboard from './pages/Dashboard';

const App: React.FC = () => {
  const [settings, setSettings] = useState({
    language: 'en',
    privacy: 'local',
    whisperModel: 'base',
    ollamaModel: 'llama3',
    theme: 'dark'
  });
  
  const [backendStatus, setBackendStatus] = useState(false);
  
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
      <Dashboard
        settings={settings}
        setSettings={updateSettings}
        backendStatus={backendStatus}
      />
    </I18nProvider>
  );
};

export default App;



