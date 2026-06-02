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

  const stats = [
    { value: "480+ hrs", label: "Saved monthly\non IT admin" },
    { value: "100%", label: "compliant offboarding + IT\nasset retrieval" },
  ];

  const slides = [
    {
      id: 0,
      image: "/hr.webp",
      company: "HR Teams",
      stats: [
        { value: "Anonymous", label: "Employees speak freely\nwhen no one's watching" },
      ],
    },
    {
      id: 1,
      image: "/researchers.webp",
      company: "Researchers",
      stats: [
        { value: "No bias", label: "Ask sensitive questions\nwithout influencing answers" },
      ],
    },
    {
      id: 2,
      image: "/productteams.webp",
      company: "Product Teams",
      stats: [
        { value: "Real feedback", label: "Hear what users mean\nnot what sounds polite" },
      ],
    },
    {
      id: 3,
      image: "/daos.webp",
      company: "DAOs",
      stats: [
        { value: "On-chain", label: "Private votes and feedback\nverified on-chain" },
      ],
    },
  ];
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className={`relative w-full overflow-hidden font-sans ${mounted ? "ready" : ""}`}>

      {/* ─── Hero section (full viewport) ─────────────────────────────────── */}
      <section className="relative h-screen w-full overflow-hidden">

        {/* Background hero photo */}
        <div
          className="absolute inset-0 bg-cover bg-top bg-no-repeat"
          style={{
            backgroundImage:
              "url('/Smiling.webp')",
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
      <section className="w-full min-h-[85vh] bg-white flex items-center justify-center px-4 py-8 lg:px-6 lg:py-6 font-sans hidden lg:block">
        <div className="w-full h-full lg:h-[85vh] lg:max-h-[85vh] grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 lg:py-6">

          {/* Left Panel */}
          <div className="bg-[#2d1b69] rounded-3xl p-8 sm:p-10 lg:p-14 flex flex-col justify-between min-h-[480px]">

            {/* Top Badge */}
           

            {/* Headline */}
            <div className="flex-1 flex flex-col justify-center mt-8">
              <h1 className="text-white text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.05] tracking-tight" style={{ fontFamily: "'DM Sans', Georgia, serif" }}>
                Forms people actually answer  <span className="text-[#9b7fe8]">honestly.</span>
              </h1>

              <p className="mt-6 text-white/60 text-sm md:text-lg leading-relaxed max-w-md" style={{ fontFamily: "'DM Sans', Georgia, serif" }}>
                Every survey tool stores answers in plain text - so respondents hold back. With Confide, responses are encrypted before storage. Not even we can read them.
              </p>
            </div>

            {/* CTA */}
            <div className="mt-10">
              <button className="group bg-white hover:bg-gray-100 text-[#1a1040] font-bold text-sm md:text-base px-8 py-3 md:py-4 rounded-full transition-all duration-200 flex items-center gap-2 w-fit">
                Create a form free
                <span className="group-hover:translate-x-1 transition-transform duration-200 text-lg">›</span>
              </button>
            </div>
          </div>

          {/* Right Panel – Auto Slideshow */}
          <div className="relative rounded-3xl overflow-hidden min-h-[480px] bg-gray-200">

            {/* Slide Images */}
            {slides.map((slide) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out  ${
                  activeSlide === slide.id ? "opacity-100" : "opacity-0"
                }`}
              >
                <img
                  src={slide.image}
                  alt={`${slide.company} team`}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              </div>
            ))}

            {/* Company Badge */}
            <div className="absolute top-6 left-6 rounded-full px-4 py-2 flex items-center gap-2 border border-white/30 bg-white/50 p-1 backdrop-blur-md">
              
              <span className="font-semibold text-gray-900 text-sm">
                Who It's For

              </span>
            </div>

            {/* Stats Overlay */}
            <div className="absolute bottom-14 left-6 right-6 flex gap-6 z-10">
              {slides[activeSlide].stats.map((stat, i) => (
                <div key={i} className="flex-1">
                  <p className="text-white text-xl md:text-5xl font-bold" style={{ fontFamily: "'DM Sans', Georgia, serif" }}>{slides[activeSlide].company}</p>
                  <p className="text-white/80 md:text-lg text-base mt-5 leading-snug whitespace-pre-line" style={{ fontFamily: "'DM Sans', Georgia, serif" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
              <div className="w-px bg-white/30 self-stretch hidden sm:block" />
            </div>

            {/* Dot Navigation */}
            <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-2 z-10">
              {slides.map((slide) => (
                <button
                  key={slide.id}
                  onClick={() => setActiveSlide(slide.id)}
                  className={`rounded-full transition-all duration-300 ${
                    activeSlide === slide.id
                      ? "w-6 h-2.5 bg-white/20 hover:bg-white/50 backdrop-blur-md"
                      : "w-2.5 h-2.5 bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Go to slide ${slide.id + 1}`}
                />
              ))}
            </div>
          </div>

        </div>
      </section>
      <section className="bg-[#f5f5f3] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 max-[410px]:px-5">
          {/* Heading */}
          <div className="mb-14">
            <p className="mb-4 text-sm md:text-md font-medium  text-neutral-500" style={{ fontFamily: "'DM Sans', Georgia, serif" }}>
              How it works
            </p>

            <h2 className="max-w-4xl text-4xl font-semibold tracking-tight text-neutral-900 md:text-5xl" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Here's how it works.
            </h2>
          </div>

          {/* Cards */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Card 1 */}
            <div className="rounded-[25px] md:rounded-[32px] bg-[#ece9e9] p-6 sm:p-8">
              <h3 className="text-2xl font-semibold text-neutral-900" style={{ fontFamily: "'DM Sans', Georgia, serif" }}>
                Create
              </h3>

              <p className="mt-3 text-sm md:text-md text-neutral-600">
                Build a form in minutes. AI helps if you want it to.
              </p>

                 <div className="mt-12 rounded-[24px] bg-white  shadow-sm">
                  <div className=" gap-6">
                    <div className="flex items-center justify-center w-full">
                      <img
                        src="/screenshot_1.5x_postspark_2026-06-02_11-28-49.webp"
                        alt="Form screenshot"
                        className="w-full max-w-md rounded-xl shadow-sm"
                      />
                    </div>
                  </div>
                </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-[25px] md:rounded-[32px] bg-[#ece9e9] p-6 sm:p-8">
              <h3 className="text-2xl font-semibold text-neutral-900" style={{ fontFamily: "'DM Sans', Georgia, serif" }}>
                Share
              </h3>

              <p className="mt-3 text-sm md:text-md text-neutral-600">
                Send a link. Respondents need nothing but a browser.
              </p>

              <div className="mt-16 space-y-4">
                {/* Top Widget */}
                <div className="relative rounded-2xl p-5 h-[100px] shadow-sm overflow-hidden">

                  {/* Gradient overlay image */}
                  <img
                    src="/grad.webp"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Content */}
                  <div className="relative flex items-center justify-center gap-3 h-full">
                    <input
                      type="text"
                      value="confide.xyz/forms/099f24e5-dad8-4c00-8c0a-51378295d7fa"
                      disabled
                      className="flex-1 max-w-md bg-white/80 backdrop-blur border border-white/30 rounded-lg px-4 py-2 text-xs text-neutral-800 truncate" style={{ fontFamily: "'DM Sans', Georgia, serif" }}
                    />

                    <button className="px-4 py-2 bg-black/80 text-white text-xs font-medium rounded-lg hover:bg-black transition-colors" style={{ fontFamily: "'DM Sans', Georgia, serif" }}>
                      Copy <span className="hidden md:inline-block">link</span>
                    </button>
                  </div>

                </div>

                
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-[25px] md:rounded-[32px] bg-[#ece9e9] p-6 sm:p-8">
              <h3 className="text-2xl font-semibold text-neutral-900" style={{ fontFamily: "'DM Sans', Georgia, serif" }}>
                Read
              </h3>

              <p className="mt-3 text-sm md:text-md text-neutral-600" style={{ fontFamily: "'DM Sans', Georgia, serif" }}>
                Only you can decrypt and view the results.
              </p>

              <div className="mt-12 rounded-[24px] bg-white shadow-sm">
                <div className=" gap-6">
                  <div className="flex items-center justify-center w-full">
                    <img
                      src="/screenshot_1.5x_postspark_2026-06-02_10-59-59.webp"
                      alt="Form screenshot"
                      className="w-full max-w-md rounded-xl shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="w-full bg-white flex items-center justify-center px-4 py-8 lg:px-6 lg:py-6 lg:py-24 font-sans">
        <div className="w-full">
     
          <div className="bg-[#1b1b1b] rounded-3xl p-8 sm:p-10 lg:p-14 flex flex-col items-center w-full">

            {/* Top Badge */}
           

            {/* Headline */}
            <div className="flex flex-col items-center justify-center mt-8 text-center">
              <h1 className="text-white text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-extrabold leading-[1.05] tracking-tight hidden md:block" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
               When no one's watching, people <br className="hidden md:block"/><span className="text-[#d8ebff]">tell the truth. </span>
              </h1>
              <h1 className="text-white text-4xl md:text-5xl lg:text-5xl xl:text-7xl font-extrabold leading-[1.05] tracking-tight  md:hidden" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Honesty needs  <br className="hidden md:block"/><span className="text-[#d8ebff]">privacy. </span>
              </h1>

              <p className="mt-6 text-white/60 text-sm sm:text-lg leading-relaxed max-w-md">

                Confide encrypts every response the moment it's submitted. Only you can read them - no one else, ever. 
                
              </p>
            </div>

            {/* Screenshot */}
            <div className="mt-8 w-full max-w-5xl">
              <img
                src="/screenshot_1.5x_postspark_2026-06-02_13-18-31.webp"
                alt="Form screenshot"
                className="w-full rounded-xl shadow-sm"
              />
            </div>

            {/* CTA */}
            <div className="mt-10">
              <button className="group bg-white hover:bg-gray-100 text-[#1a1040] font-bold text-sm md:text-base px-8 py-3 md:py-4 rounded-full transition-all duration-200 flex items-center gap-2 w-fit">
                Create a form free
                <span className="group-hover:translate-x-1 transition-transform duration-200 text-lg">›</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-neutral-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left - Brand */}
          <div className="text-center md:text-left">
            <Link
              href="/"
              className="text-2xl font-light tracking-tight"
              style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.02em" }}
            >
              Confide
            </Link>
            <p className="mt-2 text-neutral-400 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Private forms for everyone.
            </p>
          </div>

          {/* Right - Links */}
          <div className="flex flex-wrap items-center justify-center gap-8">
            <Link
              href="/#features"
              className="text-neutral-300 hover:text-white text-sm transition-colors"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Features
            </Link>
            <Link
              href="/#faq"
              className="text-neutral-300 hover:text-white text-sm transition-colors"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              FAQ
            </Link>
            <Link
              href="/signup"
              className="text-white text-sm font-medium hover:text-neutral-300 transition-colors"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-neutral-500 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            © {new Date().getFullYear()} Confide. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-neutral-500 hover:text-white text-xs transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Privacy
            </a>
            <a href="#" className="text-neutral-500 hover:text-white text-xs transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Terms
            </a>
          </div>
        </div>
      </footer>

    </main>
  );
}