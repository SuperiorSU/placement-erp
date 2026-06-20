import { prisma } from "@/lib/db/prisma";
import { NotFoundError } from "@/lib/utils/errors";
import { logActivity } from "@/lib/middleware/audit.middleware";
import type { PlacementType } from "@prisma/client";
import type {
  CreateManualPlacementInput,
  PlacementListQuery,
} from "@/lib/validations/placement.schema";

export type PlacementItem = {
  id:            string;
  type:          PlacementType;
  company:       string;
  jobRole:       string;
  ctc:           number;
  joiningDate:   Date | null;
  academicYear:  string;
  referralSource: string | null;
  createdAt:     Date;
  student: {
    id:         string;
    name:       string;
    rollNumber: string;
    branch:     string;
    user:       { email: string };
  };
};

export type PlacementStats = {
  total:         number;
  campus:        number;
  manual:        number;
  ppo:           number;
  uniqueStudents: number;
  avgCtc:        number;
};

const SELECT = {
  id: true, type: true, company: true, jobRole: true, ctc: true,
  joiningDate: true, academicYear: true, referralSource: true, createdAt: true,
  student: {
    select: {
      id: true, name: true, rollNumber: true, branch: true,
      user: { select: { email: true } },
    },
  },
} as const;

function toItem(raw: any): PlacementItem {
  return { ...raw, ctc: Number(raw.ctc) };
}

export const PlacementService = {
  async list(query: PlacementListQuery): Promise<{ items: PlacementItem[]; total: number }> {
    const { page, limit, type, academicYear, branch, q } = query;

    const where: any = {};
    if (type) where.type = type;
    if (academicYear) where.academicYear = academicYear;
    if (branch) where.student = { branch };
    if (q) {
      where.OR = [
        { student: { name: { contains: q, mode: "insensitive" } } },
        { student: { rollNumber: { contains: q, mode: "insensitive" } } },
        { company: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.placement.findMany({
        where,
        select: SELECT,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.placement.count({ where }),
    ]);

    return { items: items.map(toItem), total };
  },

  async createManual(
    data: CreateManualPlacementInput,
    adminId: string,
    ip?: string
  ): Promise<PlacementItem> {
    const {
      studentId, company, jobRole, ctc, referralSource,
      joiningDate, type, academicYear,
    } = data;

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundError("Student not found");

    const typeMap: Record<string, PlacementType> = {
      "Intern": "MANUAL",
      "Full-time": "MANUAL",
      "PPO": "PPO",
    };

    const [manual, placement] = await prisma.$transaction([
      prisma.manualPlacement.create({
        data: {
          adminId, studentId, company, jobRole,
          ctc, referralSource,
          joiningDate: joiningDate ? new Date(joiningDate) : null,
          type, academicYear,
        },
      }),
      prisma.placement.create({
        data: {
          studentId,
          type: typeMap[type] ?? "MANUAL",
          company, jobRole, ctc, referralSource, academicYear,
          joiningDate: joiningDate ? new Date(joiningDate) : null,
        },
        select: SELECT,
      }),
    ]);

    logActivity(
      adminId, "CREATE_MANUAL_PLACEMENT", "Placement", placement.id,
      { manualPlacementId: manual.id }, ip
    ).catch(() => {});

    return toItem(placement);
  },

  async getStats(academicYear?: string): Promise<PlacementStats> {
    const where: any = {};
    if (academicYear) where.academicYear = academicYear;

    const [groups, uniqueStudentIds, ctcAgg] = await Promise.all([
      prisma.placement.groupBy({ by: ["type"], where, _count: { id: true } }),
      prisma.placement.findMany({ where, select: { studentId: true }, distinct: ["studentId"] }),
      prisma.placement.aggregate({ where, _avg: { ctc: true } }),
    ]);

    const counts = Object.fromEntries(groups.map((g) => [g.type, g._count.id]));

    return {
      total:          groups.reduce((s, g) => s + g._count.id, 0),
      campus:         counts["CAMPUS"] ?? 0,
      manual:         counts["MANUAL"] ?? 0,
      ppo:            counts["PPO"]    ?? 0,
      uniqueStudents: uniqueStudentIds.length,
      avgCtc:         Number(ctcAgg._avg.ctc ?? 0),
    };
  },
};
