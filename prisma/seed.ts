 
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;

function dateOffset(days: number, h = 0, m = 0): Date {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function main() {
  console.log("Seeding Tanoor Al Jazeera HR database...");

  // Wipe existing data (order matters for foreign keys)
  await prisma.kpi.deleteMany();
  await prisma.document.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.file.deleteMany();

  // Users
  const adminPass = await bcrypt.hash("tanoor2025", 10);
  const hrPass = await bcrypt.hash("hr2025", 10);

  await prisma.user.create({
    data: { username: "admin", password: adminPass, name: "System Administrator", role: "admin", email: "admin@tanoor.sa" },
  });
  await prisma.user.create({
    data: { username: "hr", password: hrPass, name: "HR Manager", role: "hr", email: "hr@tanoor.sa" },
  });
  console.log("✓ Users seeded (admin, hr)");

  const colors = ["#1e3a8a", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#0ea5e9", "#f97316", "#ec4899", "#14b8a6", "#84cc16", "#6366f1"];
  const departments = ["Production", "Quality Control", "Maintenance", "Logistics", "Administration", "Sales"];

  const empSeed = [
    { en: "Abdullah Al-Qahtani", ar: "عبدالله القحطاني", nat: "Saudi", job: "Production Manager", dept: "Production", salary: 18000, allow: 2500, visa: "Saudi National" },
    { en: "Mohammed Al-Harbi", ar: "محمد الحربي", nat: "Saudi", job: "Quality Supervisor", dept: "Quality Control", salary: 14000, allow: 2000, visa: "Saudi National" },
    { en: "Fahd Al-Otaibi", ar: "فهد العتيبي", nat: "Saudi", job: "Maintenance Technician", dept: "Maintenance", salary: 9500, allow: 1500, visa: "Saudi National" },
    { en: "Khalid Al-Dossari", ar: "خالد الدوسري", nat: "Saudi", job: "Logistics Coordinator", dept: "Logistics", salary: 8500, allow: 1200, visa: "Saudi National" },
    { en: "Nasser Al-Subaie", ar: "ناصر السبيعي", nat: "Saudi", job: "Admin Officer", dept: "Administration", salary: 11000, allow: 1800, visa: "Saudi National" },
    { en: "Salem Al-Ghamdi", ar: "سالم الغامدي", nat: "Saudi", job: "Sales Representative", dept: "Sales", salary: 9000, allow: 2200, visa: "Saudi National" },
    { en: "Rajesh Kumar", ar: "راجيش كومار", nat: "Indian", job: "Production Operator", dept: "Production", salary: 3200, allow: 600, visa: "Iqama" },
    { en: "Suresh Patel", ar: "سوريش باتيل", nat: "Indian", job: "Quality Inspector", dept: "Quality Control", salary: 3600, allow: 700, visa: "Iqama" },
    { en: "Arun Singh", ar: "أرون سينغ", nat: "Indian", job: "Maintenance Engineer", dept: "Maintenance", salary: 4500, allow: 800, visa: "Iqama" },
    { en: "Vijay Sharma", ar: "فيجاي شارما", nat: "Indian", job: "Forklift Driver", dept: "Logistics", salary: 2800, allow: 500, visa: "Iqama" },
    { en: "Priya Nair", ar: "بريا ناير", nat: "Indian", job: "HR Assistant", dept: "Administration", salary: 3800, allow: 650, visa: "Iqama" },
    { en: "Anil Verma", ar: "أنيل فيرما", nat: "Indian", job: "Sales Executive", dept: "Sales", salary: 3400, allow: 900, visa: "Iqama" },
  ];

  const employees: any[] = [];
  for (let i = 0; i < empSeed.length; i++) {
    const s = empSeed[i];
    const empNo = `TAJ-${String(i + 1).padStart(3, "0")}`;
    const isSaudi = s.nat === "Saudi";
    const emp = await prisma.employee.create({
      data: {
        empNo,
        fullName: s.en,
        fullNameAr: s.ar,
        nationality: s.nat,
        gender: i === 10 ? "female" : "male",
        dateOfBirth: dateOffset(-Math.floor(25 + Math.random() * 25) * 365),
        maritalStatus: i % 3 === 0 ? "single" : "married",
        phone: `+9665${String(Math.floor(10000000 + Math.random() * 89999999))}`,
        email: `${s.en.toLowerCase().replace(/[^a-z]/g, ".")}@tanoor.sa`,
        address: "Industrial City, Dammam, Saudi Arabia",
        emergencyContact: `+9665${String(Math.floor(10000000 + Math.random() * 89999999))}`,
        jobTitle: s.job,
        department: s.dept,
        employmentType: "full_time",
        hireDate: dateOffset(-Math.floor(180 + Math.random() * 900)),
        contractEnd: i % 4 === 0 ? dateOffset(Math.floor(60 + Math.random() * 365)) : null,
        basicSalary: s.salary,
        allowances: s.allow,
        bankAccount: `SA${String(Math.floor(100000000000000000000 + Math.random() * 89999999999999999999)).slice(0, 20)}`,
        iban: `SA03 8000 0000 6080 ${String(Math.floor(1000000000 + Math.random() * 8999999999))}`,
        passportNo: isSaudi ? null : `P${String(Math.floor(1000000 + Math.random() * 8999999))}`,
        passportExpiry: isSaudi ? null : dateOffset(Math.floor(60 + Math.random() * 900)),
        iqamaNo: isSaudi ? `1${String(Math.floor(10000000 + Math.random() * 89999999))}` : `2${String(Math.floor(10000000 + Math.random() * 89999999))}`,
        iqamaExpiry: dateOffset(Math.floor(-30 + Math.random() * 420)),
        visaType: s.visa,
        status: i === 11 ? "on_leave" : "active",
        avatarColor: colors[i % colors.length],
        notes: i % 2 === 0 ? "Reliable employee with strong performance record." : null,
      },
    });
    employees.push(emp);
  }
  console.log(`✓ ${employees.length} employees seeded`);

  // Attendance — last 7 days
  const attendanceTypes = [
    { status: "present", in: 7, out: 16, late: false },
    { status: "present", in: 7, out: 16, late: false },
    { status: "present", in: 7, out: 16, late: false },
    { status: "late", in: 8, out: 17, late: true },
    { status: "present", in: 7, out: 16, late: false },
    { status: "present", in: 7, out: 16, late: false },
    { status: "absent", in: 0, out: 0, late: false },
  ];
  let attCount = 0;
  for (let dayOffset = -1; dayOffset >= -7; dayOffset--) {
    for (const emp of employees) {
      const pattern = attendanceTypes[Math.abs(dayOffset) - 1];
      const date = dateOffset(dayOffset);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 5) continue; // Friday off
      if (emp.status === "on_leave") {
        await prisma.attendance.create({
          data: {
            employeeId: emp.id,
            date,
            status: "leave",
            workHours: 0,
            notes: "On approved leave",
          },
        });
        attCount++;
        continue;
      }
      if (pattern.status === "absent" && Math.random() < 0.4) continue;
      const checkIn = pattern.in ? dateOffset(dayOffset, pattern.in, Math.floor(Math.random() * 25)) : null;
      const checkOut = pattern.out ? dateOffset(dayOffset, pattern.out, Math.floor(Math.random() * 30)) : null;
      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          date,
          checkIn,
          checkOut,
          status: pattern.status,
          workHours: pattern.in && pattern.out ? pattern.out - pattern.in : 0,
          overtime: Math.random() < 0.2 ? Math.round(Math.random() * 3 * 10) / 10 : 0,
        },
      });
      attCount++;
    }
  }
  console.log(`✓ ${attCount} attendance records seeded`);

  // Leave requests — 8
  const leaveTypes = ["annual", "sick", "emergency", "unpaid", "maternity"];
  const leaveStatuses = ["pending", "pending", "approved", "approved", "rejected"];
  for (let i = 0; i < 8; i++) {
    const emp = employees[(i * 2) % employees.length];
    const start = dateOffset(i * 5 - 20);
    const days = 1 + Math.floor(Math.random() * 5);
    const end = new Date(start.getTime() + days * DAY);
    await prisma.leave.create({
      data: {
        employeeId: emp.id,
        type: leaveTypes[i % leaveTypes.length],
        startDate: start,
        endDate: end,
        days,
        reason: ["Family event", "Medical appointment", "Personal matter", "Religious observance", "Vacation plan"][i % 5],
        status: leaveStatuses[i % leaveStatuses.length],
        approver: i % 3 === 0 ? "System Administrator" : null,
      },
    });
  }
  console.log("✓ 8 leave requests seeded");

  // Payroll — last 3 months
  const now = new Date();
  for (let m = 0; m < 3; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const mk = monthKey(d);
    for (const emp of employees) {
      const isSaudi = emp.nationality === "Saudi";
      const gosiRate = isSaudi ? 0.0975 : 0.02;
      const overtime = Math.random() < 0.3 ? Math.round((Math.random() * 800) * 100) / 100 : 0;
      const deductions = Math.round((Math.random() * 400) * 100) / 100;
      const gosi = Math.round(emp.basicSalary * gosiRate * 100) / 100;
      const net = Math.round((emp.basicSalary + emp.allowances + overtime - deductions - gosi) * 100) / 100;
      await prisma.payroll.create({
        data: {
          employeeId: emp.id,
          month: mk,
          basicSalary: emp.basicSalary,
          allowances: emp.allowances,
          overtime,
          deductions,
          gosi,
          netSalary: net,
          status: m === 0 ? "processed" : "paid",
          payDate: m === 0 ? null : new Date(d.getFullYear(), d.getMonth(), 27),
        },
      });
    }
  }
  console.log("✓ Payroll for 3 months seeded");

  // Documents — iqama/passport/contract with varying expiry
  let docCount = 0;
  for (const emp of employees) {
    const isSaudi = emp.nationality === "Saudi";
    // Iqama/National ID
    await prisma.document.create({
      data: {
        employeeId: emp.id,
        title: isSaudi ? "National ID" : "Iqama",
        type: "iqama",
        issueDate: dateOffset(-300),
        expiryDate: emp.iqamaExpiry,
        fileName: `${emp.empNo}_iqama.pdf`,
        fileSize: 240000,
        mimeType: "application/pdf",
      },
    });
    docCount++;
    // Passport
    if (!isSaudi) {
      await prisma.document.create({
        data: {
          employeeId: emp.id,
          title: "Passport",
          type: "passport",
          issueDate: dateOffset(-1000),
          expiryDate: emp.passportExpiry,
          fileName: `${emp.empNo}_passport.pdf`,
          fileSize: 280000,
          mimeType: "application/pdf",
        },
      });
      docCount++;
    }
    // Contract
    await prisma.document.create({
      data: {
        employeeId: emp.id,
        title: "Employment Contract",
        type: "contract",
        issueDate: emp.hireDate,
        expiryDate: emp.contractEnd || dateOffset(365),
        fileName: `${emp.empNo}_contract.pdf`,
        fileSize: 180000,
        mimeType: "application/pdf",
      },
    });
    docCount++;
  }
  console.log(`✓ ${docCount} documents seeded`);

  // Candidates — 5
  const candidates = [
    { name: "Yousef Al-Mutairi", pos: "Production Operator", dept: "Production", status: "interview", rating: 4, exp: 3 },
    { name: "Deepak Reddy", pos: "Maintenance Engineer", dept: "Maintenance", status: "offered", rating: 5, exp: 6 },
    { name: "Ahmed Al-Shehri", pos: "Sales Executive", dept: "Sales", status: "screening", rating: 3, exp: 2 },
    { name: "Rahul Gupta", pos: "Quality Inspector", dept: "Quality Control", status: "applied", rating: 3, exp: 4 },
    { name: "Bader Al-Anazi", pos: "HR Officer", dept: "Administration", status: "hired", rating: 5, exp: 5 },
  ];
  for (const c of candidates) {
    await prisma.candidate.create({
      data: {
        fullName: c.name,
        email: `${c.name.toLowerCase().replace(/[^a-z]/g, ".")}@email.com`,
        phone: `+9665${String(Math.floor(10000000 + Math.random() * 89999999))}`,
        position: c.pos,
        department: c.dept,
        source: ["LinkedIn", "Referral", "Job Board", "Walk-in"][Math.floor(Math.random() * 4)],
        experience: c.exp,
        status: c.status,
        rating: c.rating,
        expectedSalary: 3000 + c.exp * 800,
        notes: "Promising candidate with relevant experience.",
        appliedAt: dateOffset(-Math.floor(Math.random() * 30)),
      },
    });
  }
  console.log("✓ 5 candidates seeded");

  // KPIs — 8 employees, current month
  const kpiEmployees = employees.slice(0, 8);
  for (let i = 0; i < kpiEmployees.length; i++) {
    const emp = kpiEmployees[i];
    const productivity = 70 + Math.floor(Math.random() * 30);
    const quality = 70 + Math.floor(Math.random() * 30);
    const teamwork = 70 + Math.floor(Math.random() * 30);
    const punctuality = 70 + Math.floor(Math.random() * 30);
    const initiative = 70 + Math.floor(Math.random() * 30);
    const finalScore = Math.round(((productivity + quality + teamwork + punctuality + initiative) / 5) * 100) / 100;
    await prisma.kpi.create({
      data: {
        employeeId: emp.id,
        period: monthKey(now),
        productivity,
        quality,
        teamwork,
        punctuality,
        initiative,
        finalScore,
        comments: ["Excellent performance across all metrics.", "Strong team player, needs improvement in punctuality.", "Consistently meets targets.", "Outstanding initiative and quality work."][i % 4],
      },
    });
  }
  console.log("✓ 8 KPI records seeded");

  console.log("\n🎉 Seed complete!");
  console.log("Login: admin / tanoor2025  OR  hr / hr2025");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
