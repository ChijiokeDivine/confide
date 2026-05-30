"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  whitelist_enabled?: boolean;
  whitelist_total?: number;
  whitelist_used?: number;
};

export default function WorkspacePage() {
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyNotificationVisible, setCopyNotificationVisible] = useState(false);
  const [togglingFormId, setTogglingFormId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [mobileModalFormId, setMobileModalFormId] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
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

  const visibleForms = forms.slice(0, visibleCount);
  const hasMore = visibleCount < forms.length;

  return (
    <Sidebar>
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Page header */}
        <div className="anim-in d1 mb-8 md:mb-10 flex flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-400 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Workspace</p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              All your surveys
            </h1>
          </div>
          <Link href="/forms/new"
            className="flex items-center rounded-full bg-neutral-900 px-4 md:px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors active:scale-[0.98]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <svg className="mr-2" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            New survey
          </Link>
        </div>

        {/* Forms list */}
        <div className="anim-in d2">
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
                    <div className="flex items-center gap-2 md:gap-3 mb-2">
                      <h3 className="font-medium text-neutral-900 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>{form.title}</h3>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] md:text-xs font-medium ${form.is_active ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-500"}`}
                        style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {form.is_active ? "Active" : "Closed"}
                      </span>
                      {form.whitelist_enabled && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] md:text-xs font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          Whitelist
                        </span>
                      )}
                    </div>
                    {form.description && (
                      <p className="text-sm text-neutral-500 mb-3 line-clamp-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {form.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-neutral-400">
                          <path d="M9 11H7V9H9V11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M15 11H13V9H15V11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9 15H7V13H9V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M15 15H13V13H15V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {form.questions.length} question{form.questions.length !== 1 ? "s" : ""}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-neutral-400">
                          <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M7 3H17C18.1046 3 19 3.89543 19 5V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3Z" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {form.response_count} response{form.response_count !== 1 ? "s" : ""}
                      </div>
                      {form.whitelist_enabled && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                            <path d="M12 15V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 13.8486 20.4398 15.5515 19.4945 16.9384C18.5492 18.3252 17.2838 19.3326 15.8458 19.8294C14.4078 20.3262 12.8572 20.2796 11.4608 19.7047C10.0644 19.1298 8.89554 18.0616 8.11061 16.6918" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          {form.whitelist_used || 0}/{form.whitelist_total || 0} used
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative flex-shrink-0 hidden md:block">
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
