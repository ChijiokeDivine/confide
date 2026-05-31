// src/app/api/results/route.ts
import { NextResponse } from "next/server";
import { decryptResponse } from "@/lib/cdr-server";
import { supabaseAdmin, createServerSupabaseClient } from "@/lib/supabase";
import type { Form, SurveyResponse } from "@/types";

type DecryptedResponse = {
  answers: Record<string, unknown>;
  submittedAt: string;
};

// GET /api/results?formId=xxx[&countOnly=true]
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const formId = searchParams.get("formId");
    const countOnly = searchParams.get("countOnly") === "true";

    if (!formId) {
      return NextResponse.json({ error: "formId is required" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    const { data: form, error: formError } = await (admin as any)
      .from("forms")
      .select("id, creator_id, creator_address, aggregator_vault_uuid, questions, title, description")
      .eq("id", formId)
      .single() as { data: Form & { title: string; description?: string | null } | null; error: any };

    if (formError || !form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (form.creator_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── countOnly: cheap Supabase query, zero CDR gas ──────────────────────
    if (countOnly) {
      const { count } = await (admin as any)
        .from("responses")
        .select("id", { count: "exact", head: true })
        .eq("form_id", formId);

      return NextResponse.json({ formId, totalResponses: count ?? 0 });
    }

    // ── Full decrypt: pays CDR gas per vault ───────────────────────────────
    const { data: responses, error: responsesError } = await (admin as any)
      .from("responses")
      .select("id, response_vault_uuid, created_at")
      .eq("form_id", form.id)
      .order("created_at", { ascending: false }) as { data: SurveyResponse[] | null; error: any };

    if (responsesError) throw new Error(responsesError.message);

    if (!responses || responses.length === 0) {
      return NextResponse.json({ formId, totalResponses: 0, failedDecryptions: 0, answers: {}, rawResponses: [], questions: form.questions });
    }

    const decryptedResponses: (DecryptedResponse & { responseId: string; submittedAt: string })[] = [];
    const failedVaults: string[] = [];

    for (const response of responses) {
      try {
        const payload = await decryptResponse(response.response_vault_uuid);
        if (payload) {
          decryptedResponses.push({
            responseId: response.id,
            submittedAt: payload.submittedAt ?? response.created_at,
            answers: payload.answers,
          });
        }
      } catch (err) {
        console.error(`Failed to decrypt vault ${response.response_vault_uuid}:`, err);
        failedVaults.push(response.response_vault_uuid);
      }
    }

    const aggregatedAnswers: Record<string, unknown[]> = {};
    decryptedResponses.forEach(({ answers }) => {
      Object.entries(answers).forEach(([label, value]) => {
        if (!aggregatedAnswers[label]) aggregatedAnswers[label] = [];
        aggregatedAnswers[label].push(value);
      });
    });

    return NextResponse.json({
      formId,
      totalResponses: decryptedResponses.length,
      failedDecryptions: failedVaults.length,
      answers: aggregatedAnswers,
      rawResponses: decryptedResponses,
      questions: form.questions,
      formTitle: form.title,
      formDescription: form.description,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}