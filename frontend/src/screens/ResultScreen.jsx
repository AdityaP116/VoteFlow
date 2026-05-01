import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { getStrings } from "../constants/india";
import { evaluate, getPollingBooth } from "../api";
import Header from "../components/Header";
import TrustFooter from "../components/TrustFooter";

const STATUS_CONFIG = {
  UNDERAGE: {
    icon: "🚫",
    label: "Underage",
    className: "underage",
    pillClass: "underage",
  },
  ELIGIBLE_NOT_REGISTERED: {
    icon: "📋",
    label: "Not Registered",
    className: "eligible-not-registered",
    pillClass: "eligible",
  },
  REGISTERED_MOVED: {
    icon: "🏠",
    label: "Update Required",
    className: "registered-moved",
    pillClass: "moved",
  },
  REGISTERED_VALID: {
    icon: "✅",
    label: "Registered & Valid",
    className: "registered-valid",
    pillClass: "valid",
  },
};

export default function ResultScreen({ onBack, onReset }) {
  const { lang, formData, result, setResult, booth, setBooth } = useApp();
  const s = getStrings(lang);

  const [loadingEval, setLoadingEval] = useState(!result);
  const [loadingBooth, setLoadingBooth] = useState(false);
  const [error, setError] = useState(null);

  /* ── Call /evaluate on mount if no cached result ── */
  useEffect(() => {
    if (result) return;
    const payload = {
      age: parseInt(formData.age, 10),
      state: formData.state,
      city: formData.city,
      hasVoterId: formData.hasVoterId,
      recentlyMoved: formData.recentlyMoved === "yes",
    };
    evaluate(payload)
      .then((data) => {
        setResult(data);
        setLoadingEval(false);
      })
      .catch((err) => {
        setError(err?.response?.data?.error || "Failed to reach server. Please try again.");
        setLoadingEval(false);
      });
  }, []);

  /* ── Call /polling-booth when result is REGISTERED_VALID ── */
  useEffect(() => {
    if (!result || result.status !== "REGISTERED_VALID" || booth) return;
    setLoadingBooth(true);
    getPollingBooth(formData.state, formData.city)
      .then((data) => {
        setBooth(data);
        setLoadingBooth(false);
      })
      .catch(() => {
        setBooth({ status: "LOW_CONFIDENCE", fallback_url: "https://eci.gov.in" });
        setLoadingBooth(false);
      });
  }, [result]);

  const cfg = result ? STATUS_CONFIG[result.status] : null;

  /* ── Loading state ── */
  if (loadingEval) {
    return (
      <div className="app-shell">
        <Header />
        <div className="screen">
          <div className="loader">
            <div className="spinner" />
            <span className="loader-text">{s.checking}</span>
          </div>
        </div>
        <TrustFooter />
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="app-shell">
        <Header />
        <div className="screen">
          <div className="warning-box" style={{ marginBottom: "var(--sp-6)" }}>
            <span style={{ fontSize: "1.4rem" }}>⚠️</span>
            <p className="warning-text">{error}</p>
          </div>
          <button className="btn btn-secondary" onClick={onBack} id="error-back-btn">← {s.back}</button>
        </div>
        <TrustFooter />
      </div>
    );
  }

  const mapsUrl = booth?.booth?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booth.booth.address + ", " + formData.city + ", " + formData.state)}`
    : null;

  return (
    <div className="app-shell">
      <Header />

      <div className="screen">
        <button className="back-btn" onClick={onBack} id="result-back-btn">← {s.back}</button>

        <h1 className="screen-title fade-up">{s.result}</h1>

        {/* ── Status Banner ── */}
        {cfg && (
          <div className={`status-banner ${cfg.className} fade-up delay-1`}>
            <span className="status-icon">{cfg.icon}</span>
            <div>
              <span className={`status-pill ${cfg.pillClass}`}>
                ● {cfg.label}
              </span>
              <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--clr-text-primary)", marginTop: "var(--sp-1)" }}>
                {result.message}
              </p>
            </div>
          </div>
        )}

        {/* ── Next Actions ── */}
        {result?.next_actions?.length > 0 && (
          <div className="fade-up delay-2" style={{ marginBottom: "var(--sp-6)" }}>
            <div className="section-head">{s.nextActions}</div>
            <ul className="steps-list">
              {result.next_actions.map((action, i) => (
                <li key={i} className="step-item">
                  <span className="step-num">{i + 1}</span>
                  <span className="step-text">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Required Docs ── */}
        {result?.required_steps?.length > 0 && (
          <div className="fade-up delay-3" style={{ marginBottom: "var(--sp-6)" }}>
            <div className="section-head">{s.requiredDocs}</div>
            <div className="card" style={{ padding: "var(--sp-4)" }}>
              <ul className="steps-list">
                {result.required_steps.map((doc, i) => (
                  <li key={i} className="step-item">
                    <span className="step-num">📄</span>
                    <span className="step-text">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── Polling Booth Section ── */}
        {result?.status === "REGISTERED_VALID" && (
          <div className="fade-up delay-4" style={{ marginBottom: "var(--sp-6)" }}>
            <div className="section-head">{s.boothDetails}</div>

            {loadingBooth && (
              <div className="loader" style={{ padding: "var(--sp-6) 0" }}>
                <div className="spinner" />
                <span className="loader-text">{s.loadingBooth}</span>
              </div>
            )}

            {!loadingBooth && booth?.status === "LOW_CONFIDENCE" && (
              <div className="warning-box">
                <span style={{ fontSize: "1.2rem" }}>⚠️</span>
                <div>
                  <p className="warning-text">{s.lowConfidenceWarning}</p>
                  <a
                    href="https://eci.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-blue btn-sm"
                    id="eci-fallback-btn"
                    style={{ marginTop: "var(--sp-3)", display: "inline-flex" }}
                  >
                    🔗 {s.checkOnECI}
                  </a>
                </div>
              </div>
            )}

            {!loadingBooth && booth?.status === "FOUND" && (
              <div className="card">
                <div className="booth-field">
                  <span className="booth-icon">🏛️</span>
                  <div>
                    <div className="booth-label">Booth Name</div>
                    <div className="booth-value">{booth.booth.name}</div>
                  </div>
                </div>
                <div className="booth-field">
                  <span className="booth-icon">📍</span>
                  <div>
                    <div className="booth-label">Address</div>
                    <div className="booth-value">{booth.booth.address}</div>
                  </div>
                </div>
                <div className="booth-field">
                  <span className="booth-icon">🗺️</span>
                  <div>
                    <div className="booth-label">Constituency</div>
                    <div className="booth-value">{booth.booth.constituency}</div>
                  </div>
                </div>
                {booth.booth.last_updated && (
                  <div className="booth-field">
                    <span className="booth-icon">🕒</span>
                    <div>
                      <div className="booth-label">{s.lastUpdated}</div>
                      <div className="booth-value" style={{ fontSize: "0.8rem" }}>
                        {new Date(booth.booth.last_updated).toLocaleDateString("en-IN")}
                      </div>
                    </div>
                  </div>
                )}

                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    id="maps-btn"
                    style={{ marginTop: "var(--sp-4)" }}
                  >
                    🗺️ {s.openMaps}
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Source Badge ── */}
        {result?.source && (
          <div className="fade-up" style={{ marginBottom: "var(--sp-5)" }}>
            <span className="source-badge">
              🏛️ {s.source}: {result.source}
            </span>
          </div>
        )}

        {/* ── Start Over ── */}
        <button
          id="start-over-btn"
          className="btn btn-secondary"
          onClick={onReset}
          style={{ marginTop: "var(--sp-2)" }}
        >
          🔄 Start Over
        </button>
      </div>

      <TrustFooter />
    </div>
  );
}
