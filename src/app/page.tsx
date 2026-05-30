"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function NovuHomePage() {
  const [mounted, setMounted] = useState(false);
  const navItems = [
    { label: "Features", href: "#features" },
    { label: "FAQ", href: "#faq" },
    { label: "Try For Free", href: "/signup" },
  ];

  const [active, setActive] = useState(2); // default = Try For Free
  useEffect(() => { setMounted(true); }, []);

  return (
    <main className={`relative w-full overflow-hidden font-sans ${mounted ? "ready" : ""}`}>

      {/* ─── Hero section (full viewport) ─────────────────────────────────── */}
      <section className="relative h-screen w-full overflow-hidden">

        {/* Background hero photo */}
        <div
          className="absolute inset-0 bg-cover bg-top bg-no-repeat"
          style={{
            backgroundImage:
              "url('/Smiling.png')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
        <div className="absolute inset-0 bg-black/15" />

        <style>{`
          .anim-header,
          .anim-h1,
          .anim-p,
          .anim-cta,
          .anim-dashboard {
            opacity: 0;
          }

          .ready .anim-header {
            animation: slideDown 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards;
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-12px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          .ready .anim-h1 {
            animation: revealUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.45s forwards;
          }
          @keyframes revealUp {
            from { opacity: 0; transform: translateY(24px); clip-path: inset(100% 0 0 0); }
            to   { opacity: 1; transform: translateY(0);    clip-path: inset(0% 0 0 0); }
          }

          .ready .anim-p {
            animation: scaleFade 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.9s forwards;
          }
          @keyframes scaleFade {
            from { opacity: 0; transform: scale(0.97); }
            to   { opacity: 1; transform: scale(1); }
          }

          .ready .anim-cta {
            animation: springUp 0.65s cubic-bezier(0.34, 1.45, 0.64, 1) 1.2s forwards;
          }
          @keyframes springUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          .ready .anim-dashboard {
            animation: dashboardRise 1s cubic-bezier(0.22, 1, 0.36, 1) 1.5s forwards;
          }
          @keyframes dashboardRise {
            from { opacity: 0; transform: translateY(40px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Navbar */}
        <header className="anim-header relative z-20 w-full px-4 pt-6 md:px-8">
          {/* MOBILE */}
          <div className="flex items-center justify-between gap-4 md:hidden">
            <Link
              href="/"
              className="text-[1.4rem] font-light tracking-tight text-white select-none"
              style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.02em" }}
            >
              Confide
            </Link>
            <a
              href="/signup"
              className="flex items-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
            >
              Try For Free
            </a>
          </div>

          {/* DESKTOP */}
          <div className="hidden md:flex items-center justify-between">
            <Link
              href="/"
              className="ml-12 text-[1.8rem] font-light tracking-tight text-white select-none"
              style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.02em" }}
            >
              Confide
            </Link>
            <nav
              className="relative flex items-center rounded-full border border-white/30 bg-white/10 p-1 backdrop-blur-md"
              onMouseLeave={() => setActive(2)}
            >
              {/* Sliding background */}
              <div
                className="absolute top-1 bottom-1 rounded-full bg-neutral-900 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  width: active === 0 ? "96px" : active === 1 ? "70px" : "130px",
                  transform:
                    active === 0
                      ? "translateX(0px)"
                      : active === 1
                      ? "translateX(96px)"
                      : "translateX(166px)",
                }}
              />

              {navItems.map((item, index) => (
                <a
                  key={item.label}
                  href={item.href}
                  onMouseEnter={() => setActive(index)}
                  className="relative z-10 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-300"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="w-[120px]" />
          </div>
        </header>

        {/* Hero copy + CTA */}
        <div className="absolute inset-x-0 bottom-8 md:bottom-0 z-10 flex flex-col items-center pb-12 text-center">
          <h1
            className="anim-h1 mb-4 max-w-4xl px-4 text-[clamp(3rem,7vw,6.5rem)] font-normal leading-[1.05] tracking-tight text-white"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Private forms.<br />
            For <em className="not-italic font-bold">everyone.</em>
          </h1>

          <p
            className="anim-p mb-10 max-w-xl px-6 text-[clamp(0.9rem,1.5vw,1.05rem)] leading-relaxed text-white/80"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Collect sensitive feedback without exposing your users. Employee surveys, DAO votes, research forms - encrypted<span className="hidden md:inline-block">& aggregated only by you.</span>
          </p>

          <div className="anim-cta">
            <a
              href="/signup"
              className="flex items-center gap-2.5 rounded-full bg-white px-8 py-4 text-base font-semibold text-neutral-900 shadow-xl transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
            >
              Get Started
            </a>
          </div>


        </div>
      </section>

    </main>
  );
}