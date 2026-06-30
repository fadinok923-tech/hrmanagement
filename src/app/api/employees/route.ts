import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const status = searchParams.get("status") || "";
    const nationality = searchParams.get("nationality") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { empNo: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { jobTitle: { contains: search } },
      ];
    }
    if (department && department !== "all") where.department = department;
    if (status && status !== "all") where.status = status;
    if (nationality && nationality !== "all") where.nationality = nationality;

    const employees = await db.employee.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { documents: true, attendance: true, leaves: true } },
      },
    });
    return NextResponse.json({ ok: true, data: employees });
  } catch (e) {
    console.error("[employees.GET]", e);
    return NextResponse.json({ ok: false, error: "Failed to fetch employees" }, { status: 500 });
  }
}

const employeeSchema = z.object({
  empNo: z.string().min(1),
  fullName: z.string().min(1),
  fullNameAr: z.string().optional().nullable(),
  nationality: z.string().min(1),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  jobTitle: z.string().min(1),
  department: z.string().min(1),
  employmentType: z.string().optional(),
  hireDate: z.string().min(1),
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
});

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = employeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message || "Invalid data" }, { status: 422 });
    }
    const d = parsed.data;
    const employee = await db.employee.create({
      data: {
        empNo: d.empNo,
        fullName: d.fullName,
        fullNameAr: d.fullNameAr ?? null,
        nationality: d.nationality,
        gender: d.gender || "male",
        dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : null,
        maritalStatus: d.maritalStatus ?? null,
        phone: d.phone ?? null,
        email: d.email ?? null,
        address: d.address ?? null,
        emergencyContact: d.emergencyContact ?? null,
        jobTitle: d.jobTitle,
        department: d.department,
        employmentType: d.employmentType || "full_time",
        hireDate: new Date(d.hireDate),
        contractEnd: d.contractEnd ? new Date(d.contractEnd) : null,
        basicSalary: d.basicSalary ?? 0,
        allowances: d.allowances ?? 0,
        bankAccount: d.bankAccount ?? null,
        iban: d.iban ?? null,
        passportNo: d.passportNo ?? null,
        passportExpiry: d.passportExpiry ? new Date(d.passportExpiry) : null,
        iqamaNo: d.iqamaNo ?? null,
        iqamaExpiry: d.iqamaExpiry ? new Date(d.iqamaExpiry) : null,
        visaType: d.visaType ?? null,
        status: d.status || "active",
        profilePhoto: d.profilePhoto ?? null,
        iqamaPhoto: d.iqamaPhoto ?? null,
        passportPhoto: d.passportPhoto ?? null,
        avatarColor: d.avatarColor || "#1e3a8a",
        notes: d.notes ?? null,
      },
    });
    return NextResponse.json({ ok: true, data: employee });
  } catch (e: any) {
    console.error("[employees.POST]", e);
    if (e?.code === "P2002") {
      return NextResponse.json({ ok: false, error: "Employee number already exists" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "Failed to create employee" }, { status: 500 });
  }
}
