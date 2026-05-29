"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-client";
import Sidebar from "@/components/Sidebar";

type FormSummary = {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  response_count: number;
  questions: unknown[];
};

export default function DashboardPage() {
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    fetchForms();
    fetchUser();
  }, []);

  async function fetchUser() {
    const sb = supabaseBrowser();
    const { data } = await sb.auth.getUser();
    setEmail(data.user?.email ?? "");
  }

  async function fetchForms() {
    try {
      const res = await fetch("/api/forms");
      const data = await res.json();
      setForms(data.forms ?? []);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(formId: string, current: boolean) {
    await fetch(`/api/forms/${formId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !current }),
    });
    fetchForms();
  }

  const totalResponses = forms.reduce((s, f) => s + f.response_count, 0);
  const activeForms = forms.filter((f) => f.is_active).length;

  return (
    <Sidebar>
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Page header */}
        <div className="anim-in d1 mb-8 md:mb-10 flex flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-400 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Creator Dashboard</p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Your surveys
            </h1>
          </div>
          <Link href="/forms/new"
            className="flex items-center rounded-full bg-neutral-900 px-4 md:px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors active:scale-[0.98]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <svg className="mr-2" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            New <span className="hidden md:inline ml-1">survey</span>
          </Link>
        </div>

        {/* Stats row */}
        <div className="anim-in d2 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-10">
          {[
            { label: "Total surveys", value: forms.length },
            { label: "Active surveys", value: activeForms },
            { label: "Encrypted responses", value: totalResponses },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-5 md:p-6">
              <p className="text-xs text-neutral-400 uppercase tracking-[0.14em] mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.label}</p>
              <p className="text-2xl md:text-3xl font-semibold text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Forms list */}
        <div className="anim-in d3">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Loading…
            </div>
          ) : forms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-2xl border border-dashed border-neutral-200 p-8">
                <p className="text-neutral-400 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>No surveys yet</p>
                <Link href="/forms/new"
                  className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Create your first survey
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {forms.map((form) => (
                <div key={form.id} className="group flex flex-col md:flex-row items-start md:items-center justify-between rounded-2xl border border-neutral-100 bg-white px-4 md:px-6 py-4 md:py-5 hover:border-neutral-200 hover:shadow-sm transition-all">
                  <div className="min-w-0 flex-1 mb-3 md:mb-0">
                    <div className="flex items-center gap-2 md:gap-3 mb-1">
                      <h3 className="font-medium text-neutral-900 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>{form.title}</h3>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] md:text-xs font-medium ${form.is_active ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-500"}`}
                        style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {form.is_active ? "Active" : "Closed"}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {form.questions.length} question{form.questions.length !== 1 ? "s" : ""} · {form.response_count} response{form.response_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    {/* Copy share link */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/forms/${form.id}`);
                      }}
                      className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                      title="Copy share link">
                      Copy link
                    </button>
                    <Link href={`/forms/${form.id}/results`}
                      className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      Results
                    </Link>
                    <button
                      onClick={() => toggleActive(form.id, form.is_active)}
                      className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {form.is_active ? "Close" : "Reopen"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Privacy callout */}
        <div className="anim-in d4 mt-10 md:mt-12 rounded-2xl border border-neutral-100 bg-neutral-50 px-4 md:px-6 py-4 md:py-5 flex items-start gap-3 md:gap-4">
          <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L1.5 3.5v4C1.5 10.5 4 12.5 7 13c3-0.5 5.5-2.5 5.5-5.5v-4L7 1z" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900 mb-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>End-to-end encrypted</p>
            <p className="text-sm text-neutral-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Every response is encrypted via CDR before leaving the respondent's browser. Only your wallet can decrypt the results.
            </p>
          </div>
        </div>
      </main>
    </Sidebar>
  );
}
