import React from "react";
import { useApp } from "../context/AppContext";

export default function Header({ onLangClick }) {
  const { lang } = useApp();
  return (
    <header className="app-header">
      <div className="logo-mark">🗳️</div>
      <span className="logo-text">VoteFlow</span>
      {lang && (
        <button className="lang-badge" onClick={onLangClick} id="change-lang-btn">
          {lang.toUpperCase()}
        </button>
      )}
    </header>
  );
}
