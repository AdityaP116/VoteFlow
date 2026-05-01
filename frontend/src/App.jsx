import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import LanguageScreen from "./screens/LanguageScreen";
import FormScreen from "./screens/FormScreen";
import ResultScreen from "./screens/ResultScreen";

// Screens enum
const SCREEN = { LANGUAGE: "LANGUAGE", FORM: "FORM", RESULT: "RESULT" };

function AppInner() {
  const { lang, resetAll } = useApp();
  const [screen, setScreen] = useState(
    lang ? SCREEN.FORM : SCREEN.LANGUAGE
  );

  const handleReset = () => {
    resetAll();
    setScreen(SCREEN.LANGUAGE);
  };

  return (
    <>
      {screen === SCREEN.LANGUAGE && (
        <LanguageScreen onNext={() => setScreen(SCREEN.FORM)} />
      )}
      {screen === SCREEN.FORM && (
        <FormScreen
          onNext={() => setScreen(SCREEN.RESULT)}
          onBack={() => setScreen(SCREEN.LANGUAGE)}
        />
      )}
      {screen === SCREEN.RESULT && (
        <ResultScreen
          onBack={() => setScreen(SCREEN.FORM)}
          onReset={handleReset}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
