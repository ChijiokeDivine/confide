"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase-client";
import { logOut, deleteAccountAndAllData } from "@/lib/auth-actions";
import Sidebar from "@/components/Sidebar";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [currentAvatarPath, setCurrentAvatarPath] = useState<string | null>(null);
  const [hasPasswordAuth, setHasPasswordAuth] = useState<boolean | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  async function fetchUserProfile() {
    try {
      const sb = supabaseBrowser();
      const { data: { user } } = await sb.auth.getUser();
      if (!user || !user.email) return;

      const provider = typeof user.app_metadata?.provider === "string" ? user.app_metadata.provider : null;
      const providers = Array.isArray(user.app_metadata?.providers)
        ? user.app_metadata.providers.filter((value): value is string => typeof value === "string")
        : [];
      const hasEmailProvider = provider === "email" || providers.includes("email");
      setHasPasswordAuth(hasEmailProvider);

      const { data: account } = await sb
        .from("creator_accounts")
        .select("name, avatar_url")
        .eq("email", user.email)
        .single();

      if (account) {
        if ('name' in account) {
          setName((account as { name: string }).name);
        }
        if ('avatar_url' in account && (account as { avatar_url: string }).avatar_url) {
          const avatarPath = (account as { avatar_url: string }).avatar_url;
          setCurrentAvatarPath(avatarPath);
          const { data } = await sb
            .storage
            .from('avatars')
            .createSignedUrl(avatarPath, 3600);
          if (data?.signedUrl) {
            setAvatarUrl(data.signedUrl);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const file = e.target.files?.[0];
      if (!file) return;

      const sb = supabaseBrowser();
      const { data: { user } } = await sb.auth.getUser();
      if (!user || !user.email) throw new Error("Not authenticated");

      // Get user ID from creator_accounts
      const { data: account } = await sb
        .from("creator_accounts")
        .select("id")
        .eq("email", user.email)
        .single();

      if (!account || !('id' in account)) throw new Error("User not found");

      const fileExt = file.name.split('.').pop();
      const fileName = `${(account as { id: string }).id}.${fileExt}`;
      const filePath = `${fileName}`;

      // Delete old avatar if it exists
      if (currentAvatarPath) {
        const { error: deleteError } = await sb
          .storage
          .from('avatars')
          .remove([currentAvatarPath]);
        if (deleteError) console.warn("Failed to delete old avatar:", deleteError);
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await sb
        .storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Update creator_accounts table
      const { error: updateError } = await sb
        .from("creator_accounts")
        .update({ avatar_url: filePath } as never)
        .eq("email", user.email);

      if (updateError) throw updateError;

      // Update current avatar path
      setCurrentAvatarPath(filePath);

      // Get signed URL and update avatarUrl
      const { data } = await sb
        .storage
        .from('avatars')
        .createSignedUrl(filePath, 3600);

      if (data?.signedUrl) {
        setAvatarUrl(data.signedUrl);
      }

      setSuccess("Profile picture updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  }

  async function updateName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const sb = supabaseBrowser();
      const { data: { user } } = await sb.auth.getUser();
      if (!user || !user.email) throw new Error("Not authenticated");

      const { error: updateError } = await sb
        .from("creator_accounts")
        .update({ name: name.trim() } as never)
        .eq("email", user.email);

      if (updateError) throw updateError;

      setSuccess("Name updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setLoading(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (hasPasswordAuth === null) {
      setError("Still loading your account settings. Please try again.");
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim() || (hasPasswordAuth && !currentPassword.trim())) {
      setError(hasPasswordAuth ? "All password fields are required" : "Enter and confirm your new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const sb = supabaseBrowser();
      const { data: { user } } = await sb.auth.getUser();
      if (!user || !user.email) throw new Error("Not authenticated");

      if (hasPasswordAuth) {
        const { error: signInError } = await sb.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (signInError) {
          throw new Error("Current password is incorrect");
        }
      }

      const { error: updateError } = await sb.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccess(
        hasPasswordAuth
          ? "Password changed successfully!"
          : "Password set successfully! You can now log in with email and password."
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  async function deleteAccount() {
    setShowConfirmation(true);
  }

  async function handleConfirmDelete() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await deleteAccountAndAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  }

  return (
    <Sidebar>
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Page header */}
        <div className="anim-in d1 mb-8 md:mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard" className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>Settings</p>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Your Account
          </h1>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="anim-in mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {success}
          </div>
        )}
        {error && (
          <div className="anim-in mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {error}
          </div>
        )}

        {/* Avatar Upload Section */}
        <div className="anim-in d2 mb-8 rounded-2xl border border-neutral-100 bg-white p-6 md:p-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Profile Picture
          </h2>
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden relative cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M12 14c-3 0-6 1.5-6 4.5v1.5h12v-1.5c0-3-3-4.5-6-4.5z" fill="currentColor"/></svg>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
                </div>
              )}
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={uploadAvatar} 
              disabled={uploading}
              className="hidden"
            />
            <p className="text-sm text-neutral-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Click to upload a new profile picture
            </p>
          </div>
        </div>

        {/* Update Name Section */}
        <div className="anim-in d3 mb-8 rounded-2xl border border-neutral-100 bg-white p-6 md:p-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Your Name
          </h2>
          <form onSubmit={updateName} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-[0.12em]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Display Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 transition-all focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300"
                placeholder="Your name"
                style={{ fontFamily: "'DM Sans', sans-serif" }} />
            </div>
            <button type="submit" disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Update Name
            </button>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="anim-in d4 mb-8 rounded-2xl border border-neutral-100 bg-white p-6 md:p-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {hasPasswordAuth ? "Change Password" : "Set Password"}
          </h2>
          {hasPasswordAuth === false && (
            <p className="mb-6 text-sm text-neutral-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              You signed in with Google. Set a password if you also want to log in with email and password.
            </p>
          )}
          <form onSubmit={changePassword} className="space-y-4">
            {hasPasswordAuth && (
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-[0.12em]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 transition-all focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300"
                  placeholder="Enter current password"
                  style={{ fontFamily: "'DM Sans', sans-serif" }} />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-[0.12em]" style={{ fontFamily: "'DM Sans', sans-serif" }}>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 transition-all focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300"
                placeholder="Enter new password"
                style={{ fontFamily: "'DM Sans', sans-serif" }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-[0.12em]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 transition-all focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300"
                placeholder="Confirm new password"
                style={{ fontFamily: "'DM Sans', sans-serif" }} />
            </div>
            <button type="submit" disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {hasPasswordAuth ? "Change Password" : "Set Password"}
            </button>
          </form>
        </div>

        {/* Delete Account Section */}
        <div className="anim-in d5 rounded-2xl border border-red-200 bg-red-50 p-6 md:p-8">
          <h2 className="text-lg font-semibold text-red-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Delete Account
          </h2>
          <p className="text-sm text-red-700 mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Permanently delete your account and all associated data. This action is irreversible.
          </p>
          <button onClick={deleteAccount} disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Delete My Account
          </button>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Are you absolutely sure?
            </h3>
            <p className="text-sm text-neutral-600 mb-6 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              This will permanently delete your account, all your forms, and all responses. This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowConfirmation(false)} disabled={loading}
                className="flex-1 px-4 py-2 rounded-full border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Cancel
              </button>
              <button onClick={handleConfirmDelete} disabled={loading}
                className="flex-1 px-4 py-2 rounded-full bg-red-600 text-sm font-semibold text-white hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
}
