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
    const visaType = searchParams.get("visaType") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { empNo: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { jobTitle: { contains: search, mode: "insensitive" } },
        { fullNameAr: { contains: search, mode: "insensitive" } },
      ];
    }
    if (department && department !== "all") where.department = department;
    if (status && status !== "all") where.status = status;
    if (nationality && nationality !== "all") where.nationality = nationality;
    if (visaType && visaType !== "all") where.visaType = visaType;

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
  nationality: z.string().optional().default("Saudi"),
  gender: z.string().optional().default("male"),
  dateOfBirth: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  jobTitle: z.string().optional().default("Staff"),
  department: z.string().optional().default("Production"),
  employmentType: z.string().optional(),
  hireDate: z.string().optional().nullable().default(() => new Date().toISOString().slice(0, 10)),
  contractEnd: z.string().optional().nullable(),
  basicSalary: z.coerce.number().optional().default(0),
  allowances: z.coerce.number().optional().default(0),
  bankAccount: z.string().optional().nullable(),
  iban: z.string().optional().nullable(),
  passportNo: z.string().optional().nullable(),
  passportExpiry: z.string().optional().nullable(),
  iqamaNo: z.string().optional().nullable(),
  iqamaExpiry: z.string().optional().nullable(),
  visaType: z.string().optional().nullable(),
  status: z.string().optional().default("active"),
  profilePhoto: z.string().optional().nullable(),
  iqamaPhoto: z.string().optional().nullable(),
  passportPhoto: z.string().optional().nullable(),
  avatarColor: z.string().optional(),
  notes: z.string().optional().nullable(),
  leaveAnnual: z.coerce.number().optional().default(21),
  leaveSick: z.coerce.number().optional().default(30),
  leaveEmergency: z.coerce.number().optional().default(3),
  leaveCasualPerMonth: z.coerce.number().optional().default(4),
}).passthrough();

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
        dateOfBirth: (() => {
          if (!d.dateOfBirth || !String(d.dateOfBirth).trim()) return null;
          const dt = new Date(d.dateOfBirth);
          return isNaN(dt.getTime()) ? null : dt;
        })(),
        maritalStatus: d.maritalStatus ?? null,
        phone: d.phone ?? null,
        email: d.email ?? null,
        address: d.address ?? null,
        emergencyContact: d.emergencyContact ?? null,
        jobTitle: d.jobTitle,
        department: d.department,
        employmentType: d.employmentType || "full_time",
        hireDate: (() => {
          if (!d.hireDate || !String(d.hireDate).trim()) return new Date();
          const date = new Date(d.hireDate);
          return isNaN(date.getTime()) ? new Date() : date;
        })(),
        contractEnd: (() => {
          if (!d.contractEnd || !String(d.contractEnd).trim()) return null;
          const dt = new Date(d.contractEnd);
          return isNaN(dt.getTime()) ? null : dt;
        })(),
        basicSalary: d.basicSalary ?? 0,
        allowances: d.allowances ?? 0,
        bankAccount: d.bankAccount ?? null,
        iban: d.iban ?? null,
        passportNo: d.passportNo ?? null,
        passportExpiry: (() => {
          if (!d.passportExpiry || !String(d.passportExpiry).trim()) return null;
          const dt = new Date(d.passportExpiry);
          return isNaN(dt.getTime()) ? null : dt;
        })(),
        iqamaNo: d.iqamaNo ?? null,
        iqamaExpiry: (() => {
          if (!d.iqamaExpiry || !String(d.iqamaExpiry).trim()) return null;
          const dt = new Date(d.iqamaExpiry);
          return isNaN(dt.getTime()) ? null : dt;
        })(),
        visaType: d.visaType ?? null,
        status: d.status || "active",
        profilePhoto: d.profilePhoto ?? null,
        iqamaPhoto: d.iqamaPhoto ?? null,
        passportPhoto: d.passportPhoto ?? null,
        avatarColor: d.avatarColor || "#1e3a8a",
        notes: d.notes ?? null,
        leaveAnnual: d.leaveAnnual ?? 21,
        leaveSick: d.leaveSick ?? 30,
        leaveEmergency: d.leaveEmergency ?? 3,
        leaveCasualPerMonth: d.leaveCasualPerMonth ?? 4,
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