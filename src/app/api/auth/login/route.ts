import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(128),
  remember: z.boolean().optional(),
});

// Demo credentials — mirrors the original system's "contact administrator" model.
const DEMO_USER = "admin";
const DEMO_PASS = "tanoor2025";

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
      { ok: false, error: "Please enter your username and password." },
      { status: 422 },
    );
  }

  const { username, password, remember } = parsed.data;

  // Simulate a small auth delay for realistic UX.
  await new Promise((r) => setTimeout(r, 650));

  if (username === DEMO_USER && password === DEMO_PASS) {
    return NextResponse.json({
      ok: true,
      user: {
        username,
        name: "System Administrator",
        role: "admin",
      },
      token: Buffer.from(`${username}:${Date.now()}`).toString("base64"),
      remember: Boolean(remember),
    });
  }

  return NextResponse.json(
    { ok: false, error: "Invalid username or password." },
    { status: 401 },
  );
}
