import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { b, t as bilingualText, type Bi } from "./data";

const storageKey = "solo-pacific-bilingual";
const LanguageContext = createContext({
  bilingual: true,
  setBilingual: (_value: boolean) => {},
  t: bilingualText,
  text: (en: string, zh: string) => bilingualText(b(en, zh)),
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [bilingual, setBilingual] = useState(() => {
    try {
      return localStorage.getItem(storageKey) !== "false";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    document.title = bilingual
      ? "Solo Pacific Sailboat Atlas（独航太平洋帆船图谱）"
      : "Solo Pacific Sailboat Atlas";
    try {
      localStorage.setItem(storageKey, String(bilingual));
    } catch {
      // Storage can be unavailable; the in-memory preference still works.
    }
  }, [bilingual]);
  const value = useMemo(
    () => ({
      bilingual,
      setBilingual,
      t: (value: Bi) => (bilingual ? bilingualText(value) : value.en),
      text: (en: string, zh: string) =>
        bilingual ? bilingualText(b(en, zh)) : en,
    }),
    [bilingual],
  );
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
