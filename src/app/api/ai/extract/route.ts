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

    let base64Data: string;
    let mimeType: string = "image/jpeg";

    try {
      if (imageUrl.startsWith("data:")) {
        const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) throw new Error("Invalid data URL");
        mimeType = match[1];
        base64Data = match[2];
      } else {
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        mimeType = contentType.split(";")[0];
        const buffer = await imgRes.arrayBuffer();
        base64Data = Buffer.from(buffer).toString("base64");
      }
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: `Could not load image: ${e.message}` }, { status: 400 });
    }

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

    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: "glm-4v-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[ai.extract] GLM API error:", err);
      return NextResponse.json({ ok: false, error: "AI service error. Please try again." }, { status: 500 });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    const cleaned = content.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    let parsed_data: any = null;
    try {
      parsed_data = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed_data = JSON.parse(match[0]); } catch {}
      }
    }

    if (!parsed_data) {
      return NextResponse.json({ ok: false, error: "Could not extract data — please fill manually", raw: content });
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
