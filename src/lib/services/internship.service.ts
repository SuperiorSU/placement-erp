import { prisma } from "@/lib/db/prisma";
import { NotFoundError } from "@/lib/utils/errors";
import { logActivity } from "@/lib/middleware/audit.middleware";
import type { InternshipOutcome } from "@prisma/client";
import type {
  CreateInternshipInput,
  UpdateInternshipInput,
  InternshipListQuery,
} from "@/lib/validations/internship.schema";

export type InternshipItem = {
  id:             string;
  startDate:      Date;
  endDate:        Date;
  durationMonths: number;
  outcome:        InternshipOutcome;
  followUpNotes:  string | null;
  alertSent:      boolean;
  createdAt:      Date;
  student: {
    id:         string;
    name:       string;
    rollNumber: string;
    branch:     string;
    user:       { email: string };
  };
  placement: {
    id:           string;
    company:      string;
    jobRole:      string;
    ctc:          number;
    academicYear: string;
  };
};

export type InternshipDetail = InternshipItem;

export type InternshipAlertItem = {
  id:           string;
  endDate:      Date;
  studentName:  string;
  studentEmail: string;
  company:      string;
};

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

const SELECT = {
  id: true, startDate: true, endDate: true, durationMonths: true,
  outcome: true, followUpNotes: true, alertSent: true, createdAt: true,
  student: {
    select: {
      id: true, name: true, rollNumber: true, branch: true,
      user: { select: { email: true } },
    },
  },
  placement: {
    select: {
      id: true, company: true, jobRole: true, ctc: true, academicYear: true,
    },
  },
} as const;

function toItem(raw: any): InternshipItem {
  return { ...raw, placement: { ...raw.placement, ctc: Number(raw.placement.ctc) } };
}

export const InternshipService = {
  async list(query: InternshipListQuery): Promise<{ items: InternshipItem[]; total: number }> {
    const { page, limit, outcome, branch, academicYear, endingSoon, q } = query;

    const now = new Date();
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(now.getDate() + 7);

    const where: any = {};
    if (outcome) where.outcome = outcome;
    if (endingSoon === "true") {
      where.endDate = { gte: now, lte: sevenDaysLater };
      where.outcome = "ONGOING";
    }
    if (branch) where.student = { branch };
    if (academicYear) where.placement = { academicYear };
    if (q) {
      where.OR = [
        { student: { name: { contains: q, mode: "insensitive" } } },
        { student: { rollNumber: { contains: q, mode: "insensitive" } } },
        { placement: { company: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.internship.findMany({
        where,
        select: SELECT,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { endDate: "asc" },
      }),
      prisma.internship.count({ where }),
    ]);

    return { items: items.map(toItem), total };
  },

  async getById(id: string): Promise<InternshipDetail> {
    const row = await prisma.internship.findUnique({ where: { id }, select: SELECT });
    if (!row) throw new NotFoundError("Internship not found");
    return toItem(row);
  },

  async create(
    data: CreateInternshipInput,
    adminId: string,
    ip?: string
  ): Promise<InternshipItem> {
    const { studentId, placementId, startDate, durationMonths, followUpNotes } = data;

    const placement = await prisma.placement.findUnique({ where: { id: placementId } });
    if (!placement) throw new NotFoundError("Placement record not found");

    const start = new Date(startDate);
    const end = addMonths(start, durationMonths);

    const row = await prisma.internship.create({
      data: { studentId, placementId, startDate: start, durationMonths, endDate: end, followUpNotes },
      select: SELECT,
    });

    logActivity(adminId, "CREATE_INTERNSHIP", "Internship", row.id, undefined, ip).catch(() => {});
    return toItem(row);
  },

  async update(
    id: string,
    data: UpdateInternshipInput,
    adminId: string,
    ip?: string
  ): Promise<InternshipItem> {
    const existing = await prisma.internship.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Internship not found");

    const updateData: any = {};
    if (data.outcome) updateData.outcome = data.outcome;
    if (data.followUpNotes !== undefined) updateData.followUpNotes = data.followUpNotes;

    if (data.startDate || data.durationMonths !== undefined) {
      const start = data.startDate ? new Date(data.startDate) : existing.startDate;
      const months = data.durationMonths ?? existing.durationMonths;
      updateData.startDate = start;
      updateData.durationMonths = months;
      updateData.endDate = addMonths(start, months);
    }

    const row = await prisma.internship.update({ where: { id }, data: updateData, select: SELECT });
    logActivity(adminId, "UPDATE_INTERNSHIP", "Internship", id, undefined, ip).catch(() => {});
    return toItem(row);
  },

  async getAlertsToSend(): Promise<InternshipAlertItem[]> {
    const now = new Date();
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(now.getDate() + 7);

    const rows = await prisma.internship.findMany({
      where: {
        alertSent: false,
        outcome: "ONGOING",
        endDate: { gte: now, lte: sevenDaysLater },
      },
      select: {
        id: true, endDate: true,
        student: { select: { name: true, user: { select: { email: true } } } },
        placement: { select: { company: true } },
      },
    });

    return rows.map((r) => ({
      id:           r.id,
      endDate:      r.endDate,
      studentName:  r.student.name,
      studentEmail: r.student.user.email,
      company:      r.placement.company,
    }));
  },

  async markAlertSent(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await prisma.internship.updateMany({
      where: { id: { in: ids } },
      data: { alertSent: true, alertSentAt: new Date() },
    });
  },
};
