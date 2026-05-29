// src/app/api/whitelist/check/route.ts
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/whitelist/check
 *
 * Body: { formId: string; identifier: string }
 *
 * Returns:
 *   200 { allowed: true, entryId: string }   — identifier is on the list and unused
 *   200 { allowed: false, reason: string }    — not on list or already used
 *
 * The raw identifier is NEVER stored. We hash it server-side using:
 *   SHA-256( formId + ":" + identifier.trim().toLowerCase() )
 * and compare against stored hashes. This makes it impossible to reverse-engineer
 * who is on the whitelist from the database alone.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { formId, identifier } = body as { formId?: string; identifier?: string };

    if (!formId || !identifier || !identifier.trim()) {
      return NextResponse.json({ allowed: false, reason: "Missing formId or identifier" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    // Verify the form exists and has whitelist enabled
    const { data: form, error: formError } = await (admin as any)
      .from("forms")
      .select("id, is_active, whitelist_enabled")
      .eq("id", formId)
      .single();

    if (formError || !form) {
      return NextResponse.json({ allowed: false, reason: "Form not found" }, { status: 404 });
    }

    if (!form.is_active) {
      return NextResponse.json({ allowed: false, reason: "This form is no longer accepting responses" });
    }

    if (!form.whitelist_enabled) {
      // Whitelist not enabled — anyone can submit
      return NextResponse.json({ allowed: true, entryId: null });
    }

    // Compute hash: SHA-256(formId:identifier_normalised)
    const normalised = identifier.trim().toLowerCase();
    const hash = createHash("sha256").update(`${formId}:${normalised}`).digest("hex");

    // Look up in whitelist_entries
    const { data: entry, error: entryError } = await (admin as any)
      .from("whitelist_entries")
      .select("id, submitted_at")
      .eq("form_id", formId)
      .eq("identifier_hash", hash)
      .single();

    if (entryError || !entry) {
      return NextResponse.json({ allowed: false, reason: "Your identifier is not on the access list for this survey." });
    }

    if (entry.submitted_at) {
      return NextResponse.json({ allowed: false, reason: "This identifier has already been used to submit a response." });
    }

    return NextResponse.json({ allowed: true, entryId: entry.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Error checking whitelist:", error);
    return NextResponse.json({ allowed: false, reason: message }, { status: 500 });
  }
}