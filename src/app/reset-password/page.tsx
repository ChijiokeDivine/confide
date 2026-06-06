"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-client";

export default function ResetPasswordPage() {
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const router = useRouter();
  const supabase = supabaseBrowser();

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType(null);

    if (password !== confirmPassword) {
      setMessage("Passwords do not match!");
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters long!");
      setMessageType("error");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      setMessage("Password updated successfully! Redirecting to login...");
      setMessageType("success");
      
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update password.");
      setMessageType("error");
    } finally {
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
              Confyde
            </Link>
          </div>

          <div className="anim-form-header">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Set new password
            </h1>
            <p className="text-neutral-500 mb-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Enter your new password below.
            </p>
          </div>

          {message && (
            <div className={`mb-6 rounded-xl border p-4 text-sm ${
              messageType === "success" 
                ? "border-green-200 bg-green-50 text-green-700" 
                : "border-red-200 bg-red-50 text-red-700"
            }`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="anim-form-field">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                New password
              </label>
              <input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 transition-all focus:outline-none focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300 md:text-md text-sm"
                placeholder="••••••••" required />
            </div>

            <div className="anim-form-field">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Confirm new password
              </label>
              <input id="confirmPassword" name="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 transition-all focus:outline-none focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300 md:text-md text-sm"
                placeholder="••••••••" required />
            </div>

            <button type="submit" disabled={loading}
              className="anim-form-button w-full py-3.5 rounded-full bg-neutral-900 text-white font-semibold transition-all hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {loading ? "Updating password…" : "Reset password"}
            </button>
          </form>

          <p className="anim-form-link mt-8 text-center text-neutral-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Don't need to reset?{" "}
            <Link href="/login" className="font-semibold text-neutral-900 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
