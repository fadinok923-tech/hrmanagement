import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const employee = await db.employee.findUnique({
      where: { id },
      include: {
        attendance: { orderBy: { date: "desc" }, take: 30 },
        leaves: { orderBy: { createdAt: "desc" }, take: 20 },
        payrolls: { orderBy: { month: "desc" }, take: 12 },
        documents: { orderBy: { createdAt: "desc" } },
        kpis: { orderBy: { createdAt: "desc" }, take: 12 },
      },
    });
    if (!employee) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: employee });
  } catch (e) {
    console.error("[employees.GET.id]", e);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

const updateSchema = z.object({
  empNo: z.string().min(1).optional(),
  fullName: z.string().min(1).optional(),
  fullNameAr: z.string().optional().nullable(),
  nationality: z.string().min(1).optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  jobTitle: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  employmentType: z.string().optional(),
  hireDate: z.string().optional(),
  contractEnd: z.string().optional().nullable(),
  basicSalary: z.coerce.number().optional(),
  allowances: z.coerce.number().optional(),
  bankAccount: z.string().optional().nullable(),
  iban: z.string().optional().nullable(),
  passportNo: z.string().optional().nullable(),
  passportExpiry: z.string().optional().nullable(),
  iqamaNo: z.string().optional().nullable(),
  iqamaExpiry: z.string().optional().nullable(),
  visaType: z.string().optional().nullable(),
  status: z.string().optional(),
  profilePhoto: z.string().optional().nullable(),
  iqamaPhoto: z.string().optional().nullable(),
  passportPhoto: z.string().optional().nullable(),
  avatarColor: z.string().optional(),
  notes: z.string().optional().nullable(),
  leaveAnnual: z.coerce.number().optional(),
  leaveSick: z.coerce.number().optional(),
  leaveEmergency: z.coerce.number().optional(),
  leaveMaternity: z.coerce.number().optional(),
  leaveCasualPerMonth: z.coerce.number().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message || "Invalid" }, { status: 422 });
    }
    const d: any = parsed.data;
    const data: any = { ...d };

    // If empNo is being updated, check it's not taken by another employee
    if (d.empNo) {
      const existing = await db.employee.findFirst({
        where: { empNo: d.empNo, NOT: { id } },
      });
      if (existing) {
        // Remove empNo from update to avoid unique constraint error
        delete data.empNo;
      }
    }

    if (d.hireDate) data.hireDate = new Date(d.hireDate);
    if (d.dateOfBirth !== undefined) data.dateOfBirth = d.dateOfBirth ? new Date(d.dateOfBirth) : null;
    if (d.contractEnd !== undefined) data.contractEnd = d.contractEnd ? new Date(d.contractEnd) : null;
    if (d.passportExpiry !== undefined) data.passportExpiry = d.passportExpiry ? new Date(d.passportExpiry) : null;
    if (d.iqamaExpiry !== undefined) data.iqamaExpiry = d.iqamaExpiry ? new Date(d.iqamaExpiry) : null;

    const employee = await db.employee.update({ where: { id }, data });
    return NextResponse.json({ ok: true, data: employee });
  } catch (e) {
    console.error("[employees.PUT]", e);
    return NextResponse.json({ ok: false, error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await db.employee.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[employees.DELETE]", e);
    return NextResponse.json({ ok: false, error: "Failed to delete" }, { status: 500 });
  }
}

