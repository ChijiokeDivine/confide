// src/app/api/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase";
import { decryptResponse } from "@/lib/cdr-server";
import type { Question, Form } from "@/types";
import { createHash } from "crypto";

type ExportForm = Form & {
  title: string;
  description?: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("formId");
    const type = searchParams.get("type"); // "pdf" or "csv"
    const responseId = searchParams.get("responseId"); // only for pdf

    if (!formId || !type) {
      return NextResponse.json({ error: "formId and type are required" }, { status: 400 });
    }

    // Get form details
    const { data: form, error: formError } = await (supabaseAdmin() as any)
      .from("forms")
      .select("id, creator_id, title, description, questions")
      .eq("id", formId)
      .single() as { data: ExportForm | null; error: any };

    if (formError || !form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (form.creator_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (type === "csv") {
      // Get all responses
      const { data: responses, error: responsesError } = await (supabaseAdmin() as any)
        .from("responses")
        .select("id, response_vault_uuid, created_at")
        .eq("form_id", formId)
        .order("created_at", { ascending: true });

      if (responsesError) throw new Error(responsesError.message);

      // Decrypt all responses
      const decryptedResponses = [];
      for (const res of responses) {
        try {
          const payload = await decryptResponse(res.response_vault_uuid);
          if (payload) {
            decryptedResponses.push({
              responseId: res.id,
              submittedAt: payload.submittedAt || res.created_at,
              answers: payload.answers,
            });
          }
        } catch (e) {
          console.warn("Failed to decrypt response", res.id, e);
        }
      }

      // Build CSV rows
      const questionLabels = form.questions.map((q: Question) => q.label);
      const header = ["Response ID (Hashed)", "Submitted At", ...questionLabels];
      const rows = [header.join(",")];

      for (const res of decryptedResponses) {
        // Hash response ID deterministically
        const hashedId = createHash("sha256")
          .update(`${formId}:${res.responseId}`)
          .digest("hex")
          .slice(0, 16);

        const row = [
          hashedId,
          res.submittedAt,
          ...questionLabels.map((label: string) => {
            const val = res.answers[label];
            if (Array.isArray(val)) {
              return `"${val.join("; ")}"`;
            }
            const strVal = String(val ?? "");
            if (strVal.includes(",") || strVal.includes('"')) {
              return `"${strVal.replace(/"/g, '""')}"`;
            }
            return strVal;
          }),
        ];
        rows.push(row.join(","));
      }

      const csvContent = rows.join("\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${form.title.replace(/[^a-zA-Z0-9-_]/g, "_")}_responses_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
