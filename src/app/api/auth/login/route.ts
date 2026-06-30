import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const schema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(128),
  remember: z.boolean().optional(),
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
      { ok: false, error: "Please enter your username and password." },
      { status: 422 },
    );
  }

  const { username, password, remember } = parsed.data;

  // Simulate a small auth delay for realistic UX.
  await new Promise((r) => setTimeout(r, 350));

  try {
    const user = await db.user.findUnique({ where: { username } });
    if (!user || !user.password) {
      return NextResponse.json(
        { ok: false, error: "Invalid username or password." },
        { status: 401 },
      );
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Invalid username or password." },
        { status: 401 },
      );
    }
    return NextResponse.json({
      ok: true,
      user: {
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
      },
      token: Buffer.from(`${user.username}:${Date.now()}`).toString("base64"),
      remember: Boolean(remember),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Authentication service unavailable." },
      { status: 500 },
    );
  }
}
