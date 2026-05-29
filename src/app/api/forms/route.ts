// src/app/api/forms/route.ts
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { allocateVault } from "@/lib/cdr-server";
import { supabaseAdmin } from "@/lib/supabase";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { Question, Form, CreatorAccount } from "@/types";

type WhitelistPayload = {
  enabled: boolean;
  identifierLabel: string;
  identifiers: string[];
};

type CreateFormRequest = {
  title: string;
  description?: string;
  questions: Question[];
  whitelist?: WhitelistPayload;
};

// POST /api/forms — create a new survey form
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = supabaseAdmin();
    const { data: creator, error: creatorError } = await (admin as any)
      .from("creator_accounts")
      .select("wallet_address")
      .eq("id", user.id)
      .single() as { data: CreatorAccount | null; error: any };

    if (creatorError || !creator) {
      return NextResponse.json({ error: "Creator account not found" }, { status: 404 });
    }

    const body: CreateFormRequest = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      return NextResponse.json({ error: "At least one question is required" }, { status: 400 });
    }

    const whitelistEnabled = body.whitelist?.enabled ?? false;
    const whitelistIdentifiers = body.whitelist?.identifiers ?? [];
    const whitelistLabel = body.whitelist?.identifierLabel ?? "Email address";

    // Check if platform wallet is configured
    const pk = process.env.PLATFORM_WALLET_PRIVATE_KEY;
    const skipCDR = !pk || pk === "0x_YOUR_FUNDED_TESTNET_PRIVATE_KEY";

    let aggregatorVaultUuid: string | null = null;

    if (!skipCDR) {
      const vaultId = await allocateVault(creator.wallet_address);
      aggregatorVaultUuid = String(vaultId);
    }

    const { data: form, error } = await (admin as any)
      .from("forms")
      .insert({
        creator_id: user.id,
        creator_address: creator.wallet_address,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        questions: body.questions,
        aggregator_vault_uuid: aggregatorVaultUuid,
        is_active: true,
        whitelist_enabled: whitelistEnabled,
        whitelist_identifier_label: whitelistLabel,
      })
      .select()
      .single() as { data: Form | null; error: any };

    if (error || !form) {
      throw new Error(error?.message || "Failed to create form");
    }

    // If whitelist is enabled, store hashed identifiers
    if (whitelistEnabled && whitelistIdentifiers.length > 0) {
      const entries = whitelistIdentifiers.map((identifier) => {
        const normalised = identifier.trim().toLowerCase();
        const hash = createHash("sha256")
          .update(`${form.id}:${normalised}`)
          .digest("hex");
        return {
          form_id: form.id,
          identifier_hash: hash,
        };
      });

      const { error: wlError } = await (admin as any)
        .from("whitelist_entries")
        .insert(entries);

      if (wlError) {
        console.error("Failed to insert whitelist entries:", wlError);
        // Non-fatal — form is created, log the issue
      }
    }

    return NextResponse.json(
      {
        formId: form.id,
        aggregatorVaultUuid,
        whitelistEnabled,
        whitelistCount: whitelistEnabled ? whitelistIdentifiers.length : 0,
        ...(skipCDR ? { note: "CDR disabled in development" } : {}),
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Error creating form:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/forms — list forms for the authenticated creator
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = supabaseAdmin();
    const { data: forms, error } = await (admin as any)
      .from("forms")
      .select("id, title, description, is_active, created_at, questions, creator_id, whitelist_enabled")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false }) as { data: Form[] | null; error: any };

    if (error) throw new Error(error.message);

    const formsWithCounts = await Promise.all(
      (forms ?? []).map(async (form) => {
        const { count } = await (admin as any)
          .from("responses")
          .select("id", { count: "exact", head: true })
          .eq("form_id", form.id);

        // Count whitelist slots usage if enabled
        let whitelistTotal = 0;
        let whitelistUsed = 0;
        if ((form as any).whitelist_enabled) {
          const { count: total } = await (admin as any)
            .from("whitelist_entries")
            .select("id", { count: "exact", head: true })
            .eq("form_id", form.id);
          const { count: used } = await (admin as any)
            .from("whitelist_entries")
            .select("id", { count: "exact", head: true })
            .eq("form_id", form.id)
            .not("submitted_at", "is", null);
          whitelistTotal = total ?? 0;
          whitelistUsed = used ?? 0;
        }

        return {
          ...form,
          response_count: count ?? 0,
          whitelist_total: whitelistTotal,
          whitelist_used: whitelistUsed,
        };
      })
    );

    return NextResponse.json({ forms: formsWithCounts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Error fetching forms:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}