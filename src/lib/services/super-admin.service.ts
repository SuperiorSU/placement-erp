import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { ConflictError, NotFoundError } from "@/lib/utils/errors";
import { logActivity } from "@/lib/middleware/audit.middleware";

export type DashboardStats = {
  totalStudents:       number;
  totalAdmins:         number;
  totalCompanies:      number;
  totalDrives:         number;
  activeDrives:        number;
  placedStudents:      number;
  ongoingInternships:  number;
};

export type MonthlyPoint = { month: string; count: number };
export type BranchPoint  = { branch: string; count: number };
export type CompanyPoint = { company: string; count: number };

export type AnalyticsData = {
  year:               string;
  totalPlacements:    number;
  avgCtc:             number;
  conversionRate:     number;
  monthly:            MonthlyPoint[];
  branchWise:         BranchPoint[];
  topCompanies:       CompanyPoint[];
};

export type AdminItem = {
  id:         string;
  userId:     string;
  name:       string;
  email:      string;
  phone:      string | null;
  department: string | null;
  isActive:   boolean;
  createdAt:  Date;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const ADMIN_SELECT = {
  id: true, userId: true, name: true, phone: true, department: true,
  user: { select: { email: true, isActive: true, createdAt: true } },
} as const;

function toAdminItem(raw: any): AdminItem {
  return {
    id:         raw.id,
    userId:     raw.userId,
    name:       raw.name,
    phone:      raw.phone,
    department: raw.department,
    isActive:   raw.user.isActive,
    email:      raw.user.email,
    createdAt:  raw.user.createdAt,
  };
}

export const SuperAdminService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalStudents,
      totalAdmins,
      totalCompanies,
      totalDrives,
      activeDrives,
      placedStudentIds,
      ongoingInternships,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT", isActive: true } }),
      prisma.user.count({ where: { role: "ADMIN",   isActive: true } }),
      prisma.company.count({ where: { deletedAt: null } }),
      prisma.drive.count(),
      prisma.drive.count({ where: { status: "ACTIVE" } }),
      prisma.placement.findMany({ select: { studentId: true }, distinct: ["studentId"] }),
      prisma.internship.count({ where: { outcome: "ONGOING" } }),
    ]);

    return {
      totalStudents,
      totalAdmins,
      totalCompanies,
      totalDrives,
      activeDrives,
      placedStudents: placedStudentIds.length,
      ongoingInternships,
    };
  },

  async getAnalytics(year: string): Promise<AnalyticsData> {
    const placements = await prisma.placement.findMany({
      where: { academicYear: year },
      select: { joiningDate: true, ctc: true, company: true },
    });

    const students = await prisma.user.count({ where: { role: "STUDENT", isActive: true } });

    const monthlyMap = new Map<number, number>();
    let ctcSum = 0;
    for (const p of placements) {
      ctcSum += Number(p.ctc);
      if (p.joiningDate) {
        const m = p.joiningDate.getMonth();
        monthlyMap.set(m, (monthlyMap.get(m) ?? 0) + 1);
      }
    }

    const monthly: MonthlyPoint[] = MONTHS.map((month, i) => ({
      month,
      count: monthlyMap.get(i) ?? 0,
    }));

    const allPlacements = await prisma.placement.findMany({
      where: { academicYear: year },
      select: { student: { select: { branch: true } }, company: true },
    });

    const branchMap = new Map<string, number>();
    const companyMap = new Map<string, number>();
    for (const p of allPlacements) {
      const b = p.student.branch;
      branchMap.set(b, (branchMap.get(b) ?? 0) + 1);
      companyMap.set(p.company, (companyMap.get(p.company) ?? 0) + 1);
    }

    const branchWise: BranchPoint[] = [...branchMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([branch, count]) => ({ branch, count }));

    const topCompanies: CompanyPoint[] = [...companyMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([company, count]) => ({ company, count }));

    const internshipOutcomes = await prisma.internship.groupBy({
      by: ["outcome"],
      where: { placement: { academicYear: year } },
      _count: { id: true },
    });
    const outcomeMap = Object.fromEntries(
      internshipOutcomes.map((g) => [g.outcome, g._count.id])
    );
    const converted    = outcomeMap["CONVERTED"]     ?? 0;
    const notConverted = outcomeMap["NOT_CONVERTED"] ?? 0;
    const extended     = outcomeMap["EXTENDED"]      ?? 0;
    const conversionDenom = converted + notConverted + extended;

    return {
      year,
      totalPlacements: placements.length,
      avgCtc:          placements.length > 0 ? ctcSum / placements.length : 0,
      conversionRate:  conversionDenom > 0 ? (converted / conversionDenom) * 100 : 0,
      monthly,
      branchWise,
      topCompanies,
    };
  },

  async listAdmins(query: {
    page: number;
    limit: number;
    q?: string;
  }): Promise<{ items: AdminItem[]; total: number }> {
    const { page, limit, q } = query;

    const where: any = { user: { role: "ADMIN" } };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        { department: { contains: q, mode: "insensitive" } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.admin.findMany({
        where,
        select: ADMIN_SELECT,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { user: { createdAt: "desc" } },
      }),
      prisma.admin.count({ where }),
    ]);

    return { items: rows.map(toAdminItem), total };
  },

  async getAdminActivity(
    adminUserId: string,
    query: { page: number; limit: number }
  ): Promise<{ items: any[]; total: number }> {
    const { page, limit } = query;

    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { userId: adminUserId },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.activityLog.count({ where: { userId: adminUserId } }),
    ]);

    return { items, total };
  },

  async createAdmin(
    data: { name: string; email: string; password: string; phone?: string; department?: string },
    superAdminId: string,
    ip?: string
  ): Promise<AdminItem> {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictError("An account with this email already exists");

    const hashed = await bcrypt.hash(data.password, 12);

    const admin = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: data.email, password: hashed, role: "ADMIN" },
      });
      return tx.admin.create({
        data: {
          userId:     user.id,
          name:       data.name,
          phone:      data.phone,
          department: data.department,
          createdBy:  superAdminId,
        },
        select: ADMIN_SELECT,
      });
    });

    logActivity(superAdminId, "CREATE_ADMIN", "Admin", admin.id, undefined, ip).catch(() => {});
    return toAdminItem(admin);
  },

  async updateAdmin(
    adminId: string,
    data: { name?: string; phone?: string; department?: string; isActive?: boolean },
    superAdminId: string,
    ip?: string
  ): Promise<AdminItem> {
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) throw new NotFoundError("Admin not found");

    const { isActive, ...profileData } = data;

    await prisma.$transaction([
      ...(isActive !== undefined
        ? [prisma.user.update({ where: { id: admin.userId }, data: { isActive } })]
        : []),
      ...(Object.keys(profileData).length > 0
        ? [prisma.admin.update({ where: { id: adminId }, data: profileData })]
        : []),
    ]);

    const updated = await prisma.admin.findUniqueOrThrow({
      where: { id: adminId },
      select: ADMIN_SELECT,
    });

    logActivity(superAdminId, "UPDATE_ADMIN", "Admin", adminId, undefined, ip).catch(() => {});
    return toAdminItem(updated);
  },

  async deleteAdmin(
    adminId: string,
    superAdminId: string,
    ip?: string
  ): Promise<void> {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, userId: true },
    });
    if (!admin) throw new NotFoundError("Admin not found");

    const activeDrives = await prisma.drive.count({
      where: { adminId, status: "ACTIVE" },
    });
    if (activeDrives > 0) {
      throw new ConflictError("Cannot deactivate admin with active drives. Reassign or complete the drives first.");
    }

    await prisma.user.update({ where: { id: admin.userId }, data: { isActive: false } });
    logActivity(superAdminId, "DEACTIVATE_ADMIN", "Admin", adminId, undefined, ip).catch(() => {});
  },
};
