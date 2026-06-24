import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  username: z.string().trim().min(1).max(64),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please enter a username." },
      { status: 422 },
    );
  }

  // Simulate processing — never reveal whether a username exists.
  await new Promise((r) => setTimeout(r, 800));

  return NextResponse.json({
    ok: true,
    message:
      "If the username exists, reset instructions have been sent to the registered email.",
  });
}
