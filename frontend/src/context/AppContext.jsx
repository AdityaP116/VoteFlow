import React, { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("vf_lang") || null);
  const [formData, setFormData] = useState({
    age: "",
    state: "",
    city: "",
    hasVoterId: "",
    recentlyMoved: "",
  });
  const [result, setResult] = useState(null);
  const [booth, setBooth] = useState(null);

  const setLanguage = (code) => {
    localStorage.setItem("vf_lang", code);
    setLang(code);
  };

  const updateForm = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const resetAll = () => {
    setFormData({ age: "", state: "", city: "", hasVoterId: "", recentlyMoved: "" });
    setResult(null);
    setBooth(null);
  };

  return (
    <AppContext.Provider
      value={{ lang, setLanguage, formData, updateForm, result, setResult, booth, setBooth, resetAll }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
