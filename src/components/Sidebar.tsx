"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { logOut } from "@/lib/auth-actions";
import { SURVEY_TEMPLATES } from "@/lib/templates";

interface NavItem {
  name: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

type SearchResultItem = {
  id: string;
  title: string;
  subtitle: string;
  href?: string;
  kind: "link" | "template";
  badge: string;
  searchText: string;
  meta?: string;
  disabled?: boolean;
};

function normaliseSearchQuery(value: string) {
  return value.trim().toLowerCase();
}

function getSearchScore(item: SearchResultItem, query: string) {
  const title = item.title.toLowerCase();
  const haystack = item.searchText.toLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);
  let score = 0;

  if (title === query) score += 120;
  if (title.startsWith(query)) score += 70;
  if (title.includes(query)) score += 40;
  if (haystack.includes(query)) score += 24;

  terms.forEach((term) => {
    if (title.startsWith(term)) score += 18;
    else if (title.includes(term)) score += 10;

    if (haystack.includes(term)) score += 6;
  });

  if (item.disabled) score -= 4;

  return score;
}

function filterSearchResults(items: SearchResultItem[], query: string, limit: number) {
  const normalised = normaliseSearchQuery(query);

  if (!normalised) {
    return items.slice(0, limit);
  }

  return items
    .map((item) => ({ item, score: getSearchScore(item, normalised) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, limit)
    .map(({ item }) => item);
}

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleKeyboardShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setDrawerOpen(false);
        setSearchOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyboardShortcut);
    return () => window.removeEventListener("keydown", handleKeyboardShortcut);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;

    const focusTimer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 120);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [searchOpen]);

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
  }

  function openSearch() {
    setDrawerOpen(false);
    setSearchOpen(true);
  }

  const quickLinks = useMemo<SearchResultItem[]>(
    () => [
      {
        id: "dashboard",
        title: "Dashboard",
        subtitle: "View your survey overview and statistics.",
        href: "/dashboard",
        kind: "link",
        badge: "Page",
        searchText: "dashboard home overview statistics stats",
      },
      {
        id: "workspace",
        title: "Workspace",
        subtitle: "See all your surveys in one place.",
        href: "/workspace",
        kind: "link",
        badge: "Page",
        searchText: "workspace all surveys forms list",
      },
      {
        id: "new-form",
        title: "Create Survey",
        subtitle: "Start a new encrypted survey from scratch.",
        href: "/forms/new",
        kind: "link",
        badge: "Action",
        searchText: "create survey new form questionnaire build publish",
      },
      {
        id: "templates",
        title: "Templates",
        subtitle: "Browse pre-built survey templates.",
        href: "/templates",
        kind: "link",
        badge: "Page",
        searchText: "templates pre-built surveys examples",
      },
      {
        id: "help",
        title: "Help",
        subtitle: "Find answers to common questions and guides.",
        href: "/help",
        kind: "link",
        badge: "Page",
        searchText: "help center faq support guide answers questions",
      },
      {
        id: "settings",
        title: "Settings",
        subtitle: "Manage your account and preferences.",
        href: "/settings",
        kind: "link",
        badge: "Page",
        searchText: "settings account preferences",
      },
    ],
    []
  );

  const templateResults = useMemo<SearchResultItem[]>(
    () =>
      SURVEY_TEMPLATES.map((template) => ({
        id: template.id,
        title: template.title,
        subtitle: template.description,
        href: `/forms/new?template=${template.id}`,
        kind: "template",
        badge: template.category,
        meta: `${template.questions.length} questions · ${template.estimatedTime}`,
        searchText: [
          template.title,
          template.description,
          template.category,
          template.useCase,
          template.questions.map((question) => question.label).join(" "),
        ].join(" "),
      })),
    []
  );

  const shortcutLabel =
    mounted && typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent)
      ? "Cmd K"
      : "Ctrl K";

  const hasSearchQuery = normaliseSearchQuery(searchQuery).length > 0;
  const visibleQuickLinks = filterSearchResults(quickLinks, searchQuery, hasSearchQuery ? 6 : 4);
  const visibleTemplates = hasSearchQuery
    ? filterSearchResults(templateResults, searchQuery, 6)
    : [];
  const showEmptyState = hasSearchQuery && visibleQuickLinks.length === 0 && visibleTemplates.length === 0;

  const navItems: NavItem[] = [
    { 
      name: "Home", 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      href: "/dashboard" 
    },
    { 
      name: "Search", 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ), 
      onClick: openSearch,
    },
    { 
      name: "Settings", 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H21a2 2 0 0 1 2 2 2 2 0 0 1 2-2h-.09a1.65 1.65 0 0 0-1.51-1z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ), 
      href: "/settings" 
    },
    { 
      name: "Templates", 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M3 9h18" stroke="currentColor" strokeWidth="2"/>
          <path d="M9 21V9" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ), 
      href: "/templates" 
    },
    { 
      name: "Workspace", 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M20 7h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 3H5a2 2 0 0 0-2 2v11" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ), 
      href: "/workspace" 
    },
    { 
      name: "How To Guides", 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      href: "#" 
    },
    { 
      name: "Help", 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ), 
      href: "/help" 
    },
  ];

  function renderSearchResultIcon(kind: SearchResultItem["kind"]) {
    if (kind === "template") {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M3 9h18M9 21V9" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    }

    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M7 17L17 7M17 7H9M17 7v8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  function renderSearchSection(title: string, items: SearchResultItem[]) {
    if (items.length === 0) return null;

    return (
      <section className="space-y-2">
        <div className="px-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {title}
          </p>
        </div>
        <div className="space-y-2">
          {items.map((item) => {
            const content = (
              <>
                
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {item.title}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium hidden md:block ${
                        item.disabled ? "bg-neutral-100 text-neutral-500" : "bg-neutral-100 text-neutral-600"
                      }`}
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm leading-relaxed text-neutral-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {item.subtitle}
                  </p>
                  {item.meta && (
                    <p className="mt-1 text-xs text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {item.meta}
                    </p>
                  )}
                </div>
                <div className="flex h-9 items-center">
                  <span className="rounded-full border border-neutral-200 px-2.5 py-1 text-[8px] md:text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {item.disabled ? "Soon" : "Open"}
                  </span>
                </div>
              </>
            );

            if (item.disabled || !item.href) {
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/80 px-4 py-4 opacity-80"
                >
                  {content}
                </div>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={closeSearch}
                className="search-result-item flex items-start gap-3 rounded-2xl border border-neutral-100 bg-white px-4 py-4"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  function renderNavItem(item: NavItem, mobile = false) {
    const baseClassName = `flex items-center gap-3 px-4 py-2 rounded-xl text-neutral-700 text-sm hover:bg-neutral-100 transition-colors ${
      !mobile && sidebarCollapsed ? "justify-center" : ""
    } ${item.href && pathname === item.href ? "bg-neutral-100" : ""}`;

    if (item.onClick) {
      return (
        <button
          key={item.name}
          type="button"
          onClick={item.onClick}
          className={`${baseClassName} w-full ${mobile ? "" : "text-left"}`}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {item.icon}
          {(!sidebarCollapsed || mobile) && <span className="font-medium">{item.name}</span>}
        </button>
      );
    }

    return (
      <Link
        key={item.name}
        href={item.href ?? "#"}
        onClick={() => {
          if (mobile) setDrawerOpen(false);
        }}
        className={baseClassName}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {item.icon}
        {(!sidebarCollapsed || mobile) && <span className="font-medium">{item.name}</span>}
      </Link>
    );
  }

  return (
    <div className={`min-h-screen bg-white ${mounted ? "ready" : ""}`}>
      <style>{`
        .anim-in { opacity: 0; }
        .ready .anim-in { animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) forwards; }
        .ready .anim-in.d1 { animation-delay: 0.05s; }
        .ready .anim-in.d2 { animation-delay: 0.15s; }
        .ready .anim-in.d3 { animation-delay: 0.25s; }
        .ready .anim-in.d4 { animation-delay: 0.35s; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .search-result-item { transition: border-color 0.18s ease,  }
        .search-result-item:hover { border-color: #f3f3f4ff;  }
      `}</style>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setDrawerOpen(false)} 
        />
      )}

      {/* Mobile Drawer */}
      <div className={`fixed top-0 left-0 h-full bg-white z-50 w-72 shadow-xl md:hidden transition-transform duration-300 ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <span className="text-xl font-light tracking-tight text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Confyde
            </span>
            <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-lg hover:bg-neutral-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => renderNavItem(item, true))}
          </nav>
          <div className="mt-6">
            <button
              onClick={() => {}}
              className="w-full px-4 py-3 rounded-full text-sm font-medium text-white bg-[#ece9e9] transition-all"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Upgrade
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-neutral-100">
          <button 
            onClick={() => logOut()}
            className="flex items-center gap-3 px-4 py-2 w-full text-left rounded-xl text-red-600 text-sm hover:bg-red-50 transition-colors"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="font-medium">Log out</span>
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-white border-r border-neutral-100 z-30 hidden md:block transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-64"}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            {!sidebarCollapsed && (
              <span className="text-xl font-light tracking-tight text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Confyde
              </span>
            )}
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
              {sidebarCollapsed ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M13 5l7 7-7 7M5 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M11 19l-7-7 7-7M19 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => renderNavItem(item))}
          </nav>
          {!sidebarCollapsed && (
            <div className="mt-6">
              <button
                onClick={() => {}}
                className="w-full px-4 py-2 rounded-xl text-sm font-medium text-black bg-[#ece9e9] transition-all"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Upgrade
              </button>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-neutral-100">
          <button 
            onClick={() => logOut()}
            className={`flex items-center gap-3 px-4 py-2 w-full text-left rounded-xl text-red-600 text-sm hover:bg-red-50 transition-colors ${sidebarCollapsed ? "justify-center" : ""}`}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {!sidebarCollapsed && <span className="font-medium">Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-20" : "md:ml-64"}`}>
        {/* Mobile Header */}
        <header className="md:hidden border-b border-neutral-100 px-4 py-4 flex items-center justify-between">
          <button onClick={() => setDrawerOpen(true)} className="p-2 rounded-lg hover:bg-neutral-100">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <span className="text-xl font-light tracking-tight text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Confyde
          </span>
          <div className="w-10" />
        </header>

        {children}
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-[60] p-4 md:p-8" onClick={closeSearch}>
          <div className="absolute inset-0 bg-neutral-950/20 backdrop-blur-[2px]" />
          <div className="relative mx-auto mt-6 w-full max-w-3xl md:mt-16" onClick={(event) => event.stopPropagation()}>
            <div className="overflow-hidden rounded-[15px] border border-neutral-200 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.14)]">
              <div className="border-b border-neutral-100 px-5 py-5 md:px-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    
                    <h2 className="text-lg font-semibold text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      Find links and templates
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* <span className="hidden rounded-full border border-neutral-200 px-2.5 py-1 text-[11px] font-medium text-neutral-400 md:inline-flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {shortcutLabel}
                    </span> */}
                    <button
                      type="button"
                      onClick={closeSearch}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-700"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-[10px] border border-neutral-200 bg-neutral-50 px-4 py-3 focus-within:border-neutral-300 focus-within:bg-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-neutral-400">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search ..."
                    className="w-full bg-transparent md:text-[15px] text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        searchInputRef.current?.focus();
                      }}
                      className="rounded-full border border-neutral-200 px-2.5 py-1 text-[11px] font-medium text-neutral-500 transition-colors hover:border-neutral-300 hover:bg-white hover:text-neutral-700"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-[70vh] overflow-y-auto px-5 py-5 md:px-6">
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  {[
                    "Quick links",
                    ...(hasSearchQuery ? ["Templates"] : []),
                  ].map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-500"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                <div className="space-y-6">
                  {renderSearchSection(hasSearchQuery ? "Matching Links" : "Suggested Links", visibleQuickLinks)}
                  {hasSearchQuery && renderSearchSection("Matching Templates", visibleTemplates)}

                  {showEmptyState && (
                    <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-10 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-500">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </div>
                      <p className="mb-1 text-sm font-medium text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        No matches found
                      </p>
                      <p className="text-sm text-neutral-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Try a broader keyword like "settings", "template", or part of a survey title.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className=" px-5 py-4 md:px-6">
                <div className="flex items-center justify-between gap-3 text-xs text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                 
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
