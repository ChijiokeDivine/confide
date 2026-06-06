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

// ─── Delete Account ──────────────────────────────────────────────────────────
export async function deleteAccountAndAllData() {
  const supabase = await createServerSupabaseClient();
  const admin = supabaseAdmin();

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // Get creator account
  const { data: creatorAccount, error: creatorError } = await admin
    .from("creator_accounts")
    .select("id")
    .eq("id", user.id)
    .single();
  if (creatorError || !creatorAccount) throw new Error("User not found");

  // Delete all forms (cascades to responses via foreign key)
  const { error: formsError } = await admin
    .from("forms")
    .delete()
    .eq("creator_id", user.id);
  if (formsError) throw new Error("Failed to delete forms");

  // Delete creator account
  const { error: accountError } = await admin
    .from("creator_accounts")
    .delete()
    .eq("id", user.id);
  if (accountError) throw new Error("Failed to delete account");

  // Delete Supabase auth user
  const { error: authError } = await admin.auth.admin.deleteUser(user.id);
  if (authError) throw new Error("Failed to delete auth user");

  // Log out and redirect
  await supabase.auth.signOut();
  redirect("/");
}
