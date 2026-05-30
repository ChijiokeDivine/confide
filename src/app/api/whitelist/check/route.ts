import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

type FormRow = {
  id: string;
  is_active: boolean;
  whitelist_enabled: boolean;
};

type WhitelistEntryRow = {
  id: string;
  submitted_at: string | null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { formId, identifier } = body as { formId?: string; identifier?: string };

    if (!formId || !identifier?.trim()) {
      return NextResponse.json(
        { allowed: false, reason: "Missing formId or identifier" },
        { status: 400 }
      );
    }

    const admin = supabaseAdmin();

    const { data: form, error: formError } = await admin
      .from("forms")
      .select("id, is_active, whitelist_enabled")
      .eq("id", formId)
      .single() as { data: FormRow | null; error: { code?: string; message: string } | null };

    if (formError?.code === "PGRST116" || !form) {
      return NextResponse.json({ allowed: false, reason: "Form not found" }, { status: 404 });
    }
    if (formError) throw new Error(formError.message);

    if (!form.is_active) {
      return NextResponse.json({
        allowed: false,
        reason: "This form is no longer accepting responses",
      });
    }

    if (!form.whitelist_enabled) {
      return NextResponse.json({ allowed: true, entryId: null });
    }

    const normalised = identifier.trim().toLowerCase();
    const hash = createHash("sha256")
      .update(`${formId}:${normalised}`)
      .digest("hex");

    const { data: entry, error: entryError } = await admin
      .from("whitelist_entries")
      .select("id, submitted_at")
      .eq("form_id", formId)
      .eq("identifier_hash", hash)
      .single() as { data: WhitelistEntryRow | null; error: { code?: string; message: string } | null };

    if (entryError?.code === "PGRST116" || !entry) {
      return NextResponse.json({
        allowed: false,
        reason: "Your identifier is not on the access list for this survey.",
      });
    }
    if (entryError) throw new Error(entryError.message);

    if (entry.submitted_at) {
      return NextResponse.json({
        allowed: false,
        reason: "This identifier has already been used to submit a response.",
      });
    }

    return NextResponse.json({ allowed: true, entryId: entry.id });
  } catch (error) {
    console.error("Error checking whitelist:", error);
    return NextResponse.json(
      { allowed: false, reason: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
