"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { createPortal } from "react-dom";
import { supabaseBrowser } from "@/lib/supabase-client";
import type { Question } from "@/types";
import Sidebar from "@/components/Sidebar";
import { pdf } from "@react-pdf/renderer";
import ResponsePDF from "@/components/ResponsePDF";

type ResultsData = {
  formId: string;
  totalResponses: number;
  failedDecryptions: number;
  answers: Record<string, unknown[]>;
  rawResponses: Array<{ responseId: string; submittedAt: string; answers: Record<string, unknown> }>;
  questions: Question[];
  formTitle: string;
  formDescription?: string | null;
};

type CacheEntry = {
  iv: number[];
  data: number[];
  responseCount: number;
  cachedAt: number;
};

// ─── Cache helpers (AES-GCM encrypted localStorage) ───────────────────────────

function cacheKey(formId: string): string {
  return `Confyde:results:${formId}`;
}

/** Derive an AES-GCM key from the Supabase access token (never stored). */
async function deriveAESKey(accessToken: string): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(accessToken.slice(0, 64));
  const keyMaterial = await crypto.subtle.importKey("raw", raw, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode("confide-results-cache-v1"),
      info: new TextEncoder().encode("aes-gcm-key"),
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function readCache(formId: string, accessToken: string): Promise<ResultsData | null> {
  try {
    const raw = localStorage.getItem(cacheKey(formId));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    const key = await deriveAESKey(accessToken);
    const iv = new Uint8Array(entry.iv);
    const ciphertext = new Uint8Array(entry.data);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return JSON.parse(new TextDecoder().decode(plaintext)) as ResultsData;
  } catch {
    // Corrupted or wrong key — treat as miss
    return null;
  }
}

async function writeCache(formId: string, accessToken: string, data: ResultsData): Promise<void> {
  try {
    const key = await deriveAESKey(accessToken);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(data));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
    const entry: CacheEntry = {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(ciphertext)),
      responseCount: data.totalResponses,
      cachedAt: Date.now(),
    };
    localStorage.setItem(cacheKey(formId), JSON.stringify(entry));
  } catch (e) {
    console.warn("Cache write failed:", e);
  }
}

function getCacheResponseCount(formId: string): number | null {
  try {
    const raw = localStorage.getItem(cacheKey(formId));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    return entry.responseCount;
  } catch {
    return null;
  }
}

function getCacheMeta(formId: string): { cachedAt: number; responseCount: number } | null {
  try {
    const raw = localStorage.getItem(cacheKey(formId));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    return { cachedAt: entry.cachedAt, responseCount: entry.responseCount };
  } catch {
    return null;
  }
}

function clearCache(formId: string): void {
  localStorage.removeItem(cacheKey(formId));
}

// ─── Component ────────────────────────────────────────────────────────────────

type LoadSource = "cache" | "cdr" | null;

export default function ResultsPage() {
  const params = useParams<{ formId: string }>();

  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState("Checking for cached results…");
  const [error, setError] = useState("");
  const [view, setView] = useState<"summary" | "individual">("summary");
  const [loadSource, setLoadSource] = useState<LoadSource>(null);
  const [cacheMeta, setCacheMeta] = useState<{ cachedAt: number; responseCount: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{ blob: Blob; filename: string } | null>(null);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exportDropdownPosition, setExportDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);

  function updateExportDropdownPosition() {
    const button = exportButtonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const dropdownWidth = 224;
    const viewportPadding = 16;
    const left = Math.min(
      Math.max(viewportPadding, rect.right - dropdownWidth),
      window.innerWidth - dropdownWidth - viewportPadding
    );

    setExportDropdownPosition({
      top: rect.bottom + 8,
      left,
    });
  }

  function toggleExportDropdown() {
    if (exportDropdownOpen) {
      setExportDropdownOpen(false);
      return;
    }

    updateExportDropdownPosition();
    setExportDropdownOpen(true);
  }

  // Export functions
  async function exportToPDF(response: ResultsData["rawResponses"][0], previewOnly = false) {
    if (!results) return;
    
    const blob = await pdf(
      <ResponsePDF
        formTitle={results.formTitle}
        formDescription={results.formDescription ?? undefined}
        response={response}
        questions={results.questions}
      />
    ).toBlob();

    const filename = `${(results.formTitle || "response").replace(/[^a-zA-Z0-9-_]/g, "_")}_response_${response.responseId.slice(0,8)}_${new Date().toISOString().split("T")[0]}.pdf`;

    if (previewOnly) {
      setPdfPreview({ blob, filename });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  async function exportToCSV() {
    if (!params.formId) return;
    const url = `/api/export?formId=${params.formId}&type=csv`;
    window.location.href = url;
    setExportDropdownOpen(false);
  }

  function exportToJSON() {
    if (!results) return;
    const dataStr = JSON.stringify(results.rawResponses, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(results.formTitle || "responses").replace(/[^a-zA-Z0-9-_]/g, "_")}_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDropdownOpen(false);
  }

  const loadResults = useCallback(async (forceRefresh = false) => {
    if (!params.formId) return;

    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setLoadingMsg("Checking for cached results…");
      }

      // Get the creator's session token (used as key material — never stored)
      const sb = supabaseBrowser();
      const { data: sessionData } = await sb.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setError("Session expired. Please log in again.");
        return;
      }

      // ── 1. Cheaply fetch the live response count from Supabase ──────────────
      //    This is a fast, free metadata call — no CDR gas.
      setLoadingMsg("Checking response count…");
      const countRes = await fetch(`/api/results?formId=${params.formId}&countOnly=true`);
      const countData = await countRes.json();
      if (!countRes.ok) throw new Error(countData.error);
      const liveCount: number = countData.totalResponses;

      // ── 2. Try the encrypted local cache ────────────────────────────────────
      if (!forceRefresh) {
        const cachedCount = getCacheResponseCount(params.formId);
        if (cachedCount !== null && cachedCount === liveCount) {
          setLoadingMsg("Decrypting cached results…");
          const cached = await readCache(params.formId, accessToken);
          // Check if cache has formTitle (new format), otherwise clear and re-fetch
          if (cached && cached.formTitle) {
            setResults(cached);
            setLoadSource("cache");
            setCacheMeta(getCacheMeta(params.formId));
            setLoading(false);
            return;
          } else {
            clearCache(params.formId);
          }
        }
      }

      // ── 3. Cache miss or stale — pay gas, fetch from CDR ────────────────────
      setLoadingMsg("Decrypting responses from CDR vaults…");
      const res = await fetch(`/api/results?formId=${params.formId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // ── 4. Encrypt and cache the fresh results ───────────────────────────────
      await writeCache(params.formId, accessToken, data);

      setResults(data);
      setLoadSource("cdr");
      setCacheMeta(getCacheMeta(params.formId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load results.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params.formId]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  useEffect(() => {
    if (!exportDropdownOpen) return;

    const handleReposition = () => updateExportDropdownPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [exportDropdownOpen]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      const isDropdownButton = target.closest('[data-export-dropdown-button]');
      const isDropdownMenu = target.closest('[data-dropdown-menu]');
      
      if (!isDropdownButton && !isDropdownMenu) {
        setExportDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  async function handleForceRefresh() {
    clearCache(params.formId!);
    setLoadSource(null);
    setCacheMeta(null);
    await loadResults(true);
  }

  // ─── Chart renderers (unchanged) ─────────────────────────────────────────
  function renderSummaryQuestion(label: string, values: unknown[]) {
    if (values.length === 0)
      return <p className="text-sm text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>No answers yet</p>;

    const firstVal = values[0];

    if (Array.isArray(firstVal)) {
      const flat = values.flat() as string[];
      const counts: Record<string, number> = {};
      flat.forEach((v) => { counts[String(v)] = (counts[String(v)] ?? 0) + 1; });
      const max = Math.max(...Object.values(counts));
      return (
        <div className="space-y-2">
          {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([opt, count]) => (
            <div key={opt} className="flex items-center gap-3">
              <span className="text-sm text-neutral-700 w-32 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>{opt}</span>
              <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div className="h-full bg-neutral-900 rounded-full transition-all" style={{ width: `${(count / max) * 100}%` }} />
              </div>
              <span className="text-sm font-medium text-neutral-900 w-16 text-right" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {count} ({Math.round((count / flat.length) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (typeof firstVal === "number") {
      const nums = values as number[];
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
      const counts: Record<number, number> = {};
      nums.forEach((v) => { counts[v] = (counts[v] ?? 0) + 1; });
      const max = Math.max(...Object.values(counts));
      return (
        <div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-semibold text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>{avg.toFixed(1)}</span>
            <span className="text-sm text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>avg / {nums.length} response{nums.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-end gap-1.5 h-12">
            {Object.entries(counts).sort((a, b) => Number(a[0]) - Number(b[0])).map(([val, count]) => (
              <div key={val} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-neutral-900 rounded-sm" style={{ height: `${Math.round((count / max) * 40)}px` }} />
                <span className="text-[10px] text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const strVals = values as string[];
    const unique = [...new Set(strVals)];

    if (unique.length <= 8 && strVals.length > 1) {
      const counts: Record<string, number> = {};
      strVals.forEach((v) => { counts[v] = (counts[v] ?? 0) + 1; });
      const max = Math.max(...Object.values(counts));
      return (
        <div className="space-y-2">
          {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([opt, count]) => (
            <div key={opt} className="flex items-center gap-3">
              <span className="text-sm text-neutral-700 w-28 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>{opt}</span>
              <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
              </div>
              <span className="text-sm font-medium text-neutral-900 w-16 text-right" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {count} ({Math.round((count / strVals.length) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2 max-h-52 overflow-y-auto">
        {strVals.map((v, i) => (
          <div key={i} className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-700"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {v || <span className="text-neutral-400 italic">—</span>}
          </div>
        ))}
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Sidebar>
      <style>{`
        .anim-in { opacity: 0; }
        .ready .anim-in { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <img 
              src="/wired-flat-981-consultation-hover-conversation.gif" 
              alt="Loading"
              className="w-48 h-48 object-contain"
            />
            <div className="text-center">
              <p className="text-neutral-900 text-lg" style={{ fontFamily: "'DM Sans', sans-serif" }}>{loadingMsg}</p>
              <p className="text-sm text-neutral-400 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {loadingMsg.includes("CDR") ? "Paying gas to decrypt from vaults — this is charged once then cached." : "No gas charged."}
              </p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>{error}</div>
        )}

        {results && !loading && (
          <>
            {/* Header */}
            <div className="anim-in mb-6">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-400 mb-2"
                style={{ fontFamily: "'DM Sans', sans-serif" }}>Survey results</p>

              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl font-semibold text-neutral-900 mb-1"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {results.totalResponses} response{results.totalResponses !== 1 ? "s" : ""}
                  </h1>
                  {results.failedDecryptions > 0 && (
                    <p className="text-xs text-amber-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {results.failedDecryptions} vault{results.failedDecryptions > 1 ? "s" : ""} could not be decrypted
                    </p>
                  )}
                </div>

                {/* View and export actions */}
                <div className="flex items-center gap-3 flex-wrap relative" >
                  {/* Export Dropdown */}
                  <div className="relative " >
                    <button
                      ref={exportButtonRef}
                      data-export-dropdown-button
                      onClick={toggleExportDropdown}
                      className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-neutral-600">
                        <path d="M4 17V7C4 5.89543 4.89543 5 6 5H13L20 12V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                        <path d="M13 5V12H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 13L10 15L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Export
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={`text-neutral-400 transition-transform ${exportDropdownOpen ? 'rotate-180' : ''}`}>
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  
                  {/* View toggle */}
                  <div className="flex rounded-xl border border-neutral-200 overflow-hidden">
                    {(["summary", "individual"] as const).map((v) => (
                      <button key={v} onClick={() => setView(v)}
                        className={`px-4 py-2 text-sm transition-colors ${view === v ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-50"}`}
                        style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {v === "summary" ? "Summary" : "Individual"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cache status bar */}
            <div className={`anim-in mb-6 rounded-xl px-4 py-3 flex items-center justify-between gap-3 ${
              loadSource === "cache"
                ? "border border-green-100 bg-green-50"
                : "border border-neutral-100 bg-neutral-50"
            }`}>
              <div className="flex items-center gap-2.5">
                {loadSource === "cache" ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-green-600 flex-shrink-0">
                      <path d="M7 1L1.5 3.5v4C1.5 10 4 12 7 12.5c3-.5 5.5-2.5 5.5-5v-4L7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                      <path d="M4.5 7l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-xs text-green-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      <strong>Loaded from encrypted cache</strong> <span className="hidden md:inline">— gas charged.</span>
                      {cacheMeta && (
                        <span className="text-green-600 ml-1 font-normal hidden md:inline">
                          Cached {Math.round((Date.now() - cacheMeta.cachedAt) / 60000)}m ago.
                        </span>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-neutral-500 flex-shrink-0">
                      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    <span className="text-xs text-neutral-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      <strong>Decrypted from CDR vaults</strong> — gas charged once, now cached locally.
                    </span>
                  </>
                )}
              </div>

              <button
                onClick={handleForceRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 disabled:opacity-50 transition-colors flex-shrink-0"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
                title="Clear cache and re-decrypt from CDR (charges gas)"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={refreshing ? "spin" : ""}>
                  <path d="M10.5 6A4.5 4.5 0 1 1 6 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <path d="M6 1.5L8 3.5M6 1.5L8 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {refreshing ? "Re-decrypting…" : "Force refresh"}
              </button>
            </div>

            {/* Results content */}
            {results.totalResponses === 0 ? (
              <div className="anim-in rounded-2xl border border-dashed border-neutral-200 py-12 flex flex-col items-center justify-center text-center">
                <p className="text-neutral-400 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>No responses yet</p>
                <p className="text-sm text-neutral-300" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Share your survey link to start collecting encrypted responses.
                </p>
              </div>
            ) : view === "summary" ? (
              <div className="space-y-5">
                {Object.entries(results.answers).map(([label, values]) => (
                  <div key={label} className="anim-in rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-neutral-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>{label}</h3>
                    {renderSummaryQuestion(label, values)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {results.rawResponses.map((response, idx) => (
                  <div key={response.responseId} className="anim-in rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Response #{results.rawResponses.length - idx}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          {new Date(response.submittedAt).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                        <button onClick={() => exportToPDF(response, true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-neutral-500">
                            <path d="M6 20H18C19.1046 20 20 19.1046 20 18V8L14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22V20Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M8 16H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          Preview PDF
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(response.answers).map(([label, val]) => (
                        <div key={label} className="border-b border-neutral-50 pb-3 last:border-0 last:pb-0">
                          <p className="text-xs text-neutral-400 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
                          <p className="text-sm text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            {Array.isArray(val) ? val.join(", ") : String(val ?? "—")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="anim-in mt-8 flex items-center gap-2 text-xs text-neutral-400">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1L1.5 3v3.5C1.5 9 3.5 11 6 11.5c2.5-.5 4.5-2.5 4.5-5V3L6 1z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Results are cached encrypted in your browser with AES-256-GCM — readable only with your session. Gas is charged on CDR access only.
              </span>
            </div>
          </>
        )}
      </main>

      {/* PDF Preview Modal */}
      {exportDropdownOpen && exportDropdownPosition && createPortal(
        <div
          data-dropdown-menu
          className="fixed w-56 rounded-xl border border-neutral-200 bg-white py-1 shadow-lg z-[1200]"
          style={{ top: exportDropdownPosition.top, left: exportDropdownPosition.left }}
        >
          <button onClick={exportToCSV}
            className="w-full px-4 py-2.5 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-neutral-500">
              <path d="M9 17H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 13H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 9H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M4 19C4 19.5304 4.21071 20.0391 4.58579 20.4142C4.96086 20.7893 5.46957 21 6 21H18C18.5304 21 19.0391 20.7893 19.4142 20.4142C19.7893 20.0391 20 19.5304 20 19V5C20 4.46957 19.7893 3.96086 19.4142 3.58579C19.0391 3.21071 18.5304 3 18 3H6C5.46957 3 4.96086 3.21071 4.58579 3.58579C4.21071 3.96086 4 4.46957 4 5V19Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            Export as CSV
          </button>
          <button onClick={exportToJSON}
            className="w-full px-4 py-2.5 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-neutral-500">
              <path d="M4 7H7C8.06087 7 9.07828 7.42143 9.82843 8.17157C10.5786 8.92172 11 9.93913 11 11C11 12.0609 10.5786 13.0783 9.82843 13.8284C9.07828 14.5786 8.06087 15 7 15H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 17H17C15.9391 17 14.9217 16.5786 14.1716 15.8284C13.4214 15.0783 13 14.0609 13 13C13 11.9391 13.4214 10.9217 14.1716 10.1716C14.9217 9.42143 15.9391 9 17 9H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export as JSON
          </button>
        </div>,
        document.body
      )}

      {pdfPreview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPdfPreview(null)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h3 className="text-lg font-semibold text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {pdfPreview.filename}
              </h3>
              <div className="flex items-center gap-3">
                <button onClick={() => {
                  const url = URL.createObjectURL(pdfPreview.blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = pdfPreview.filename;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Download
                </button>
                <button onClick={() => setPdfPreview(null)}
                  className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                  title="Close preview">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-neutral-500">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <iframe
                src={URL.createObjectURL(pdfPreview.blob)}
                className="w-full h-[70vh] border border-neutral-200 rounded-xl"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
}
