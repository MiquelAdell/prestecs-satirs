import { useTranslation } from "react-i18next";
import "./LanguageSelector.css";

const LANGUAGES = [
  { code: "ca", label: "CA" },
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
] as const;

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    void i18n.changeLanguage(lng);
  };

  return (
    <div className="language-selector">
      {LANGUAGES.map((lang, i) => (
        <span key={lang.code}>
          {i > 0 && <span> | </span>}
          <button
            className={i18n.language?.startsWith(lang.code) ? "active" : ""}
            onClick={() => changeLanguage(lang.code)}
          >
            {lang.label}
          </button>
        </span>
      ))}
    </div>
  );
}
