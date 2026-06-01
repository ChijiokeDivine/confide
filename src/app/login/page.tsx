"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { logIn } from "@/lib/auth-actions";
import { supabaseBrowser } from "@/lib/supabase-client";

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const oauthError = new URLSearchParams(window.location.search).get("error");
    if (oauthError) {
      setError(oauthError);
    }
  }, []);

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

  async function handleGoogleLogin() {
    setError("");
    setGoogleLoading(true);
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google login failed. Please try again.");
      setGoogleLoading(false);
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
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 transition-all focus:outline-none focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300 md:text-md text-sm"
                placeholder="you@example.com" required />
            </div>

            <div className="anim-form-field">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Password
              </label>
              <input id="password" name="password" type="password"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 transition-all focus:outline-none focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300 md:text-md text-sm"
                placeholder="••••••••" required />
            </div>

            <button type="submit" disabled={loading}
              className="anim-form-button w-full py-3.5 rounded-full bg-neutral-900 text-white font-semibold transition-all hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-neutral-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Or continue with
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full py-3.5 rounded-full border border-neutral-200 bg-white text-neutral-900 font-semibold transition-all hover:bg-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <p className="anim-form-link mt-4 text-center text-neutral-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Forgot your password?{" "}
            <Link href="/forgot-password" className="font-semibold text-neutral-900 hover:underline">Reset password</Link>
          </p>
          
          <p className="mt-4 text-center text-neutral-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Don't have an account?{" "}
            <Link href="/signup" className="font-semibold text-neutral-900 hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
