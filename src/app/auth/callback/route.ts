import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types";
import { supabaseAdmin } from "@/lib/supabase";
import { generateWallet } from "@/lib/wallet";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const loginUrl = new URL("/login", request.url);

  if (!code) {
    loginUrl.searchParams.set("error", "Missing authentication code.");
    return NextResponse.redirect(loginUrl);
  }

  let response = NextResponse.redirect(new URL(next, request.url));

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.redirect(new URL(next, request.url));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    loginUrl.searchParams.set(
      "error",
      error?.message ?? "Google authentication failed. Please try again."
    );
    return NextResponse.redirect(loginUrl);
  }

  const admin = supabaseAdmin();
  const { data: existingAccount, error: accountError } = await (admin as any)
    .from("creator_accounts")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (accountError) {
    loginUrl.searchParams.set("error", "Failed to verify account setup.");
    return NextResponse.redirect(loginUrl);
  }

  if (!existingAccount) {
    const { address, encryptedPrivateKey } = generateWallet();
    const fallbackName = data.user.email?.split("@")[0] ?? "Anonymous";
    const name =
      data.user.user_metadata?.name ??
      data.user.user_metadata?.full_name ??
      fallbackName;

    const { error: profileError } = await (admin as any).from("creator_accounts").insert({
      id: data.user.id,
      email: data.user.email,
      name,
      wallet_address: address,
      encrypted_private_key: encryptedPrivateKey,
    });

    if (profileError) {
      loginUrl.searchParams.set("error", "Failed to create account profile.");
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}
