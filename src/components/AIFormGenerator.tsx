"use client";

import { useState } from "react";
import type { Question } from "@/types";

interface AIFormGeneratorProps {
  onGenerated: (questions: Question[], title: string, description: string) => void;
  onClose: () => void;
}

export default function AIFormGenerator({ onGenerated, onClose }: AIFormGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError("Please enter a prompt to describe your form.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      onGenerated(data.questions, data.title, data.description);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-6 max-w-lg w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-5">
        <h2
          className="text-lg font-semibold text-neutral-900"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Generate form with AI
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 2l14 14M16 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium text-neutral-700 mb-2"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Describe your form
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="Describe your form — e.g. 'Collect conflict of interest disclosures from employees' or 'Post-incident workplace injury report'"
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-neutral-900"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          />
        </div>

        {error && (
          <div className="text-sm text-red-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-neutral-900 text-white rounded-xl px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="10 15" />
                </svg>
                Generating your form…
              </>
            ) : (
              "Generate form"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
