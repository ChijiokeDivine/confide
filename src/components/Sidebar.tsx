"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { logOut } from "@/lib/auth-actions";

interface NavItem {
  name: string;
  icon: React.ReactNode;
  href: string;
}

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      href: "#" 
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
      href: "#" 
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
      href: "#" 
    },
  ];

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
              Confide
            </span>
            <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-lg hover:bg-neutral-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href} 
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl text-neutral-700 text-sm hover:bg-neutral-100 transition-colors ${
                  pathname === item.href ? "bg-neutral-100" : ""
                }`}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>
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
                Confide
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
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl text-neutral-700 text-sm hover:bg-neutral-100 transition-colors ${
                  sidebarCollapsed ? "justify-center" : ""
                } ${pathname === item.href ? "bg-neutral-100" : ""}`}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {item.icon}
                {!sidebarCollapsed && <span className="font-medium">{item.name}</span>}
              </Link>
            ))}
          </nav>
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
            Confide
          </span>
          <div className="w-10" />
        </header>

        {children}
      </div>
    </div>
  );
}
