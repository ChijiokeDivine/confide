"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { logIn } from "@/lib/auth-actions";

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await logIn(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className={`min-h-screen w-full flex items-center justify-center ${mounted ? "ready" : ""}`}>
      <style>{`
        .anim-logo, .anim-form-header, .anim-form-field, .anim-form-button, .anim-form-link { opacity: 0; }
        input:focus { outline: none !important; box-shadow: none !important; }
        .ready .anim-logo { animation: slideDown 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s forwards; }
        .ready .anim-form-header { animation: revealUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s forwards; }
        .ready .anim-form-field:nth-child(1) { animation: revealUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.3s forwards; }
        .ready .anim-form-field:nth-child(2) { animation: revealUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.45s forwards; }
        .ready .anim-form-button { animation: springUp 0.65s cubic-bezier(0.34,1.45,0.64,1) 0.6s forwards; }
        .ready .anim-form-link { animation: scaleFade 0.7s cubic-bezier(0.22,1,0.36,1) 0.75s forwards; }
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes revealUp { from { opacity:0; transform:translateY(24px); clip-path:inset(100% 0 0 0); } to { opacity:1; transform:translateY(0); clip-path:inset(0% 0 0 0); } }
        @keyframes scaleFade { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        @keyframes springUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div className="min-h-screen w-full flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-md">
          <div className="mb-12">
            <Link href="/" className="anim-logo text-[1.6rem] md:text-[1.8rem] font-light tracking-tight text-neutral-900"
              style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.02em" }}>
              Confide
            </Link>
          </div>

          <div className="anim-form-header">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Log in
            </h1>
            <p className="text-neutral-500 mb-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Enter your credentials to access your dashboard
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="anim-form-field">
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Email
              </label>
              <input id="email" name="email" type="email"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 transition-all focus:outline-none focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300"
                placeholder="you@example.com" required />
            </div>

            <div className="anim-form-field">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Password
              </label>
              <input id="password" name="password" type="password"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 transition-all focus:outline-none focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300"
                placeholder="••••••••" required />
            </div>

            <button type="submit" disabled={loading}
              className="anim-form-button w-full py-3.5 rounded-full bg-neutral-900 text-white font-semibold transition-all hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="anim-form-link mt-8 text-center text-neutral-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-neutral-900 hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
