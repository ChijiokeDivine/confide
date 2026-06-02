"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Form, Question } from "@/types";

type FormWithWhitelist = Form & {
  whitelist_enabled: boolean;
  whitelist_identifier_label: string;
  closing_date: string | null;
};

export default function PublicFormPage() {
  const params = useParams<{ formId: string }>();
  const [form, setForm] = useState<FormWithWhitelist | null>(null);
  const [formClosed, setFormClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  // currentStep: when whitelist_enabled, step 0 = identifier input, steps 1..N = questions
  // when !whitelist_enabled, steps 0..N-1 = questions
  const [currentStep, setCurrentStep] = useState(0);

  const [whitelistIdentifier, setWhitelistIdentifier] = useState("");
  const [whitelistError, setWhitelistError] = useState("");

  useEffect(() => {
    setMounted(true);
    if (params.formId) fetchForm();
  }, [params.formId]);

  async function fetchForm() {
    if (!params.formId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/forms/${params.formId}/public`);
      if (!res.ok) throw new Error("Form not found");
      const data = await res.json();
      const formData = data.form;
      setForm(formData);
      // Check if form is closed by date
      if (formData.closing_date) {
        const closingDate = new Date(formData.closing_date);
        if (new Date() > closingDate) {
          setFormClosed(true);
        }
      }
    } catch {
      setError("This survey could not be found or is no longer active.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step helpers ───────────────────────────────────────────────────────────
  // When whitelist_enabled:   step 0 = identifier gate, steps 1..N = questions
  // When !whitelist_enabled:  steps 0..N-1 = questions
  function isIdentifierStep() {
    return !!form?.whitelist_enabled && currentStep === 0;
  }

  function questionIndex() {
    // maps currentStep → index into form.questions
    return form?.whitelist_enabled ? currentStep - 1 : currentStep;
  }

  function totalSteps() {
    if (!form) return 0;
    return form.whitelist_enabled ? form.questions.length + 1 : form.questions.length;
  }

  function isLastStep() {
    return currentStep === totalSteps() - 1;
  }

  // ── Answer helpers ─────────────────────────────────────────────────────────
  function handleAnswer(questionId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleCheckboxAnswer(questionId: string, option: string, checked: boolean) {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) ?? [];
      if (checked) return { ...prev, [questionId]: [...current, option] };
      return { ...prev, [questionId]: current.filter((v) => v !== option) };
    });
  }

  function canGoNext() {
    if (!form) return false;

    // Identifier step validation
    if (isIdentifierStep()) {
      return whitelistIdentifier.trim() !== "";
    }

    // Question step validation
    const qi = questionIndex();
    const q = form.questions[qi];
    if (!q) return false;
    if (q.required) {
      const ans = answers[q.id];
      if (
        ans === undefined ||
        ans === "" ||
        (Array.isArray(ans) && (ans as unknown[]).length === 0)
      )
        return false;
    }
    return true;
  }

  async function handleNext() {
    if (!form) return;
    setError("");
    setWhitelistError("");

    // If we're on the identifier step, verify against the whitelist API first
    if (isIdentifierStep()) {
      if (!whitelistIdentifier.trim()) {
        setWhitelistError(`Please enter your ${form.whitelist_identifier_label.toLowerCase()}.`);
        return;
      }
      try {
        const res = await fetch("/api/whitelist/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formId: params.formId, identifier: whitelistIdentifier }),
        });
        const data = await res.json();
        if (!data.allowed) {
          setWhitelistError(data.reason || "Access denied. Your identifier is not on the allow list.");
          return;
        }
      } catch {
        setWhitelistError("Could not verify your identifier. Please try again.");
        return;
      }
    }

    setCurrentStep((s) => s + 1);
  }

  function prevStep() {
    setError("");
    setWhitelistError("");
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  async function handleSubmit() {
    if (!form || !params.formId) return;
    setError("");

    // Guard: whitelist identifier must be present
    if (form.whitelist_enabled && !whitelistIdentifier.trim()) {
      setError("An access identifier is required to submit this form.");
      return;
    }

    // Guard: all required questions answered
    const missing = form.questions.filter(
      (q) =>
        q.required &&
        (answers[q.id] === undefined ||
          answers[q.id] === "" ||
          (Array.isArray(answers[q.id]) && (answers[q.id] as unknown[]).length === 0))
    );
    if (missing.length > 0) {
      setError(
        `Please answer all required questions (${missing.map((q) => `"${q.label}"`).join(", ")}).`
      );
      return;
    }

    const labelledAnswers: Record<string, unknown> = {};
    form.questions.forEach((q) => {
      labelledAnswers[q.label] = answers[q.id] ?? null;
    });

    setSubmitting(true);
    try {
      const res = await fetch("/api/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: params.formId,
          answers: labelledAnswers,
          whitelistIdentifier: form.whitelist_enabled ? whitelistIdentifier : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading / error / closed shells ────────────────────────────────────────
  if (!mounted || loading) {
    return (
      <div className="anim-in min-h-screen flex flex-col items-center justify-center text-center">
        <img
          src="/wired-flat-966-privacy-policy-hover-swipe.gif"
          alt="Preparing form"
          className="mb-6 w-48 h-48 object-contain"
        />
        <p
          className="text-neutral-900 text-xl"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Loading form...
        </p>
      </div>
    );
  }

  if (formClosed) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 w-14 h-14 rounded-full bg-neutral-200 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-neutral-500">
            <path d="M3.6665 7.33337C3.6665 5.49245 5.15904 4.00001 6.99996 4.00001H15C16.8409 4.00001 18.3334 5.49245 18.3334 7.33337V14.6667C18.3334 16.5076 16.8409 18 15 18H6.99996C5.15904 18 3.6665 16.5076 3.6665 14.6667V7.33337Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11 9.66667V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11 15.6667H11.0092" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1
          className="text-2xl font-semibold text-neutral-900 mb-2"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          This survey is closed
        </h1>
        <p
          className="text-neutral-500 max-w-sm"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          This survey is no longer accepting responses.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M4 11l5 5 9-9"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1
          className="text-2xl font-semibold text-neutral-900 mb-2"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Response submitted
        </h1>
        <p
          className="text-neutral-500 max-w-sm mb-2"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Your answers have been encrypted and stored on-chain. The survey creator is the only one
          who can read them.
        </p>
        <p className="text-xs text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Powered by CDR · Story Protocol
        </p>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <p className="text-neutral-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {error}
        </p>
      </div>
    );
  }

  const steps = totalSteps();

  return (
    <div className={`min-h-screen bg-white ${mounted ? "ready" : ""}`}>
      <style>{`
        .anim-in { opacity: 0; }
        .ready .anim-in { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        input:focus, textarea:focus, select:focus { outline: none; box-shadow: none; }
      `}</style>

      <main className="min-h-screen flex flex-col items-center justify-start pt-10 md:pt-16 px-4 pb-24">
        <div className="w-full max-w-xl">

          {/* ── Form Header ─────────────────────────────────────────────────── */}
          {form && (
            <div className="anim-in mb-8">
              <p
                className="text-xs uppercase  text-neutral-400 mb-10 flex items-center gap-2"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
               
                Encrypted - only the creator can read your answers
              </p>
              <h1
                className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-2"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {form.title}
              </h1>
              {form.description && (
                <p className="text-neutral-500 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {form.description}
                </p>
              )}

              
            </div>
          )}

          {/* ── Progress Bar ─────────────────────────────────────────────────── */}
          {form && steps > 0 && (
            <div className="anim-in mb-8">
              <p
                className="text-xs uppercase tracking-[0.18em] text-neutral-400 mb-3"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Step {currentStep + 1} of {steps}
              </p>
              <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-neutral-400 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / steps) * 100}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div
              className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 anim-in"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {error}
            </div>
          )}

          {/* ── Step Content ─────────────────────────────────────────────────── */}
          {form && (
            <div className="anim-in" key={currentStep}>

              {/* ── Identifier Step (always rendered when whitelist_enabled & step 0) ── */}
              {isIdentifierStep() && (
                <div className="space-y-5 mb-8">
                  {/* Header card */}
                  <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-5 flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="2" y="7" width="12" height="9" rx="2" stroke="white" strokeWidth="1.4" />
                        <path
                          d="M5 7V5a3 3 0 0 1 6 0v2"
                          stroke="white"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3
                        className="text-base font-semibold text-neutral-900 mb-1"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        This survey is restricted
                      </h3>
                      <p
                        className="text-sm text-neutral-500 leading-relaxed"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Enter your{" "}
                        {form.whitelist_identifier_label.toLowerCase()} to continue.
                      </p>
                    </div>
                  </div>

                  {/* Input */}
                  <div>
                    <label
                      className="block text-lg font-medium text-neutral-800 mb-3"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {form.whitelist_identifier_label}
                      <span className="ml-1 text-neutral-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={whitelistIdentifier}
                      onChange={(e) => {
                        setWhitelistIdentifier(e.target.value);
                        setWhitelistError("");
                        setError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && canGoNext()) handleNext();
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-sm transition-all focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300"
                      placeholder={`Enter your ${form.whitelist_identifier_label.toLowerCase()}…`}
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                      autoFocus
                    />
                    {whitelistError && (
                      <p
                        className="mt-2 text-sm text-red-600"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {whitelistError}
                      </p>
                    )}
                  </div>

                  {/* Privacy notice */}
                  <div className="rounded-xl border border-neutral-100 bg-white px-4 py-4 space-y-2">
                    
                    <p
                      className="text-xs text-neutral-500 leading-relaxed"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Identifiers are hashed using{" "}
                      <span className="font-medium text-neutral-700">SHA-256</span> with a
                      form-scoped salt before storage. The system verifies matches without storing
                      raw identifier values. Form creators cannot see who submitted the form —
                      only that an allowed slot was used.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Question Steps ───────────────────────────────────────────── */}
              {!isIdentifierStep() && (() => {
                const qi = questionIndex();
                const q = form.questions[qi];
                if (!q) return null;

                return (
                  <div className="space-y-4 mb-8">
                    <label
                      className="block text-lg font-medium text-neutral-800"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {q.label}
                      {q.required && <span className="ml-1 text-neutral-400">*</span>}
                    </label>

                    {q.type === "text" && (
                      <input
                        type="text"
                        value={(answers[q.id] as string) ?? ""}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 text-sm focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300 transition-all"
                        placeholder="Your answer…"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      />
                    )}

                    {q.type === "email" && (
                      <input
                        type="email"
                        value={(answers[q.id] as string) ?? ""}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 text-sm focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300 transition-all"
                        placeholder="you@example.com"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      />
                    )}

                    {q.type === "textarea" && (
                      <textarea
                        value={(answers[q.id] as string) ?? ""}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 text-sm focus:ring-1 focus:ring-neutral-300 transition-all resize-none"
                        placeholder="Your answer…"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      />
                    )}

                    {q.type === "radio" && (
                      <div className="space-y-3">
                        {(q.options ?? []).map((opt) => (
                          <label
                            key={opt}
                            className="flex items-center gap-3 cursor-pointer group p-4 rounded-xl border border-neutral-100 hover:border-neutral-300 transition-colors"
                          >
                            <input
                              type="radio"
                              name={q.id}
                              value={opt}
                              checked={(answers[q.id] as string) === opt}
                              onChange={() => handleAnswer(q.id, opt)}
                              className="w-4 h-4 border-neutral-300 text-neutral-900"
                            />
                            <span
                              className="text-sm text-neutral-700 group-hover:text-neutral-900 transition-colors"
                              style={{ fontFamily: "'DM Sans', sans-serif" }}
                            >
                              {opt}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === "checkbox" && (
                      <div className="space-y-3">
                        {(q.options ?? []).map((opt) => (
                          <label
                            key={opt}
                            className="flex items-center gap-3 cursor-pointer group p-4 rounded-xl border border-neutral-100 hover:border-neutral-300 transition-colors"
                          >
                            <input
                              type="checkbox"
                              value={opt}
                              checked={((answers[q.id] as string[]) ?? []).includes(opt)}
                              onChange={(e) => handleCheckboxAnswer(q.id, opt, e.target.checked)}
                              className="w-4 h-4 rounded border-neutral-300 text-neutral-900"
                            />
                            <span
                              className="text-sm text-neutral-700 group-hover:text-neutral-900 transition-colors"
                              style={{ fontFamily: "'DM Sans', sans-serif" }}
                            >
                              {opt}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === "scale" && (
                      <div>
                        <div className="flex gap-1.5 flex-wrap">
                          {Array.from(
                            { length: (q.max ?? 10) - (q.min ?? 1) + 1 },
                            (_, i) => (q.min ?? 1) + i
                          ).map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => handleAnswer(q.id, n)}
                              className={`w-10 h-10 rounded-xl text-sm font-medium transition-all border ${
                                answers[q.id] === n
                                  ? "bg-neutral-900 text-white border-neutral-900"
                                  : "border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
                              }`}
                              style={{ fontFamily: "'DM Sans', sans-serif" }}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <span
                            className="text-xs text-neutral-400"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                          >
                            {q.min ?? 1} = Not at all
                          </span>
                          <span
                            className="text-xs text-neutral-400"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                          >
                            Extremely = {q.max ?? 10}
                          </span>
                        </div>
                      </div>
                    )}

                    {q.type === "dropdown" && (
                      <select
                        value={(answers[q.id] as string) ?? ""}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-sm focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300 transition-all"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        <option value="" disabled>
                          Select an option…
                        </option>
                        {(q.options ?? []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {q.type === "rating" && (
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleAnswer(q.id, star)}
                            className="text-3xl transition-all focus:outline-none"
                          >
                            {(answers[q.id] as number) >= star ? "⭐" : "☆"}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.type === "slider" && (
                      <div>
                        <input
                          type="range"
                          min={q.min ?? 1}
                          max={q.max ?? 100}
                          step={q.step ?? 1}
                          value={(answers[q.id] as number) ?? (q.min ?? 1)}
                          onChange={(e) => handleAnswer(q.id, Number(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between mt-2">
                          <span
                            className="text-xs text-neutral-400"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                          >
                            {q.min ?? 1}
                          </span>
                          <span
                            className="text-sm font-medium text-neutral-900"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                          >
                            {(answers[q.id] as number) ?? (q.min ?? 1)}
                          </span>
                          <span
                            className="text-xs text-neutral-400"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                          >
                            {q.max ?? 100}
                          </span>
                        </div>
                      </div>
                    )}

                    {q.type === "number" && (
                      <input
                        type="number"
                        min={q.min}
                        max={q.max}
                        step={q.step ?? 1}
                        value={(answers[q.id] as number) ?? ""}
                        onChange={(e) =>
                          handleAnswer(
                            q.id,
                            e.target.value === "" ? undefined : Number(e.target.value)
                          )
                        }
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 text-sm focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300 transition-all"
                        placeholder="Your answer…"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      />
                    )}

                    {q.type === "date" && (
                      <input
                        type="date"
                        value={(answers[q.id] as string) ?? ""}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 text-sm focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300 transition-all"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      />
                    )}

                    {q.type === "time" && (
                      <input
                        type="time"
                        value={(answers[q.id] as string) ?? ""}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 text-sm focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300 transition-all"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      />
                    )}

                    {q.type === "datetime" && (
                      <input
                        type="datetime-local"
                        value={(answers[q.id] as string) ?? ""}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 text-sm focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300 transition-all"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      />
                    )}

                    {q.type === "phone" && (
                      <input
                        type="tel"
                        value={(answers[q.id] as string) ?? ""}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 text-sm focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300 transition-all"
                        placeholder="+1 555 123 4567"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      />
                    )}

                    {q.type === "url" && (
                      <input
                        type="url"
                        value={(answers[q.id] as string) ?? ""}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 text-sm focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300 transition-all"
                        placeholder="https://example.com"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      />
                    )}
                  </div>
                );
              })()}

              {/* ── Identifier reminder on last question step (whitelist forms) ── */}
              {form.whitelist_enabled && isLastStep() && !isIdentifierStep() && (
                <div className="mb-6">
                  <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M5 1L1.5 2.5v3C1.5 7.5 3 8.5 5 9c2-.5 3.5-1.5 3.5-3.5v-3L5 1z"
                          stroke="white"
                          strokeWidth="1"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <p
                        className="text-xs font-medium text-neutral-800 mb-0.5"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Submitting as: {whitelistIdentifier}
                      </p>
                      <p
                        className="text-xs text-neutral-500 leading-relaxed"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Your identifier is hashed with SHA-256 — the creator cannot tell who
                        submitted.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Navigation ───────────────────────────────────────────────── */}
              <div className="flex items-center justify-between gap-4">
                {currentStep > 0 ? (
                  <button
                    onClick={prevStep}
                    className="flex items-center gap-2 px-5 py-3 rounded-full border border-neutral-200 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M10 4l-4 4 4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {!isLastStep() ? (
                  <button
                    onClick={handleNext}
                    disabled={!canGoNext()}
                    className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2 rounded-full bg-neutral-900 text-white font-semibold hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {isIdentifierStep() ? "Verify & continue" : "Next"}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M6 4l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !canGoNext()}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900 text-white font-semibold hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {submitting ? "Encrypting & submitting…" : "Submit response"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}