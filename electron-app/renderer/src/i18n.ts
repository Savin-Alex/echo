/**
 * Internationalization (i18n) Support
 */

import React, { createContext, useContext } from 'react';

interface Translations {
  [key: string]: string;
}

const translations: { [lang: string]: Translations } = {
  en: {
    title: 'Echo Copilot',
    start: 'Start',
    stop: 'Stop',
    summarize: 'Summarize',
    reply: 'Reply',
    generate: 'Generate',
    loading: 'Loading...',
    backendStatus: 'Backend Status',
    connected: 'Connected',
    disconnected: 'Disconnected',
    inputPlaceholder: 'Enter text to process...',
    settings: 'Settings',
    language: 'Language',
    privacy: 'Privacy Mode',
    local: 'Local Only',
    cloud: 'Allow Cloud',
    whisperModel: 'Whisper Model',
    ollamaModel: 'Ollama Model'
  },
  tr: {
    title: 'Echo Yardımcısı',
    start: 'Başlat',
    stop: 'Durdur',
    summarize: 'Özetle',
    reply: 'Yanıtla',
    generate: 'Oluştur',
    loading: 'Yükleniyor...',
    backendStatus: 'Sunucu Durumu',
    connected: 'Bağlı',
    disconnected: 'Bağlantı Yok',
    inputPlaceholder: 'İşlenecek metni girin...',
    settings: 'Ayarlar',
    language: 'Dil',
    privacy: 'Gizlilik Modu',
    local: 'Yalnızca Yerel',
    cloud: 'Buluta İzin Ver',
    whisperModel: 'Whisper Modeli',
    ollamaModel: 'Ollama Modeli'
  },
  fr: {
    title: 'Echo Copilote',
    start: 'Démarrer',
    stop: 'Arrêter',
    summarize: 'Résumer',
    reply: 'Répondre',
    generate: 'Générer',
    loading: 'Chargement...',
    backendStatus: 'État du Backend',
    connected: 'Connecté',
    disconnected: 'Déconnecté',
    inputPlaceholder: 'Entrez le texte à traiter...',
    settings: 'Paramètres',
    language: 'Langue',
    privacy: 'Mode Confidentialité',
    local: 'Local Seulement',
    cloud: 'Autoriser le Cloud',
    whisperModel: 'Modèle Whisper',
    ollamaModel: 'Modèle Ollama'
  }
};

interface I18nContextType {
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  t: (key: string) => key
});

export function useT(): (key: string) => string {
  const context = useContext(I18nContext);
  return context.t;
}

export function makeT(lang: string): (key: string) => string {
  const langTranslations = translations[lang] || translations.en;
  return (key: string) => langTranslations[key] || key;
}

export const I18nProvider: React.FC<{ language: string; children: React.ReactNode }> = ({ 
  language, 
  children 
}) => {
  const t = makeT(language);
  return React.createElement(I18nContext.Provider, { value: { t } }, children);
};



