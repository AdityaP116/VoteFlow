import React from "react";
import { LANGUAGES } from "../constants/india";
import { useApp } from "../context/AppContext";
import { getStrings } from "../constants/india";
import TrustFooter from "../components/TrustFooter";

export default function LanguageScreen({ onNext }) {
  const { lang, setLanguage } = useApp();
  const s = getStrings(lang || "en");

  const handleSelect = (code) => {
    setLanguage(code);
  };

  const handleContinue = () => {
    if (lang) onNext();
  };

  return (
    <div className="app-shell">
      <div className="screen">
        {/* Hero tricolor stripe */}
        <div className="hero-flag" style={{ marginBottom: "var(--sp-8)" }}>
          <div className="flag-bar saffron" />
          <div className="flag-bar white" />
          <div className="flag-bar green" />
        </div>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-6)" }}>
          <div className="logo-mark" style={{ width: 48, height: 48, fontSize: "1.4rem" }}>🗳️</div>
          <div>
            <div className="logo-text" style={{ fontSize: "1.8rem" }}>VoteFlow</div>
            <div style={{ fontSize: "0.78rem", color: "var(--clr-text-secondary)", marginTop: 2 }}>
              Know Your Vote. Own Your Voice.
            </div>
          </div>
        </div>

        <h1 className="screen-title fade-up">{s.selectLanguage}</h1>
        <p className="screen-subtitle fade-up delay-1">
          Choose your preferred language to continue · अपनी भाषा चुनें
        </p>

        <div className="lang-grid fade-up delay-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              id={`lang-${l.code}`}
              className={`lang-option${lang === l.code ? " selected" : ""}`}
              onClick={() => handleSelect(l.code)}
            >
              <span className="lang-native">{l.native}</span>
              <span className="lang-english">{l.label}</span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: "auto", paddingTop: "var(--sp-8)" }}>
          <button
            id="lang-continue-btn"
            className="btn btn-primary fade-up delay-3"
            onClick={handleContinue}
            disabled={!lang}
          >
            {s.continue} →
          </button>
        </div>
      </div>

      <TrustFooter />
    </div>
  );
}
