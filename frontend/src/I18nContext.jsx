import { createContext, useContext } from 'react';
import { translate } from './i18n';

const I18nContext = createContext('en');

export function I18nProvider({ lang, children }) {
  return <I18nContext.Provider value={lang}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const lang = useContext(I18nContext);
  return (key) => translate(lang, key);
}
