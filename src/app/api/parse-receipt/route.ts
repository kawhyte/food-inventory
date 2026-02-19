import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PROMPT = `Look at this grocery receipt image. Extract all food and grocery item names.
Return ONLY a valid JSON array of strings. No other text.
Example: ["Milk", "Eggs", "Bread"]
Clean up names: proper capitalization, no prices, no quantities, no item codes.
If no items found, return [].`;

export async function POST(request: Request) {
  // Verify the user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const image = formData.get("image") as File | null;

  if (!image) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  // Convert the image to base64
  const arrayBuffer = await image.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const ai = new GoogleGenAI({ apiKey });

  let response;
  try {
    response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: image.type || "image/jpeg",
            data: base64,
          },
        },
        { text: PROMPT },
      ],
    });
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 429) {
      return NextResponse.json(
        { error: "Gemini API quota exceeded. Check your plan at https://ai.google.dev/gemini-api/docs/rate-limits." },
        { status: 429 }
      );
    }
    console.error("Gemini API error:", err);
    return NextResponse.json({ error: "Failed to parse receipt." }, { status: 500 });
  }

  const text = (response.text ?? "").trim();

  // Strip markdown code fences if Gemini wraps the JSON in ```json ... ```
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  let items: string[] = [];
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      items = parsed.filter((x): x is string => typeof x === "string");
    }
  } catch {
    // Gemini returned something unexpected — return empty list gracefully
    items = [];
  }

  return NextResponse.json({ items });
}
