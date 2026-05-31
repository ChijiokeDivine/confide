"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { Question, QuestionType } from "@/types";
import { getTemplateById, SURVEY_TEMPLATES } from "@/lib/templates";
import Sidebar from "@/components/Sidebar";
import AIFormGenerator from "@/components/AIFormGenerator";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "radio", label: "Multiple choice (single)" },
  { value: "checkbox", label: "Multiple choice (multi)" },
  { value: "dropdown", label: "Dropdown (single)" },
  { value: "scale", label: "Rating scale" },
  { value: "rating", label: "Star rating" },
  { value: "slider", label: "Range slider" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone number" },
  { value: "url", label: "Website URL" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "datetime", label: "Date & time" },
];

function newQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    type: "text",
    label: "",
    required: false,
    options: [],
    min: 1,
    max: 10,
    step: 1,
  };
}

export interface WhitelistConfig {
  enabled: boolean;
  identifierLabel: string;
  identifiers: string[];
}

export default function NewFormPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>Loading…</div>}>
      <NewFormInner />
    </Suspense>
  );
}

function NewFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");

  const [checkingBalance, setCheckingBalance] = useState(true);
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [questions, setQuestions] = useState<Question[]>([newQuestion()]);
  const [whitelist, setWhitelist] = useState<WhitelistConfig>({
    enabled: false,
    identifierLabel: "Email address",
    identifiers: [],
  });
  const [whitelistRaw, setWhitelistRaw] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  const STEP_BASICS = 0;
  const STEP_WHITELIST = 1;
  const STEP_QUESTIONS_START = 2;
  const totalSteps = STEP_QUESTIONS_START + questions.length;

  useEffect(() => {
    checkPlatformWalletBalance();
    if (templateId) {
      const tpl = getTemplateById(templateId);
      if (tpl) {
        setTitle(tpl.title);
        setDescription(tpl.description);
        setQuestions(tpl.questions.map((q) => ({ ...q, id: crypto.randomUUID() })));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkPlatformWalletBalance() {
    try {
      const res = await fetch("/api/wallet/balance");
      if (!res.ok) throw new Error("Failed to check balance");
      const data = await res.json();
      setInsufficientFunds(Number(data.balanceFormatted) < 0.1);
    } catch {
      // silent
    } finally {
      setCheckingBalance(false);
    }
  }

  function updateQuestion(id: string, patch: Partial<Question>) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function addOption(questionId: string) {
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === questionId ? { ...q, options: [...(q.options ?? []), ""] } : q
      )
    );
  }

  function updateOption(questionId: string, idx: number, val: string) {
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options?.map((o, i) => (i === idx ? val : o)) }
          : q
      )
    );
  }

  function removeOption(questionId: string, idx: number) {
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options?.filter((_, i) => i !== idx) }
          : q
      )
    );
  }

  function removeQuestion(id: string) {
    if (questions.length === 1) return;
    const newQs = questions.filter((q) => q.id !== id);
    setQuestions(newQs);
    if (currentStep >= STEP_QUESTIONS_START + newQs.length) {
      setCurrentStep(STEP_QUESTIONS_START + newQs.length - 1);
    }
  }

  function addQuestion() {
    setQuestions([...questions, newQuestion()]);
  }

  function parseIds(raw: string): string[] {
    return raw.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
  }

  function nextStep() {
    setError("");
    if (currentStep === STEP_BASICS) {
      if (!title.trim()) { setError("Survey title is required"); return; }
      setCurrentStep(STEP_WHITELIST);
    } else if (currentStep === STEP_WHITELIST) {
      const ids = parseIds(whitelistRaw);
      if (whitelist.enabled && ids.length === 0) {
        setError("Add at least one identifier, or disable the whitelist.");
        return;
      }
      setWhitelist((w) => ({ ...w, identifiers: ids }));
      setCurrentStep(STEP_QUESTIONS_START);
    } else {
      const q = questions[currentStep - STEP_QUESTIONS_START];
      if (!q.label.trim()) { setError("Question label is required"); return; }
      setCurrentStep(currentStep + 1);
    }
  }

  function prevStep() {
    if (currentStep > 0) { setError(""); setCurrentStep(currentStep - 1); }
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);
    const ids = parseIds(whitelistRaw);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          questions,
          closingDate: closingDate || null,
          whitelist: whitelist.enabled
            ? { enabled: true, identifierLabel: whitelist.identifierLabel, identifiers: ids }
            : { enabled: false, identifierLabel: whitelist.identifierLabel, identifiers: [] },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create survey");
      setLoading(false);
    }
  }

  function stepLabel() {
    if (currentStep === STEP_BASICS) return "Survey details";
    if (currentStep === STEP_WHITELIST) return "Access control";
    return `Question ${currentStep - STEP_QUESTIONS_START + 1} of ${questions.length}`;
  }

  return (
    <Sidebar>
      <main className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12 pb-24">
        {!checkingBalance && insufficientFunds && (
          <div className="anim-in mb-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-8 text-center">
            <h2 className="text-2xl font-semibold text-yellow-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Insufficient Platform Funds
            </h2>
            <p className="text-yellow-800 mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              The platform wallet needs funds to allocate CDR vaults for survey responses. Please top up the wallet and try again.
            </p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-yellow-600 px-6 py-3 text-sm font-semibold text-white hover:bg-yellow-700 transition-colors"
              style={{ fontFamily: "'DM Sans', sans-serif" }}>
              ← Back to Dashboard
            </Link>
          </div>
        )}

        {checkingBalance && (
          <div className="anim-in text-center py-20">
            <img src="/wired-flat-966-privacy-policy-hover-swipe.gif" alt="Preparing form"
              className="mx-auto mb-6 w-48 h-48 object-contain" />
            <p className="text-neutral-900 text-lg" style={{ fontFamily: "'DM Sans', sans-serif" }}>Preparing your form...</p>
          </div>
        )}

        {!checkingBalance && !insufficientFunds && (
          <>
            {templateId && (
              <div className="anim-in mb-5 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M1 5h12M5 5v8" stroke="currentColor" strokeWidth="1.2"/></svg>
                <span className="text-xs text-neutral-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Starting from a template — customise freely
                </span>
                <Link href="/templates" className="text-xs text-neutral-400 hover:text-neutral-700 ml-1 transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}>Change</Link>
              </div>
            )}

            {/* Template Suggestion */}
            {!templateId && currentStep === STEP_BASICS && (
              <div className="anim-in mb-8 rounded-2xl border border-neutral-100 bg-white p-5 md:p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm md:text-md font-semibold text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      Start from a template
                    </h3>
                    <div className="relative group">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-neutral-400 cursor-help">
                        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M7 4v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        <path d="M7 10h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Pick a pre-built survey and customise it.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900"></div>
                      </div>
                    </div>
                  </div>
                  <Link href="/templates"
                    className="text-xs md:text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors flex-shrink-0"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    View all →
                  </Link>
                </div>
              </div>
            )}

            {/* AI Generating Label */}
            {isAIGenerating && (
              <div className="anim-in mb-4 flex items-center gap-2">
                <div className="ai-conic-spinner"></div>
                <p className="text-sm font-medium ai-gradient-text" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Generating with AI…
                </p>
              </div>
            )}

            {/* Progress */}
            <div className="anim-in mb-8">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {stepLabel()}
                </p>
                <p className="text-xs text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {currentStep + 1} / {totalSteps}
                </p>
              </div>
              <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-400 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }} />
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 anim-in"
                style={{ fontFamily: "'DM Sans', sans-serif" }}>{error}</div>
            )}

            {/* Step 0: Basics */}
            {currentStep === STEP_BASICS && (
              <div className={`anim-in ${isAIGenerating ? "ai-generating-border" : ""}`}>
                <div className={`rounded-2xl p-6 md:p-8 space-y-5 ${isAIGenerating ? "ai-generating-border-inner" : "border border-neutral-100 bg-white"}`}>
                  <h2 className="text-xl md:text-2xl font-semibold text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Let's start with the basics
                  </h2>
                  <p className="text-neutral-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Give your survey a title and a short description for your respondents.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Survey title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`w-full font-semibold px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 transition-all focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300 text-sm md:text-lg ${isAIGenerating ? "ai-shimmer-input" : ""}`}
                      placeholder="e.g., Employee satisfaction Q3 2025"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Description (optional)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 transition-all focus:ring-1 focus:ring-neutral-300 resize-none text-sm md:text-md ${isAIGenerating ? "ai-shimmer-input" : ""}`}
                      placeholder="Brief description shown to respondents"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Closing date (optional)</label>
                    <input
                      type="datetime-local"
                      value={closingDate}
                      onChange={(e) => setClosingDate(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 transition-all focus:ring-1 focus:ring-neutral-300 text-sm md:text-md ${isAIGenerating ? "ai-shimmer-input" : ""}`}
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    />
                    <p className="text-xs text-neutral-400 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      The survey will automatically stop accepting responses after this date and time.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Whitelist */}
            {currentStep === STEP_WHITELIST && (
              <div className="anim-in space-y-4">
                <div className={`${isAIGenerating ? "ai-generating-border" : ""}`}>
                  <div className={`rounded-2xl p-6 md:p-8 space-y-5 ${isAIGenerating ? "ai-generating-border-inner" : "border border-neutral-100 bg-neutral-50"}`}>
                    <div>
                      <h2 className="text-xl md:text-2xl font-semibold text-neutral-900 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Access control
                      </h2>
                      <p className="text-neutral-500 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Restrict who can submit this form. Only people on your whitelist will be allowed to respond — and each identifier may only be used once.
                      </p>
                    </div>

                    {/* Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-neutral-200">
                      <div>
                        <p className="text-sm font-medium text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>Enable whitelist</p>
                        <p className="text-xs text-neutral-400 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          Require respondents to match an identifier you provide
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={whitelist.enabled}
                        onClick={() => setWhitelist((w) => ({ ...w, enabled: !w.enabled }))}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent toggle-track focus:outline-none ${whitelist.enabled ? "bg-neutral-900" : "bg-neutral-200"}`}
                      >
                        <span className={`toggle-thumb pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ${whitelist.enabled ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>

                    {whitelist.enabled && (
                      <div className="space-y-5">
                        {/* Identifier type label */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-[0.12em]"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            What will respondents enter to access the form?
                          </label>
                          <select
                            value={whitelist.identifierLabel}
                            onChange={(e) => setWhitelist((w) => ({ ...w, identifierLabel: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 bg-white focus:ring-1 focus:ring-neutral-300"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                          >
                            <option>Email address</option>
                            <option>Employee ID</option>
                            <option>Wallet address</option>
                            <option>Unique access code</option>
                            <option>Staff number</option>
                            <option>National ID / Passport number</option>
                            <option>Participant reference number</option>
                          </select>
                        </div>

                        {/* Identifiers list */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-[0.12em]"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            Allowed identifiers
                          </label>
                          <textarea
                            value={whitelistRaw}
                            onChange={(e) => setWhitelistRaw(e.target.value)}
                            rows={8}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-sm font-mono transition-all focus:ring-1 focus:ring-neutral-300 resize-none"
                            placeholder={"Paste one per line, or comma-separated:\nalice@company.com\nbob@company.com\ncharlie@company.com"}
                            style={{ fontFamily: "ui-monospace, monospace" }}
                          />
                          <p className="text-xs text-neutral-400 mt-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            {parseIds(whitelistRaw).length} identifier{parseIds(whitelistRaw).length !== 1 ? "s" : ""} entered · Accepts newlines, commas, or semicolons
                          </p>
                        </div>

                        {/* Privacy note */}
                        <div className="rounded-xl border border-neutral-100 bg-white px-4 py-3 flex items-start gap-3">
                          <div className="mt-0.5 w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1L1.5 2.5v3C1.5 7.5 3 8.5 5 9c2-0.5 3.5-1.5 3.5-3.5v-3L5 1z" stroke="white" strokeWidth="1" strokeLinejoin="round"/></svg>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-neutral-800 mb-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Privacy-preserving by design</p>
                            <p className="text-xs text-neutral-500 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                              Identifiers are hashed (SHA-256, form-scoped salt) before storage. The system verifies a match without retaining raw values. You cannot see <em>who</em> submitted — only whether a slot was used.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!whitelist.enabled && (
                      <div className="rounded-xl bg-white border border-neutral-100 px-4 py-3">
                        <p className="text-sm text-neutral-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          Whitelist off — anyone with the link can submit. You can still close the form at any time from your dashboard.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2+: Questions */}
            {currentStep >= STEP_QUESTIONS_START && (() => {
              const qIndex = currentStep - STEP_QUESTIONS_START;
              const q = questions[qIndex];
              return (
                <div key={q.id} className={`anim-in ${isAIGenerating ? "ai-generating-border" : ""}`}>
                  <div className={`rounded-2xl p-6 md:p-8 shadow-sm space-y-6 ${isAIGenerating ? "ai-generating-border-inner" : "border border-neutral-100 bg-white"}`}>
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl md:text-2xl font-semibold text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Question {qIndex + 1}
                      </h2>
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        disabled={questions.length === 1}
                        className="p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-[0.12em]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Question</label>
                        <input
                          type="text"
                          value={q.label}
                          onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                          className={`w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-900 text-sm transition-all focus:ring-1 focus:ring-neutral-300 ${isAIGenerating ? "ai-shimmer-input" : ""}`}
                          placeholder="Enter your question…"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        />
                      </div>
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="flex-1 w-full">
                          <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-[0.12em]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Type</label>
                          <select
                            value={q.type}
                            onChange={(e) => updateQuestion(q.id, { type: e.target.value as QuestionType, options: [] })}
                            className={`w-full px-3 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 bg-white focus:ring-1 focus:ring-neutral-300 ${isAIGenerating ? "ai-shimmer-input" : ""}`}
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                          >
                            {QUESTION_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`req-${q.id}`}
                            checked={q.required}
                            onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                            className="rounded border-neutral-300"
                          />
                          <label htmlFor={`req-${q.id}`} className="text-sm text-neutral-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>Required</label>
                        </div>
                      </div>
                      {(q.type === "radio" || q.type === "checkbox" || q.type === "dropdown") && (
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-[0.12em]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Options</label>
                          <div className="space-y-2">
                            {(q.options ?? []).map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className={`w-3.5 h-3.5 border border-neutral-300 flex-shrink-0 ${q.type === "radio" ? "rounded-full" : q.type === "checkbox" ? "rounded" : "hidden"}`} />
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => updateOption(q.id, i, e.target.value)}
                                  className={`flex-1 px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-900 focus:ring-1 focus:ring-neutral-300 ${isAIGenerating ? "ai-shimmer-input" : ""}`}
                                  placeholder={`Option ${i + 1}`}
                                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                                />
                                <button type="button" onClick={() => removeOption(q.id, i)}
                                  className="text-neutral-400 hover:text-red-500 transition-colors p-1">
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                </button>
                              </div>
                            ))}
                            <button type="button" onClick={() => addOption(q.id)}
                              className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
                              style={{ fontFamily: "'DM Sans', sans-serif" }}>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                              Add option
                            </button>
                          </div>
                        </div>
                      )}
                      {(q.type === "scale" || q.type === "slider" || q.type === "number") && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-[0.12em]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Min</label>
                            <input
                              type="number"
                              value={q.min ?? 1}
                              min={0}
                              onChange={(e) => updateQuestion(q.id, { min: parseInt(e.target.value) })}
                              className={`w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm text-center focus:ring-1 focus:ring-neutral-300 ${isAIGenerating ? "ai-shimmer-input" : ""}`}
                              style={{ fontFamily: "'DM Sans', sans-serif" }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-[0.12em]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Max</label>
                            <input
                              type="number"
                              value={q.max ?? 10}
                              min={1}
                              onChange={(e) => updateQuestion(q.id, { max: parseInt(e.target.value) })}
                              className={`w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm text-center focus:ring-1 focus:ring-neutral-300 ${isAIGenerating ? "ai-shimmer-input" : ""}`}
                              style={{ fontFamily: "'DM Sans', sans-serif" }}
                            />
                          </div>
                          {(q.type === "slider" || q.type === "number") && (
                            <div>
                              <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-[0.12em]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Step</label>
                              <input
                                type="number"
                                value={q.step ?? 1}
                                min={0.01}
                                step={0.01}
                                onChange={(e) => updateQuestion(q.id, { step: parseFloat(e.target.value) })}
                                className={`w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm text-center focus:ring-1 focus:ring-neutral-300 ${isAIGenerating ? "ai-shimmer-input" : ""}`}
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Navigation */}
            <div className="flex flex-row items-stretch md:items-center justify-between gap-4 mt-8">
              <div className="flex items-center gap-3">
                {currentStep > 0 ? (
                  <button onClick={prevStep}
                    className="flex items-center gap-2 px-3 py-2 md:px-5 md:py-2 rounded-full border border-neutral-200 text-neutral-700 md:text-md text-sm hover:bg-neutral-50 transition-colors"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Back
                  </button>
                ) : !templateId ? (
                  <button onClick={() => setShowAIGenerator(true)}
                    className="flex items-center gap-2 px-3 py-2 md:px-5 md:py-2 rounded-full border border-neutral-200 text-neutral-700 md:text-md text-sm hover:bg-neutral-50 transition-colors"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      <path d="M4 4l4 4M8 4l-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    Generate with AI
                  </button>
                ) : <div />}
                {currentStep >= STEP_QUESTIONS_START && (
                  <button onClick={addQuestion}
                    className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2 rounded-full border border-dashed border-neutral-200 text-neutral-600 text-sm font-medium hover:border-neutral-400 hover:text-neutral-900 transition-colors"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    Add question
                  </button>
                )}
              </div>
              <div>
                {currentStep < totalSteps - 1 ? (
                  <button onClick={nextStep}
                    className="flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-2 rounded-full bg-neutral-900 text-white font-semibold md:text-md text-sm hover:bg-neutral-800 transition-colors active:scale-[0.98]"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Next
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 py-2 md:px-5 md:py-3 rounded-full bg-neutral-900 text-white font-semibold md:text-md text-sm hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {loading ? "Creating survey…" : "Create survey"}
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* AI Form Generator Modal */}
        {showAIGenerator && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAIGenerator(false)}
          >
            <AIFormGenerator
              onGenerated={(questions, title, description) => {
                setIsAIGenerating(true);
                setQuestions(questions);
                setTitle(title);
                setDescription(description);
                setTimeout(() => setIsAIGenerating(false), 1000);
              }}
              onClose={() => setShowAIGenerator(false)}
            />
          </div>
        )}

        <style>{`
          @keyframes gradientShift {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          @keyframes pulseOpacity {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.85; }
          }

          @keyframes spinConic {
            to { transform: rotate(360deg); }
          }

          .ai-generating-border {
            position: relative;
            z-index: 1;
          }

          .ai-generating-border::before {
            content: '';
            position: absolute;
            inset: -2px;
            border-radius: 16px;
            background: linear-gradient(135deg, #4285F4, #9B59B6, #EA4C89, #00BCD4, #4285F4);
            background-size: 400% 400%;
            animation: gradientShift 3s linear infinite, pulseOpacity 3s ease-in-out infinite;
            filter: blur(0.5px);
            z-index: -1;
          }

          .ai-generating-border-inner {
            background: white;
            border-radius: 16px;
            width: 100%;
            height: 100%;
          }

          .ai-shimmer-input {
            background: linear-gradient(135deg, rgba(66,133,244,0.08), rgba(155,89,182,0.08), rgba(234,76,137,0.08), rgba(0,188,212,0.08), rgba(66,133,244,0.08));
            background-size: 400% 400%;
            animation: gradientShift 3s linear infinite;
          }

          @media (max-width: 768px) {
            .ai-shimmer-input {
              background: white;
            }
          }

          .ai-gradient-text {
            background: linear-gradient(135deg, #4285F4, #9B59B6, #EA4C89, #00BCD4, #4285F4);
            background-size: 400% 400%;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
            animation: gradientShift 3s linear infinite;
          }

          .ai-conic-spinner {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: conic-gradient(from 0deg, #4285F4, #9B59B6, #EA4C89, #00BCD4, #4285F4);
            animation: spinConic 1s linear infinite;
            flex-shrink: 0;
          }
        `}</style>
      </main>
    </Sidebar>
  );
}