import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function main() {
  console.log("🌱 Seeding database...");

  // ── Super Admin ──────────────────────────────────────────────────────────
  const superAdminUser = await prisma.user.upsert({
    where: { email: "superadmin@erp.local" },
    update: {},
    create: {
      email:    "superadmin@erp.local",
      password: await bcrypt.hash("SuperAdmin@123", BCRYPT_ROUNDS),
      role:     "SUPER_ADMIN",
      isActive: true,
    },
  });

  await prisma.admin.upsert({
    where: { userId: superAdminUser.id },
    update: {},
    create: {
      userId:    superAdminUser.id,
      name:      "Super Admin",
      department: "Administration",
      createdBy: superAdminUser.id,
    },
  });

  console.log("✅ Super Admin created:", superAdminUser.email);

  // ── Admin ────────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@erp.local" },
    update: {},
    create: {
      email:    "admin@erp.local",
      password: await bcrypt.hash("Admin@123", BCRYPT_ROUNDS),
      role:     "ADMIN",
      isActive: true,
    },
  });

  await prisma.admin.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId:     adminUser.id,
      name:       "Placement Admin",
      department: "Training & Placement Cell",
      phone:      "+91-9876543210",
      createdBy:  superAdminUser.id,
    },
  });

  console.log("✅ Admin created:", adminUser.email);

  // ── Students ─────────────────────────────────────────────────────────────
  const students = [
    { email: "student1@erp.local", name: "Rahul Sharma",   rollNumber: "CS2021001", branch: "Computer Science",       cgpa: 8.5, graduationYear: 2025 },
    { email: "student2@erp.local", name: "Priya Patel",    rollNumber: "EC2021002", branch: "Electronics",             cgpa: 9.1, graduationYear: 2025 },
    { email: "student3@erp.local", name: "Arjun Singh",    rollNumber: "ME2021003", branch: "Mechanical Engineering",  cgpa: 7.8, graduationYear: 2025 },
    { email: "student4@erp.local", name: "Sneha Gupta",    rollNumber: "CS2021004", branch: "Computer Science",        cgpa: 8.9, graduationYear: 2025 },
    { email: "student5@erp.local", name: "Karan Mehta",    rollNumber: "IT2021005", branch: "Information Technology",  cgpa: 7.2, graduationYear: 2025 },
  ];

  const studentPassword = await bcrypt.hash("Student@123", BCRYPT_ROUNDS);

  for (const s of students) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email:    s.email,
        password: studentPassword,
        role:     "STUDENT",
        isActive: true,
      },
    });

    await prisma.student.upsert({
      where: { rollNumber: s.rollNumber },
      update: {},
      create: {
        userId:         user.id,
        name:           s.name,
        rollNumber:     s.rollNumber,
        branch:         s.branch,
        cgpa:           s.cgpa,
        graduationYear: s.graduationYear,
      },
    });

    console.log("✅ Student created:", s.email);
  }

  console.log("\n🎉 Seed complete!\n");
  console.log("Credentials:");
  console.log("  Super Admin  →  superadmin@erp.local  /  SuperAdmin@123");
  console.log("  Admin        →  admin@erp.local        /  Admin@123");
  console.log("  Students     →  student1@erp.local … student5@erp.local  /  Student@123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
