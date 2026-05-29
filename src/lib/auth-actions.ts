// src/lib/auth-actions.ts
"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase";
import { generateWallet } from "@/lib/wallet";

// ─── Sign Up ─────────────────────────────────────────────────────────────────
export async function signUp(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password || !name) {
    return { error: "All fields are required." };
  }

  const supabase = await createServerSupabaseClient();

  // 1. Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Signup failed." };
  }

  // 2. Generate a wallet for this user (server-side)
  const { address, encryptedPrivateKey } = generateWallet();

  // 3. Create creator_account row (use admin to bypass RLS during creation)
  const admin = supabaseAdmin();
  const { error: profileError } = await (admin as any).from("creator_accounts").insert({
    id: authData.user.id,
    email,
    wallet_address: address,
    encrypted_private_key: encryptedPrivateKey,
  });

  if (profileError) {
    // Roll back auth user if profile creation fails
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: "Failed to create account profile." };
  }

  redirect("/dashboard");
}

// ─── Log In ──────────────────────────────────────────────────────────────────
export async function logIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

// ─── Log Out ─────────────────────────────────────────────────────────────────
export async function logOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}
