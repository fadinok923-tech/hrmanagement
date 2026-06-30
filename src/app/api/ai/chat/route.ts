import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional().default([]),
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
    const { message, history } = parsed.data;

    // Gather real DB context for the AI
    const [employees, attendance, leaves, payrolls, documents, candidates, kpis] = await Promise.all([
      db.employee.count(),
      db.attendance.count(),
      db.leave.count(),
      db.payroll.count(),
      db.document.count(),
      db.candidate.count(),
      db.kpi.count(),
    ]);

    const [totalEmp, saudiEmp] = await Promise.all([
      db.employee.count(),
      db.employee.count({ where: { nationality: "Saudi" } }),
    ]);
    const pendingLeaves = await db.leave.count({ where: { status: "pending" } });
    const totalSalary = await db.employee.aggregate({ _sum: { basicSalary: true, allowances: true } });
    const today = new Date();
    const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const monthPayroll = await db.payroll.aggregate({
      where: { month: monthKey },
      _sum: { netSalary: true, gosi: true },
    });
    const expiringDocs = await db.document.findMany({
      where: { expiryDate: { lte: new Date(today.getTime() + 30 * 86400000) } },
      take: 10,
      include: { employee: true },
    });

    const context = `You are the AI Assistant for Tanoor Al Jazeera Industrial Factory HR System.
Current real-time data from the database:
- Total employees: ${totalEmp} (${saudiEmp} Saudi, ${totalEmp - saudiEmp} expat)
- Saudization rate: ${totalEmp ? Math.round((saudiEmp / totalEmp) * 100) : 0}%
- Attendance records (all time): ${attendance}
- Pending leave requests: ${pendingLeaves} (out of ${leaves} total)
- Total documents: ${documents}
- Total payroll records: ${payrolls}
- Candidates in pipeline: ${candidates}
- KPI records: ${kpis}
- Total monthly salary budget: ${(totalSalary._sum.basicSalary || 0) + (totalSalary._sum.allowances || 0)} SAR
- Current month (${monthKey}) payroll total: ${monthPayroll._sum.netSalary || 0} SAR (GOSI: ${monthPayroll._sum.gosi || 0} SAR)
- Documents expiring within 30 days: ${expiringDocs.length}
${expiringDocs.length > 0 ? `- Expiring docs detail: ${expiringDocs.map(d => `${d.title} (${d.employee?.fullName || "company"})`).join(", ")}` : ""}

Answer the user's question based on this context. Be concise, helpful, and professional. Respond in the same language the user used (English or Arabic). When relevant, mention specific numbers from the data above.`;

    // Lazy import to avoid bundling the SDK in client
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const messages: any[] = [
      { role: "system", content: context },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: "disabled" },
    });

    const reply = completion.choices[0]?.message?.content || "I couldn't generate a response.";

    return NextResponse.json({ ok: true, data: { reply } });
  } catch (e: any) {
    console.error("[ai.chat.POST]", e?.message || e);
    return NextResponse.json(
      { ok: false, error: "AI assistant unavailable. Please try again later." },
      { status: 500 },
    );
  }
}
