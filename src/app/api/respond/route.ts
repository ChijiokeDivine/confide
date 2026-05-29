// src/app/api/respond/route.ts
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { encryptAndStoreResponse } from "@/lib/cdr-server";
import { supabaseAdmin } from "@/lib/supabase";
import type { Form } from "@/types";

type SubmitResponseRequest = {
  formId: string;
  answers: Record<string, unknown>;
  /** Raw identifier provided by respondent (only used when form has whitelist enabled) */
  whitelistIdentifier?: string;
};

// POST /api/respond — native form submission
export async function POST(request: Request) {
  try {
    const body: SubmitResponseRequest = await request.json();

    if (!body.formId || !body.answers) {
      return NextResponse.json(
        { error: "formId and answers are required" },
        { status: 400 }
      );
    }

    const admin = supabaseAdmin();

    const { data: form, error: formError } = await (admin as any)
      .from("forms")
      .select("id, creator_address, is_active, whitelist_enabled")
      .eq("id", body.formId)
      .single() as { data: (Form & { whitelist_enabled: boolean }) | null; error: any };

    if (formError || !form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (!form.is_active) {
      return NextResponse.json(
        { error: "This form is no longer accepting responses" },
        { status: 403 }
      );
    }

    // ── Whitelist validation ───────────────────────────────────────────────────
    let whitelistEntryId: string | null = null;

    if (form.whitelist_enabled) {
      const raw = body.whitelistIdentifier?.trim();
      if (!raw) {
        return NextResponse.json(
          { error: "An access identifier is required to submit this form." },
          { status: 403 }
        );
      }

      const normalised = raw.toLowerCase();
      const hash = createHash("sha256")
        .update(`${body.formId}:${normalised}`)
        .digest("hex");

      const { data: entry, error: entryError } = await (admin as any)
        .from("whitelist_entries")
        .select("id, submitted_at")
        .eq("form_id", body.formId)
        .eq("identifier_hash", hash)
        .single();

      if (entryError || !entry) {
        return NextResponse.json(
          { error: "Your identifier is not on the access list for this survey." },
          { status: 403 }
        );
      }

      if (entry.submitted_at) {
        return NextResponse.json(
          { error: "This identifier has already been used to submit a response." },
          { status: 409 }
        );
      }

      whitelistEntryId = entry.id;
    }

    // ── Encrypt + store via CDR ────────────────────────────────────────────────
    const labelledAnswers: Record<string, unknown> = {};
    // body.answers is already labelled at this point (set by the client)
    Object.assign(labelledAnswers, body.answers);

    const uuid = await encryptAndStoreResponse(form.creator_address, labelledAnswers);

    // ── Record in responses table ──────────────────────────────────────────────
    const { data: responseRow, error: insertError } = await (admin as any)
      .from("responses")
      .insert({
        form_id: form.id,
        response_vault_uuid: typeof uuid === "string" ? uuid : String(uuid),
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    // ── Mark whitelist entry as used (atomically) ──────────────────────────────
    if (whitelistEntryId) {
      const { error: markError } = await (admin as any)
        .from("whitelist_entries")
        .update({
          submitted_at: new Date().toISOString(),
          response_id: responseRow?.id ?? null,
        })
        .eq("id", whitelistEntryId)
        .is("submitted_at", null); // safety: only update if still unused

      if (markError) {
        console.error("Failed to mark whitelist entry:", markError);
        // Non-fatal — response is already stored
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}