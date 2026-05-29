"use client";

import Link from "next/link";
import { useState } from "react";
import { SURVEY_TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates";
import Sidebar from "@/components/Sidebar";

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [preview, setPreview] = useState<string | null>(null);

  const filtered =
    activeCategory === "All"
      ? SURVEY_TEMPLATES
      : SURVEY_TEMPLATES.filter((t) => t.category === activeCategory);

  const previewTemplate = SURVEY_TEMPLATES.find((t) => t.id === preview);

  return (
    <Sidebar>
      <style>{`
        .anim-in { opacity: 0; animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        .anim-in.d1 { animation-delay: 0.05s; }
        .anim-in.d2 { animation-delay: 0.12s; }
        .anim-in.d3 { animation-delay: 0.2s; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .card-hover { transition: border-color 0.15s, box-shadow 0.15s; }
        .card-hover:hover { border-color: #d4d4d4; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .overlay-enter { animation: overlayIn 0.25s cubic-bezier(0.22,1,0.36,1) forwards; }
        @keyframes overlayIn { from { opacity:0; } to { opacity:1; } }
        .panel-enter { animation: panelIn 0.3s cubic-bezier(0.22,1,0.36,1) forwards; }
        @keyframes panelIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        input:focus, textarea:focus, select:focus { outline: none; }
      `}</style>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14">
        {/* Page title */}
        <div className="anim-in d1 mb-8 md:mb-10">
          <p
            className="text-xs uppercase tracking-[0.18em] text-neutral-400 mb-2"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Survey Templates
          </p>
          <h1
            className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900 mb-3"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Start from a template
          </h1>
          <p
            className="text-neutral-500 max-w-xl"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Professionally designed, privacy-first survey templates for the private sector. Pick one, customise, and publish — all responses are end-to-end encrypted.
          </p>
        </div>

        {/* Category filter */}
        <div className="anim-in d2 flex flex-wrap gap-2 mb-8">
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeCategory === cat
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
              }`}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="anim-in d3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((template) => (
            <div
              key={template.id}
              className="card-hover rounded-2xl border border-neutral-100 bg-white p-6 flex flex-col"
            >
              {/* Category badge */}
              <span
                className={`inline-flex self-start items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium mb-4 ${template.categoryColor}`}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {template.category}
              </span>

              {/* Title + description */}
              <h2
                className="text-base font-semibold text-neutral-900 mb-2"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {template.title}
              </h2>
              <p
                className="text-sm text-neutral-500 leading-relaxed flex-1 mb-5"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {template.description}
              </p>

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-neutral-400 mb-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M6 3v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  {template.estimatedTime}
                </span>
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M2 6h5M2 9h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  {template.questions.length} questions
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/forms/new?template=${template.id}`}
                  className="flex-1 flex items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors active:scale-[0.98]"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Use template
                </Link>
                <button
                  onClick={() => setPreview(template.id)}
                  className="flex items-center justify-center rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Blank slate prompt */}
        <div className="mt-10 rounded-2xl border border-dashed border-neutral-200 p-8 flex flex-col md:flex-row items-center gap-4 justify-between">
          <div>
            <p
              className="font-medium text-neutral-800 mb-1"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Need something custom?
            </p>
            <p
              className="text-sm text-neutral-500"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Build your own survey from scratch with full control over question types and whitelist access.
            </p>
          </div>
          <Link
            href="/forms/new"
            className="flex-shrink-0 flex items-center gap-2 rounded-full border border-neutral-900 px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-900 hover:text-white transition-all"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Start from scratch
          </Link>
        </div>
      </main>

      {/* Preview Drawer */}
      {preview && previewTemplate && (
        <>
          {/* Overlay */}
          <div
            className="overlay-enter fixed inset-0 bg-black/30 z-40"
            onClick={() => setPreview(null)}
          />
          {/* Panel */}
          <div className="panel-enter fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
            {/* Panel header */}
            <div className="border-b border-neutral-100 px-6 py-5 flex items-center justify-between">
              <div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium mb-1.5 ${previewTemplate.categoryColor}`}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {previewTemplate.category}
                </span>
                <h3
                  className="text-base font-semibold text-neutral-900"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {previewTemplate.title}
                </h3>
              </div>
              <button
                onClick={() => setPreview(null)}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <p
                className="text-sm text-neutral-500 leading-relaxed"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {previewTemplate.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-neutral-400 pb-2 border-b border-neutral-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <span>⏱ {previewTemplate.estimatedTime}</span>
                <span>📋 {previewTemplate.questions.length} questions</span>
                <span>💼 {previewTemplate.useCase}</span>
              </div>

              <div className="space-y-4">
                {previewTemplate.questions.map((q, i) => (
                  <div key={q.id} className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] font-semibold text-neutral-600"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium text-neutral-800 mb-1"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {q.label}
                          {q.required && (
                            <span className="text-neutral-400 ml-1 font-normal">*</span>
                          )}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs text-neutral-400 bg-white border border-neutral-200 rounded-full px-2 py-0.5"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                          >
                            {q.type === "radio"
                              ? "Single choice"
                              : q.type === "checkbox"
                              ? "Multi-select"
                              : q.type === "scale"
                              ? `Scale ${q.min}–${q.max}`
                              : q.type === "textarea"
                              ? "Long text"
                              : q.type === "email"
                              ? "Email"
                              : "Short text"}
                          </span>
                        </div>
                        {q.options && q.options.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {q.options.slice(0, 4).map((opt) => (
                              <div
                                key={opt}
                                className="flex items-center gap-2 text-xs text-neutral-500"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              >
                                <div className={`w-3 h-3 border border-neutral-300 flex-shrink-0 ${q.type === "radio" ? "rounded-full" : "rounded"}`} />
                                {opt}
                              </div>
                            ))}
                            {q.options.length > 4 && (
                              <p className="text-xs text-neutral-400 pl-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                +{q.options.length - 4} more options
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel footer */}
            <div className="border-t border-neutral-100 px-6 py-4">
              <Link
                href={`/forms/new?template=${previewTemplate.id}`}
                className="flex items-center justify-center w-full rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors active:scale-[0.98]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Use this template
              </Link>
            </div>
          </div>
        </>
      )}
    </Sidebar>
  );
}
