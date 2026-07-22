import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(request: Request) {
  try {
    const { ids, updates } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ ok: false, error: "No employees selected" }, { status: 400 });
    }
    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, error: "No fields to update" }, { status: 400 });
    }

    await db.employee.updateMany({
      where: { id: { in: ids } },
      data: updates,
    });

    return NextResponse.json({ ok: true, count: ids.length });
  } catch (e) {
    console.error("[employees.bulk.PATCH]", e);
    return NextResponse.json({ ok: false, error: "Failed to bulk update" }, { status: 500 });
  }
}
