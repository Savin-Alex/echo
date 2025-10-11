/**
 * Dashboard Page
 * 
 * Main application interface
 */

import React, { useState } from 'react';
import { useT } from '../i18n';
import StatusBadge from '../components/StatusBadge';
import ControlPanel from '../components/ControlPanel';

interface DashboardProps {
  settings: any;
  setSettings: (settings: any) => void;
  backendStatus: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  settings, 
  setSettings, 
  backendStatus 
}) => {
  const t = useT();
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSummarize = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    try {
      const response = await window.echo.summarize(text);
      setResult(response.summary || response.error || 'No response');
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleReply = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    try {
      const response = await window.echo.reply(text);
      setResult(response.reply || response.error || 'No response');
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>{t('title')}</h1>
        <StatusBadge connected={backendStatus} />
      </header>
      
      <ControlPanel settings={settings} setSettings={setSettings} />
      
      <main className="dashboard-content">
        <div className="input-section">
          <textarea
            className="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('inputPlaceholder')}
            rows={8}
            disabled={loading}
          />
          
          <div className="button-group">
            <button 
              className="btn-primary"
              onClick={handleSummarize}
              disabled={loading || !backendStatus || !text.trim()}
            >
              {loading ? t('loading') : t('summarize')}
            </button>
            
            <button 
              className="btn-primary"
              onClick={handleReply}
              disabled={loading || !backendStatus || !text.trim()}
            >
              {loading ? t('loading') : t('reply')}
            </button>
          </div>
        </div>
        
        <div className="result-section">
          <h3>Result:</h3>
          <pre className="result-output">{result}</pre>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;



