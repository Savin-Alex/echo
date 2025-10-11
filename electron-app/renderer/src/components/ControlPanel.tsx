/**
 * Control Panel Component
 * 
 * Start/stop controls and settings
 */

import React from 'react';
import { useT } from '../i18n';

interface ControlPanelProps {
  settings: any;
  setSettings: (settings: any) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ settings, setSettings }) => {
  const t = useT();
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({ language: e.target.value });
  };
  
  return (
    <div className="control-panel">
      <div className="control-group">
        <button className="btn-primary" onClick={() => window.echo.startCapture()}>
          {t('start')}
        </button>
        <button className="btn-secondary" onClick={() => window.echo.stopCapture()}>
          {t('stop')}
        </button>
      </div>
      
      <div className="control-group">
        <label htmlFor="language-select">{t('language')}:</label>
        <select 
          id="language-select"
          value={settings.language} 
          onChange={handleLanguageChange}
          className="select-input"
        >
          <option value="en">English</option>
          <option value="tr">Türkçe</option>
          <option value="fr">Français</option>
        </select>
      </div>
    </div>
  );
};

export default ControlPanel;




