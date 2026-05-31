import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import type { Question } from "@/types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const systemMessage = `You are an expert form generator for a privacy-focused forms platform. You create professional, compliance-ready forms for HR, legal, medical, and governance use cases.

Return ONLY a valid JSON object in this exact shape, with no markdown or explanation:
{
  "title": string,
  "description": string,
  "questions": [
    {
      "id": "",
      "type": "text" | "textarea" | "radio" | "checkbox" | "scale",
      "label": string,
      "required": boolean,
      "options": string[],
      "min": number (optional),
      "max": number (optional),
      "step": number (optional),
      "placeholder": string (optional)
    }
  ]
}

Rules:
- question.id MUST be an empty string (the server will replace it)
- question.type MUST be one of: text, textarea, radio, checkbox, scale
- scale questions MUST have min: 1, max: 10
- radio/checkbox questions MUST have 3–6 options, options array must not be empty
- text/textarea questions MUST have options: []
- required: true for all important questions, false for optional ones
- Generate 5–10 questions appropriate for the use case
- Make the form professional and compliance-ready
- Return ONLY the JSON object, no markdown, no explanation`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content from Groq");
    }

    const parsed = JSON.parse(content);

    // Validate the parsed response
    if (!parsed.title || !parsed.description || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid response format");
    }

    // Replace question ids with crypto.randomUUID()
    const questions: Question[] = parsed.questions.map((q: any) => ({
      ...q,
      id: crypto.randomUUID(),
    }));

    return NextResponse.json({
      title: parsed.title,
      description: parsed.description,
      questions,
    });
  } catch (error) {
    console.error("Generation failed:", error);
    return NextResponse.json(
      { error: "Generation failed. Please try again." },
      { status: 500 }
    );
  }
}
