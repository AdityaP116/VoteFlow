import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { getStrings, STATES, STATES_WITH_CITIES } from "../constants/india";
import Header from "../components/Header";
import TrustFooter from "../components/TrustFooter";

const TOTAL_STEPS = 4;

export default function FormScreen({ onNext, onBack }) {
  const { lang, formData, updateForm, setLanguage } = useApp();
  const s = getStrings(lang);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});

  const progress = (step / TOTAL_STEPS) * 100;

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (step === 1) {
      const age = parseInt(formData.age, 10);
      if (!formData.age || isNaN(age) || age < 1 || age > 120) {
        e.age = "Please enter a valid age (1–120).";
      }
    }
    if (step === 2) {
      if (!formData.state) e.state = "Please select a state.";
      if (!formData.city) e.city = "Please select a city.";
    }
    if (step === 3) {
      if (!formData.hasVoterId) e.hasVoterId = "Please select an option.";
    }
    if (step === 4) {
      if (!formData.recentlyMoved) e.recentlyMoved = "Please select an option.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      setErrors({});
    } else {
      onNext();
    }
  };

  const handleBack = () => {
    if (step === 1) { onBack(); }
    else { setStep((s) => s - 1); setErrors({}); }
  };

  const cities = formData.state ? STATES_WITH_CITIES[formData.state] || [] : [];

  return (
    <div className="app-shell">
      <Header onLangClick={() => {}} />

      {/* Progress */}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="step-label">
        <span>{s.step} {step} {s.of} {TOTAL_STEPS}</span>
        <span>{Math.round(progress)}%</span>
      </div>

      <div className="screen">
        <button className="back-btn" onClick={handleBack} id="form-back-btn">
          ← {s.back}
        </button>

        {/* ── Step 1: Age ── */}
        {step === 1 && (
          <div key="step1" className="fade-up">
            <h1 className="screen-title">{s.ageLabel}</h1>
            <p className="screen-subtitle">
              You must be 18 or older to vote in India.
            </p>
            <div className="form-group">
              <label className="form-label" htmlFor="age-input">{s.ageLabel}</label>
              <input
                id="age-input"
                type="number"
                inputMode="numeric"
                className={`form-input${errors.age ? " error" : ""}`}
                placeholder={s.agePlaceholder}
                value={formData.age}
                min={1}
                max={120}
                onChange={(e) => {
                  updateForm("age", e.target.value);
                  setErrors((prev) => ({ ...prev, age: undefined }));
                }}
              />
              {errors.age && <div className="form-error">⚠ {errors.age}</div>}
            </div>
          </div>
        )}

        {/* ── Step 2: State + City ── */}
        {step === 2 && (
          <div key="step2" className="fade-up">
            <h1 className="screen-title">{s.stateLabel}</h1>
            <p className="screen-subtitle">We use this to locate your polling booth.</p>

            <div className="form-group">
              <label className="form-label" htmlFor="state-select">{s.stateLabel}</label>
              <select
                id="state-select"
                className={`form-select${errors.state ? " error" : ""}`}
                value={formData.state}
                onChange={(e) => {
                  updateForm("state", e.target.value);
                  updateForm("city", "");
                  setErrors((prev) => ({ ...prev, state: undefined }));
                }}
              >
                <option value="">{s.statePlaceholder}</option>
                {STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              {errors.state && <div className="form-error">⚠ {errors.state}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="city-select">{s.cityLabel}</label>
              <select
                id="city-select"
                className={`form-select${errors.city ? " error" : ""}`}
                value={formData.city}
                disabled={!formData.state}
                onChange={(e) => {
                  updateForm("city", e.target.value);
                  setErrors((prev) => ({ ...prev, city: undefined }));
                }}
              >
                <option value="">{s.cityPlaceholder}</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.city && <div className="form-error">⚠ {errors.city}</div>}
            </div>
          </div>
        )}

        {/* ── Step 3: Voter ID ── */}
        {step === 3 && (
          <div key="step3" className="fade-up">
            <h1 className="screen-title">{s.voterIdLabel}</h1>
            <p className="screen-subtitle">
              Your Voter ID is issued by the Election Commission of India (EPIC card).
            </p>
            <div className="form-group">
              <div className="radio-group">
                {[
                  { value: "yes", label: s.voterIdYes, icon: "✅" },
                  { value: "no", label: s.voterIdNo, icon: "❌" },
                  { value: "not_sure", label: s.voterIdNotSure, icon: "🤔" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    id={`voter-id-${opt.value}`}
                    className={`radio-option${formData.hasVoterId === opt.value ? " selected" : ""}`}
                    onClick={() => {
                      updateForm("hasVoterId", opt.value);
                      setErrors((prev) => ({ ...prev, hasVoterId: undefined }));
                    }}
                  >
                    <div className="radio-dot" />
                    <span style={{ fontSize: "1.1rem" }}>{opt.icon}</span>
                    <span className="radio-label">{opt.label}</span>
                  </button>
                ))}
              </div>
              {errors.hasVoterId && <div className="form-error" style={{ marginTop: "var(--sp-3)" }}>⚠ {errors.hasVoterId}</div>}
            </div>
          </div>
        )}

        {/* ── Step 4: Recently Moved ── */}
        {step === 4 && (
          <div key="step4" className="fade-up">
            <h1 className="screen-title">{s.movedLabel}</h1>
            <p className="screen-subtitle">
              If you've moved, your current address may not match your voter registration.
            </p>
            <div className="form-group">
              <div className="radio-group">
                {[
                  { value: "yes", label: s.movedYes, icon: "🏠" },
                  { value: "no", label: s.movedNo, icon: "📍" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    id={`moved-${opt.value}`}
                    className={`radio-option${formData.recentlyMoved === opt.value ? " selected" : ""}`}
                    onClick={() => {
                      updateForm("recentlyMoved", opt.value);
                      setErrors((prev) => ({ ...prev, recentlyMoved: undefined }));
                    }}
                  >
                    <div className="radio-dot" />
                    <span style={{ fontSize: "1.1rem" }}>{opt.icon}</span>
                    <span className="radio-label">{opt.label}</span>
                  </button>
                ))}
              </div>
              {errors.recentlyMoved && <div className="form-error" style={{ marginTop: "var(--sp-3)" }}>⚠ {errors.recentlyMoved}</div>}
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <div style={{ marginTop: "auto", paddingTop: "var(--sp-6)" }}>
          <button
            id="form-next-btn"
            className="btn btn-primary"
            onClick={handleNext}
          >
            {step === TOTAL_STEPS ? s.checkEligibility : s.continue} →
          </button>
        </div>
      </div>

      <TrustFooter />
    </div>
  );
}
