"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-client";
import Sidebar from "@/components/Sidebar";
import Skeleton from "@/components/Skeleton";

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
  const [copyNotificationVisible, setCopyNotificationVisible] = useState(false);
  const [togglingFormId, setTogglingFormId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [mobileModalFormId, setMobileModalFormId] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
    fetchUser();
  }, []);

  useEffect(() => {
    if (copyNotificationVisible) {
      const timer = setTimeout(() => setCopyNotificationVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyNotificationVisible]);

  // Close dropdown/modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Check if the click is not on any dropdown button or menu
      const target = event.target as HTMLElement;
      const isDropdownButton = target.closest('[data-dropdown-button]');
      const isDropdownMenu = target.closest('[data-dropdown-menu]');
      const isMobileModal = target.closest('[data-mobile-modal]');
      const isMobileModalContent = target.closest('[data-mobile-modal-content]');
      const isMobileTrigger = target.closest('[data-mobile-trigger]');
      
      if (!isDropdownButton && !isDropdownMenu) {
        setOpenDropdownId(null);
      }
      if (!isMobileModal && !isMobileModalContent && !isMobileTrigger) {
        setMobileModalFormId(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
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
      setTogglingFormId(null);
    }
  }

  async function toggleActive(formId: string, current: boolean) {
    setTogglingFormId(formId);
    await fetch(`/api/forms/${formId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !current }),
    });
    fetchForms();
  }

  function loadMore() {
    setVisibleCount(prev => prev + 3);
  }

  const totalResponses = forms.reduce((s, f) => s + f.response_count, 0);
  const activeForms = forms.filter((f) => f.is_active).length;
  const visibleForms = forms.slice(0, visibleCount);
  const hasMore = visibleCount < forms.length;

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
        <div className="anim-in d2 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-10">
          {loading ? (
            <>
              <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-5 md:p-6">
                <Skeleton className="h-3 w-24 mb-3" />
                <Skeleton className="h-8 w-12" />
              </div>
              <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-5 md:p-6">
                <Skeleton className="h-3 w-28 mb-3" />
                <Skeleton className="h-8 w-10" />
              </div>
              <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-5 md:p-6 col-span-2 md:col-span-1">
                <Skeleton className="h-3 w-36 mb-3" />
                <Skeleton className="h-8 w-14" />
              </div>
            </>
          ) : (
            [
              { label: "Total surveys", value: forms.length },
              { label: "Active surveys", value: activeForms },
              { label: "Encrypted responses", value: totalResponses },
            ].map((s, index) => (
              <div 
                key={s.label} 
                className={`rounded-2xl border border-neutral-100 bg-neutral-50 p-5 md:p-6 ${index === 2 ? "col-span-2 md:col-span-1" : ""}`}
              >
                <p className="md:text-xs text-[9px] text-neutral-400 uppercase tracking-[0.14em] mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.label}</p>
                <p className="text-2xl md:text-3xl font-semibold text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.value}</p>
              </div>
            ))
          )}
        </div>

        {/* Forms list */}
        <div className="anim-in d3">
          {loading ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-neutral-100 bg-white px-4 md:px-6 py-4 md:py-5">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="rounded-2xl border border-neutral-100 bg-white px-4 md:px-6 py-4 md:py-5">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-56" />
              </div>
              <div className="rounded-2xl border border-neutral-100 bg-white px-4 md:px-6 py-4 md:py-5">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-44" />
              </div>
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
              {visibleForms.map((form) => (
                <div key={form.id} className="group flex flex-col md:flex-row items-start md:items-center justify-between rounded-2xl border border-neutral-100 bg-white px-4 md:px-6 py-4 md:py-5 hover:border-neutral-200 hover:shadow-sm transition-all relative">
                  {/* Mobile click area */}
                  <div 
                    data-mobile-trigger
                    className="absolute inset-0 md:hidden cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMobileModalFormId(form.id);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                  ></div>
                  
                  <div className="min-w-0 flex-1 mb-3 md:mb-0 relative z-10">
                    <div className="flex items-center gap-2 md:gap-3 mb-1">
                      <h3 className="font-medium text-neutral-900 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>{form.title}</h3>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] md:text-xs font-medium ${form.is_active ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-500"}`}
                        style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {form.is_active ? "Active" : "Closed"}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {form.questions.length} question{form.questions.length !== 1 ? "s" : ""} · {form.response_count} response{form.response_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="relative flex-shrink-0  hidden md:block">
                    <button
                      data-dropdown-button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(openDropdownId === form.id ? null : form.id);
                      }}
                      className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                      title="More options">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neutral-600">
                        <circle cx="12" cy="6" r="2" fill="currentColor"/>
                        <circle cx="12" cy="12" r="2" fill="currentColor"/>
                        <circle cx="12" cy="18" r="2" fill="currentColor"/>
                      </svg>
                    </button>
                    
                    {openDropdownId === form.id && (
                      <div data-dropdown-menu className="absolute right-0 top-full mt-2 w-48 bg-white border border-neutral-200 rounded-xl shadow-lg z-50">
                        <div className="py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(`${window.location.origin}/forms/${form.id}`);
                              setCopyNotificationVisible(true);
                              setOpenDropdownId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neutral-500">
                              <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Copy link
                          </button>
                          
                          <Link href={`/forms/${form.id}/results`}
                            onClick={() => setOpenDropdownId(null)}
                            className="w-full px-4 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neutral-500">
                              <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M7 3H17C18.1046 3 19 3.89543 19 5V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3Z" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            Results
                          </Link>
                          
                          <div className="border-t border-neutral-100 my-1"></div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActive(form.id, form.is_active);
                              setOpenDropdownId(null);
                            }}
                            disabled={togglingFormId === form.id}
                            className="w-full px-4 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ fontFamily: "'DM Sans', sans-serif" }}>
                            {togglingFormId === form.id ? (
                              <div className="w-4 h-4 border-2 border-neutral-400 border-t-neutral-900 rounded-full animate-spin" />
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neutral-500">
                                {form.is_active ? (
                                  <path d="M8 7V3M16 7V3M3 11H21M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                ) : (
                                  <path d="M15.73 5H19C20.1046 5 21 5.89543 21 7V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7C3 5.89543 3.89543 5 5 5H8.27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                )}
                              </svg>
                            )}
                            {form.is_active ? "Close" : "Reopen"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={loadMore}
                    className="rounded-full border border-neutral-200 px-6 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Load more
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Privacy callout */}
        <div className="anim-in d4 mt-10 md:mt-[8rem] rounded-2xl border border-neutral-100 bg-neutral-50 px-4 md:px-6 py-4 md:py-5 flex items-start gap-3 md:gap-4 z-0">
          <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L1.5 3.5v4C1.5 10.5 4 12.5 7 13c3-0.5 5.5-2.5 5.5-5.5v-4L7 1z" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <p className="text-xs md:text-sm font-medium text-neutral-900 mb-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>End-to-end encrypted</p>
            <p className="md:text-sm text-[8px] text-neutral-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Every response is encrypted via CDR before leaving the respondent's browser. Only your wallet can decrypt the results.
            </p>
          </div>
        </div>

        {/* Copy notification */}
        {copyNotificationVisible && (
          <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50">
            <div className="rounded-full border border-neutral-200 bg-neutral-900 text-white px-4 py-2 text-xs font-medium shadow-lg flex items-center gap-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-green-400">
                <path d="M11 3.5L5.25 9.25L3 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Link copied!
            </div>
          </div>
        )}
        
        {/* Mobile options modal */}
        {mobileModalFormId && (() => {
          const form = forms.find(f => f.id === mobileModalFormId);
          if (!form) return null;
          
          return (
            <div 
              data-mobile-modal
              className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4"
              onClick={(e) => {
                e.stopPropagation();
                setMobileModalFormId(null);
              }}
            >
              <div 
                data-mobile-modal-content
                className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {form.title}
                  </h3>
                  <button
                    onClick={() => setMobileModalFormId(null)}
                    className="p-2 rounded-lg hover:bg-neutral-100"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-neutral-500">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(`${window.location.origin}/forms/${form.id}`);
                      setCopyNotificationVisible(true);
                      setMobileModalFormId(null);
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-3 rounded-xl border border-neutral-200"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-neutral-500">
                      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Copy link
                  </button>
                  
                  <Link href={`/forms/${form.id}/results`}
                    onClick={() => setMobileModalFormId(null)}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-3 rounded-xl border border-neutral-200"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-neutral-500">
                      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7 3H17C18.1046 3 19 3.89543 19 5V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Results
                  </Link>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleActive(form.id, form.is_active);
                      setMobileModalFormId(null);
                    }}
                    disabled={togglingFormId === form.id}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-3 rounded-xl border border-neutral-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {togglingFormId === form.id ? (
                      <div className="w-5 h-5 border-2 border-neutral-400 border-t-neutral-900 rounded-full animate-spin" />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-neutral-500">
                        {form.is_active ? (
                          <path d="M8 7V3M16 7V3M3 11H21M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        ) : (
                          <path d="M15.73 5H19C20.1046 5 21 5.89543 21 7V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7C3 5.89543 3.89543 5 5 5H8.27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        )}
                      </svg>
                    )}
                    {form.is_active ? "Close" : "Reopen"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </main>
    </Sidebar>
  );
}
