/**
 * Status Badge Component
 * 
 * Displays backend connection status
 */

import React from 'react';
import { useT } from '../i18n';

interface StatusBadgeProps {
  connected: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ connected }) => {
  const t = useT();
  
  return (
    <div className="status-badge">
      <span 
        className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}
        title={t(connected ? 'connected' : 'disconnected')}
      >
        {connected ? '●' : '○'}
      </span>
      <span className="status-text">
        {t(connected ? 'connected' : 'disconnected')}
      </span>
    </div>
  );
};

export default StatusBadge;




