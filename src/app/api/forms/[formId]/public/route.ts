// src/app/api/forms/[formId]/public/route.ts
// Returns form metadata + questions for the public survey page (no auth required)

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    console.log("Fetching form with ID:", formId);
    
    const admin = supabaseAdmin();
    const { data: form, error } = await admin
      .from("forms")
      .select(
        "id, title, description, questions, is_active, creator_id, whitelist_enabled, whitelist_identifier_label"
      )
      .eq("id", formId)
      .single();

    console.log("Supabase form fetch result:", { data: form, error });

    if (error || !form) {
      console.error("Form not found or inactive, error:", error);
      return NextResponse.json({ error: "Form not found or inactive" }, { status: 404 });
    }

    return NextResponse.json({ form });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    console.error("Error in public form route:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
