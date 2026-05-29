// src/app/api/forms/[formId]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin, createServerSupabaseClient } from "@/lib/supabase";
import type { Form } from "@/types";

// PATCH /api/forms/:id — update is_active status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const admin = supabaseAdmin();

    const { data: form, error: fetchError } = await (admin as any)
      .from("forms")
      .select("creator_id")
      .eq("id", formId)
      .single() as { data: { creator_id: string } | null; error: any };

    if (fetchError || !form) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (form.creator_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { error } = await (admin as any)
      .from("forms")
      .update({ is_active: body.is_active as boolean })
      .eq("id", formId);

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}
