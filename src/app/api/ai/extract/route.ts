import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  imageUrl: z.string().min(1),
  type: z.enum(["iqama", "passport"]).default("iqama"),
});

export async function POST(request: Request) {
  try {
    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 422 });
    }
    const { imageUrl, type } = parsed.data;

    const prompt = type === "iqama"
      ? `Extract the following fields from this Saudi Iqama image and return STRICT JSON only (no markdown, no prose, no backticks):
{
  "fullName": "the holder's full English name as printed",
  "fullNameAr": "Arabic name if visible, else null",
  "iqamaNo": "the Iqama/residence ID number (10 digits)",
  "nationality": "nationality in English",
  "dateOfBirth": "YYYY-MM-DD if visible, else null",
  "issueDate": "YYYY-MM-DD if visible, else null",
  "expiryDate": "YYYY-MM-DD if visible, else null",
  "gender": "male or female if determinable, else null",
  "placeOfIssue": "if visible, else null"
}`
      : `Extract the following fields from this passport image and return STRICT JSON only (no markdown, no prose, no backticks):
{
  "fullName": "the holder's full name as printed",
  "passportNo": "passport number",
  "nationality": "nationality",
  "dateOfBirth": "YYYY-MM-DD if visible, else null",
  "issueDate": "YYYY-MM-DD if visible, else null",
  "expiryDate": "YYYY-MM-DD if visible, else null",
  "gender": "male or female if determinable, else null",
  "placeOfIssue": "issuing country/authority if visible, else null"
}`;

    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });

    const content = response.choices[0]?.message?.content || "";

    // Strip any markdown code fences
    const cleaned = content.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    let parsed_data: any = null;
    try {
      parsed_data = JSON.parse(cleaned);
    } catch {
      // Try to find a JSON object inside
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed_data = JSON.parse(match[0]); } catch {}
      }
    }

    if (!parsed_data) {
      return NextResponse.json({ ok: false, error: "Could not parse extracted data", raw: content });
    }
    return NextResponse.json({ ok: true, data: parsed_data });
  } catch (e: any) {
    console.error("[ai.extract.POST]", e?.message || e);
    return NextResponse.json(
      { ok: false, error: "Document extraction failed. Please check the image and try again." },
      { status: 500 },
    );
  }
}
