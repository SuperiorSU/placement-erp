import type { CompanyCategory, DriveStatus, FunnelStage, Prisma } from "@prisma/client";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/db/prisma";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/utils/errors";
import type {
  CreateDriveInput,
  UpdateDriveInput,
  DriveListQuery,
  EnrollStudentInput,
  ApplicationListQuery,
  UpdateFunnelStageInput,
  DriveParticipantQuery,
} from "@/lib/validations/drive.schema";

// ── Funnel ordering ────────────────────────────────────────────────────────────

const FUNNEL_ORDER: Record<FunnelStage, number> = {
  REGISTERED:   0,
  SHORTLISTED:  1,
  INTERVIEWED:  2,
  OFFERED:      3,
  NOT_SELECTED: 3,
};

const TERMINAL_STAGES = new Set<FunnelStage>(["OFFERED", "NOT_SELECTED"]);

// ── Return types ───────────────────────────────────────────────────────────────

export type DriveListItem = {
  id:           string;
  jobRole:      string;
  ctc:          number;
  jobLocation:  string;
  status:       DriveStatus;
  driveDate:    Date;
  academicYear: string;
  company:      { id: string; name: string; category: CompanyCategory };
  _count:       { applications: number };
};

export type StageCounts = {
  REGISTERED:   number;
  SHORTLISTED:  number;
  INTERVIEWED:  number;
  OFFERED:      number;
  NOT_SELECTED: number;
};

export type DriveDetail = {
  id:                  string;
  jobRole:             string;
  ctc:                 number;
  jobLocation:         string;
  eligibleBranches:    string[];
  minCgpa:             number;
  driveDate:           Date;
  applicationDeadline: Date | null;
  status:              DriveStatus;
  academicYear:        string;
  description:         string | null;
  createdAt:           Date;
  updatedAt:           Date;
  company:             { id: string; name: string; category: CompanyCategory; industry: string; hrName: string; hrEmail: string };
  admin:               { id: string; name: string };
  _count:              { applications: number };
  stageCounts:         StageCounts;
};

export type ApplicationItem = {
  id:              string;
  stage:           FunnelStage;
  appliedAt:       Date;
  updatedAt:       Date;
  notes:           string | null;
  offerLetterUrl:  string | null;
  offerLetterName: string | null;
  joiningDate:     Date | null;
  student: {
    id:         string;
    name:       string;
    rollNumber: string;
    branch:     string;
    cgpa:       number;
    phone:      string | null;
    user:       { email: string };
  };
};

export type EligibleStudent = {
  id:         string;
  name:       string;
  rollNumber: string;
  branch:     string;
  cgpa:       number;
  user:       { email: string };
};

export type BulkEnrollResult = {
  enrolled: number;
  skipped:  number;
  errors:   { rollNumber: string; reason: string }[];
};

export type DriveParticipant = {
  applicationId: string;
  stage:         FunnelStage;
  appliedAt:     Date;
  joiningDate:   Date | null;
  ctcOffered:    number | null;
  student: {
    id:         string;
    name:       string;
    rollNumber: string;
    branch:     string;
    cgpa:       number;
    user:       { email: string };
  };
  drive: {
    jobRole: string;
    ctc:     number;
  };
};

export type DriveSummary = {
  driveId:      string;
  jobRole:      string;
  ctc:          number;
  driveDate:    Date;
  status:       DriveStatus;
  academicYear: string;
  company:      { id: string; name: string; category: CompanyCategory };
  stageCounts:  StageCounts;
  branchBreakdown: Array<{
    branch:      string;
    registered:  number;
    offered:     number;
  }>;
  avgCtcOffered: number | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildDriveWhere(params: DriveListQuery): Prisma.DriveWhereInput {
  const where: Prisma.DriveWhereInput = {};

  if (params.status)       where.status       = params.status as DriveStatus;
  if (params.companyId)    where.companyId    = params.companyId;
  if (params.academicYear) where.academicYear = params.academicYear;

  if (params.q?.trim()) {
    where.OR = [
      { jobRole:      { contains: params.q, mode: "insensitive" } },
      { jobLocation:  { contains: params.q, mode: "insensitive" } },
      { company:      { name: { contains: params.q, mode: "insensitive" } } },
    ];
  }

  return where;
}

const ALLOWED_DRIVE_SORT: Record<string, string> = {
  driveDate:    "driveDate",
  createdAt:    "createdAt",
  academicYear: "academicYear",
  status:       "status",
};

function buildDriveOrderBy(sort = "driveDate", dir: "asc" | "desc" = "desc"): Prisma.DriveOrderByWithRelationInput {
  const field = ALLOWED_DRIVE_SORT[sort] ?? "driveDate";
  return { [field]: dir };
}

async function getAdminId(userId: string): Promise<string> {
  const admin = await prisma.admin.findUnique({
    where:  { userId },
    select: { id: true },
  });
  if (!admin) throw new ForbiddenError("Admin profile not found — cannot perform this action");
  return admin.id;
}

function toNumber(d: unknown): number {
  if (typeof d === "number") return d;
  return parseFloat(String(d));
}

async function computeStageCounts(driveId: string): Promise<StageCounts> {
  const rows = await prisma.driveApplication.groupBy({
    by:    ["stage"],
    where: { driveId },
    _count: { id: true },
  });

  const counts: StageCounts = {
    REGISTERED:   0,
    SHORTLISTED:  0,
    INTERVIEWED:  0,
    OFFERED:      0,
    NOT_SELECTED: 0,
  };

  for (const row of rows) {
    counts[row.stage] = row._count.id;
  }

  return counts;
}

// ── Service ────────────────────────────────────────────────────────────────────

export const DriveService = {

  async list(params: DriveListQuery): Promise<{ items: DriveListItem[]; total: number }> {
    const where   = buildDriveWhere(params);
    const orderBy = buildDriveOrderBy(params.sort, params.dir);
    const skip    = (params.page - 1) * params.limit;

    const [total, rows] = await prisma.$transaction([
      prisma.drive.count({ where }),
      prisma.drive.findMany({
        where,
        skip,
        take:    params.limit,
        orderBy,
        select: {
          id:           true,
          jobRole:      true,
          ctc:          true,
          jobLocation:  true,
          status:       true,
          driveDate:    true,
          academicYear: true,
          company: {
            select: { id: true, name: true, category: true },
          },
          _count: { select: { applications: true } },
        },
      }),
    ]);

    const items: DriveListItem[] = rows.map((r) => ({
      ...r,
      ctc: toNumber(r.ctc),
    }));

    return { items, total };
  },

  async getById(id: string): Promise<DriveDetail> {
    const drive = await prisma.drive.findUnique({
      where:  { id },
      select: {
        id:                  true,
        jobRole:             true,
        ctc:                 true,
        jobLocation:         true,
        eligibleBranches:    true,
        minCgpa:             true,
        driveDate:           true,
        applicationDeadline: true,
        status:              true,
        academicYear:        true,
        description:         true,
        createdAt:           true,
        updatedAt:           true,
        company: {
          select: { id: true, name: true, category: true, industry: true, hrName: true, hrEmail: true },
        },
        admin: {
          select: { id: true, name: true },
        },
        _count: { select: { applications: true } },
      },
    });

    if (!drive) throw new NotFoundError("Drive not found");

    const stageCounts = await computeStageCounts(id);

    return {
      ...drive,
      ctc:    toNumber(drive.ctc),
      minCgpa: toNumber(drive.minCgpa),
      stageCounts,
    };
  },

  async getApplications(
    driveId: string,
    params:  ApplicationListQuery
  ): Promise<{ items: ApplicationItem[]; total: number }> {
    const drive = await prisma.drive.findUnique({ where: { id: driveId }, select: { id: true } });
    if (!drive) throw new NotFoundError("Drive not found");

    const where: Prisma.DriveApplicationWhereInput = { driveId };
    if (params.stage)  where.stage           = params.stage as FunnelStage;
    if (params.branch) where.student         = { branch: { equals: params.branch, mode: "insensitive" } };
    if (params.q?.trim()) {
      where.student = {
        OR: [
          { name:       { contains: params.q, mode: "insensitive" } },
          { rollNumber: { contains: params.q, mode: "insensitive" } },
        ],
      };
    }

    const skip = (params.page - 1) * params.limit;

    const [total, rows] = await prisma.$transaction([
      prisma.driveApplication.count({ where }),
      prisma.driveApplication.findMany({
        where,
        skip,
        take:    params.limit,
        orderBy: { appliedAt: "desc" },
        select: {
          id:              true,
          stage:           true,
          appliedAt:       true,
          updatedAt:       true,
          notes:           true,
          offerLetterUrl:  true,
          offerLetterName: true,
          joiningDate:     true,
          student: {
            select: {
              id:         true,
              name:       true,
              rollNumber: true,
              branch:     true,
              cgpa:       true,
              phone:      true,
              user:       { select: { email: true } },
            },
          },
        },
      }),
    ]);

    const items: ApplicationItem[] = rows.map((r) => ({
      ...r,
      student: { ...r.student, cgpa: toNumber(r.student.cgpa) },
    }));

    return { items, total };
  },

  async getEligibleStudents(driveId: string, q?: string): Promise<EligibleStudent[]> {
    const drive = await prisma.drive.findUnique({
      where:  { id: driveId },
      select: { eligibleBranches: true, minCgpa: true },
    });
    if (!drive) throw new NotFoundError("Drive not found");

    const enrolledIds = await prisma.driveApplication.findMany({
      where:  { driveId },
      select: { studentId: true },
    });
    const excludeIds = enrolledIds.map((e) => e.studentId);

    const where: Prisma.StudentWhereInput = {
      branch: { in: drive.eligibleBranches, mode: "insensitive" },
      cgpa:   { gte: drive.minCgpa },
      id:     excludeIds.length > 0 ? { notIn: excludeIds } : undefined,
    };

    if (q?.trim()) {
      where.OR = [
        { name:       { contains: q, mode: "insensitive" } },
        { rollNumber: { contains: q, mode: "insensitive" } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      take:    50,
      orderBy: { name: "asc" },
      select: {
        id:         true,
        name:       true,
        rollNumber: true,
        branch:     true,
        cgpa:       true,
        user:       { select: { email: true } },
      },
    });

    return students.map((s) => ({ ...s, cgpa: toNumber(s.cgpa) }));
  },

  async create(data: CreateDriveInput, actorId: string): Promise<DriveDetail> {
    const adminId = await getAdminId(actorId);

    const company = await prisma.company.findUnique({
      where:  { id: data.companyId, deletedAt: null },
      select: { id: true },
    });
    if (!company) throw new NotFoundError("Company not found");

    const drive = await prisma.$transaction(async (tx) => {
      const created = await tx.drive.create({
        data: {
          companyId:           data.companyId,
          adminId,
          jobRole:             data.jobRole,
          ctc:                 data.ctc,
          jobLocation:         data.jobLocation,
          eligibleBranches:    data.eligibleBranches,
          minCgpa:             data.minCgpa,
          driveDate:           new Date(data.driveDate),
          applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : null,
          status:              data.status,
          academicYear:        data.academicYear,
          description:         data.description ?? null,
        },
        select: { id: true },
      });

      await tx.activityLog.create({
        data: {
          userId:     actorId,
          action:     "CREATE_DRIVE",
          resource:   "Drive",
          resourceId: created.id,
          metadata:   { jobRole: data.jobRole, companyId: data.companyId },
        },
      });

      return created;
    });

    return this.getById(drive.id);
  },

  async update(id: string, data: UpdateDriveInput, actorId: string): Promise<DriveDetail> {
    const existing = await prisma.drive.findUnique({
      where:  { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundError("Drive not found");

    if (data.companyId) {
      const company = await prisma.company.findUnique({
        where:  { id: data.companyId, deletedAt: null },
        select: { id: true },
      });
      if (!company) throw new NotFoundError("Company not found");
    }

    await prisma.$transaction(async (tx) => {
      await tx.drive.update({
        where: { id },
        data:  {
          ...(data.companyId           !== undefined && { companyId:           data.companyId }),
          ...(data.jobRole             !== undefined && { jobRole:             data.jobRole }),
          ...(data.ctc                 !== undefined && { ctc:                 data.ctc }),
          ...(data.jobLocation         !== undefined && { jobLocation:         data.jobLocation }),
          ...(data.eligibleBranches    !== undefined && { eligibleBranches:    data.eligibleBranches }),
          ...(data.minCgpa             !== undefined && { minCgpa:             data.minCgpa }),
          ...(data.driveDate           !== undefined && { driveDate:           new Date(data.driveDate) }),
          ...(data.applicationDeadline !== undefined && {
            applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : null,
          }),
          ...(data.status              !== undefined && { status:              data.status }),
          ...(data.academicYear        !== undefined && { academicYear:        data.academicYear }),
          ...(data.description         !== undefined && { description:         data.description ?? null }),
        },
      });

      await tx.activityLog.create({
        data: {
          userId:     actorId,
          action:     "UPDATE_DRIVE",
          resource:   "Drive",
          resourceId: id,
          metadata:   { updatedFields: Object.keys(data) },
        },
      });
    });

    return this.getById(id);
  },

  async delete(id: string, actorId: string): Promise<void> {
    const existing = await prisma.drive.findUnique({
      where:  { id },
      select: { id: true, jobRole: true, _count: { select: { applications: true } } },
    });
    if (!existing) throw new NotFoundError("Drive not found");

    if (existing._count.applications > 0) {
      throw new ConflictError(
        `Cannot delete a drive with ${existing._count.applications} enrolled student(s). Remove enrollments first.`
      );
    }

    await prisma.$transaction([
      prisma.drive.delete({ where: { id } }),
      prisma.activityLog.create({
        data: {
          userId:     actorId,
          action:     "DELETE_DRIVE",
          resource:   "Drive",
          resourceId: id,
          metadata:   { jobRole: existing.jobRole },
        },
      }),
    ]);
  },

  async enrollStudent(
    driveId:  string,
    data:     EnrollStudentInput,
    actorId:  string
  ): Promise<ApplicationItem> {
    const drive = await prisma.drive.findUnique({
      where:  { id: driveId },
      select: { id: true, eligibleBranches: true, minCgpa: true, status: true },
    });
    if (!drive) throw new NotFoundError("Drive not found");

    if (drive.status === "CANCELLED" || drive.status === "COMPLETED") {
      throw new ConflictError(`Cannot enroll students in a ${drive.status.toLowerCase()} drive`);
    }

    const student = await prisma.student.findUnique({
      where:  { id: data.studentId },
      select: { id: true, name: true, branch: true, cgpa: true },
    });
    if (!student) throw new NotFoundError("Student not found");

    const branchMatch = drive.eligibleBranches.some(
      (b) => b.toLowerCase() === student.branch.toLowerCase()
    );
    if (!branchMatch) {
      throw new ConflictError(`Student's branch (${student.branch}) is not eligible for this drive`);
    }

    if (toNumber(student.cgpa) < toNumber(drive.minCgpa)) {
      throw new ConflictError(
        `Student's CGPA (${toNumber(student.cgpa)}) is below the minimum required (${toNumber(drive.minCgpa)})`
      );
    }

    const existing = await prisma.driveApplication.findUnique({
      where: { driveId_studentId: { driveId, studentId: data.studentId } },
      select: { id: true },
    });
    if (existing) throw new ConflictError("Student is already enrolled in this drive");

    const app = await prisma.$transaction(async (tx) => {
      const created = await tx.driveApplication.create({
        data: {
          driveId,
          studentId: data.studentId,
          stage:     "REGISTERED",
          notes:     data.notes ?? null,
        },
        select: { id: true },
      });

      await tx.activityLog.create({
        data: {
          userId:     actorId,
          action:     "ENROLL_STUDENT",
          resource:   "DriveApplication",
          resourceId: created.id,
          metadata:   { driveId, studentId: data.studentId },
        },
      });

      return created;
    });

    const result = await prisma.driveApplication.findUnique({
      where: { id: app.id },
      select: {
        id: true, stage: true, appliedAt: true, updatedAt: true,
        notes: true, offerLetterUrl: true, offerLetterName: true, joiningDate: true,
        student: {
          select: {
            id: true, name: true, rollNumber: true, branch: true, cgpa: true, phone: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    return {
      ...result!,
      student: { ...result!.student, cgpa: toNumber(result!.student.cgpa) },
    };
  },

  async bulkEnroll(
    driveId: string,
    buffer:  Buffer,
    actorId: string
  ): Promise<BulkEnrollResult> {
    const drive = await prisma.drive.findUnique({
      where:  { id: driveId },
      select: { id: true, eligibleBranches: true, minCgpa: true, status: true },
    });
    if (!drive) throw new NotFoundError("Drive not found");

    if (drive.status === "CANCELLED" || drive.status === "COMPLETED") {
      throw new ConflictError(`Cannot enroll students in a ${drive.status.toLowerCase()} drive`);
    }

    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);

    const sheet = workbook.worksheets[0];
    if (!sheet) throw new ValidationError("Excel file has no worksheets");

    // Find the roll number column (first row is header)
    const headerRow = sheet.getRow(1);
    let rollCol = -1;
    headerRow.eachCell((cell, colNum) => {
      const val = String(cell.value ?? "").trim().toLowerCase();
      if (val === "roll number" || val === "rollnumber" || val === "roll_number" || val === "roll no") {
        rollCol = colNum;
      }
    });

    if (rollCol === -1) {
      throw new ValidationError(
        'No "Roll Number" column found. The first row must have a header named "Roll Number".'
      );
    }

    const rollNumbers: string[] = [];
    sheet.eachRow((row, rowNum) => {
      if (rowNum === 1) return; // skip header
      const cell = row.getCell(rollCol);
      const val  = String(cell.value ?? "").trim();
      if (val) rollNumbers.push(val);
    });

    if (rollNumbers.length === 0) {
      throw new ValidationError("No roll numbers found in the uploaded file");
    }

    if (rollNumbers.length > 500) {
      throw new ValidationError("Cannot enroll more than 500 students at once");
    }

    // Get already enrolled students
    const alreadyEnrolled = await prisma.driveApplication.findMany({
      where:  { driveId },
      select: { student: { select: { rollNumber: true } } },
    });
    const enrolledRolls = new Set(alreadyEnrolled.map((e) => e.student.rollNumber));

    // Look up all students by roll numbers
    const students = await prisma.student.findMany({
      where:  { rollNumber: { in: rollNumbers } },
      select: { id: true, name: true, rollNumber: true, branch: true, cgpa: true },
    });

    const studentMap = new Map(students.map((s) => [s.rollNumber, s]));
    const minCgpa    = toNumber(drive.minCgpa);
    const eligibleBranches = drive.eligibleBranches.map((b) => b.toLowerCase());

    const errors:    { rollNumber: string; reason: string }[] = [];
    const toEnroll:  typeof students = [];
    let   skipped = 0;

    for (const roll of rollNumbers) {
      const student = studentMap.get(roll);

      if (!student) {
        errors.push({ rollNumber: roll, reason: "Student not found" });
        continue;
      }

      if (enrolledRolls.has(roll)) {
        skipped++;
        continue;
      }

      const branchMatch = eligibleBranches.includes(student.branch.toLowerCase());
      if (!branchMatch) {
        errors.push({ rollNumber: roll, reason: `Branch ${student.branch} not eligible` });
        continue;
      }

      if (toNumber(student.cgpa) < minCgpa) {
        errors.push({
          rollNumber: roll,
          reason: `CGPA ${toNumber(student.cgpa)} is below minimum ${minCgpa}`,
        });
        continue;
      }

      toEnroll.push(student);
    }

    if (toEnroll.length > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.driveApplication.createMany({
          data: toEnroll.map((s) => ({
            driveId,
            studentId: s.id,
            stage:     "REGISTERED" as const,
          })),
          skipDuplicates: true,
        });

        await tx.activityLog.create({
          data: {
            userId:     actorId,
            action:     "BULK_ENROLL",
            resource:   "DriveApplication",
            resourceId: driveId,
            metadata:   { enrolled: toEnroll.length, driveId },
          },
        });
      });
    }

    return { enrolled: toEnroll.length, skipped, errors };
  },

  async getDriveSummary(driveId: string): Promise<DriveSummary> {
    const drive = await prisma.drive.findUnique({
      where:  { id: driveId },
      select: {
        id:           true,
        jobRole:      true,
        ctc:          true,
        driveDate:    true,
        status:       true,
        academicYear: true,
        company:      { select: { id: true, name: true, category: true } },
        applications: {
          select: {
            stage:       true,
            joiningDate: true,
            student:     { select: { branch: true } },
            placement:   { select: { ctc: true } },
          },
        },
      },
    });

    if (!drive) throw new NotFoundError("Drive not found");

    const stageCounts: StageCounts = {
      REGISTERED:   0,
      SHORTLISTED:  0,
      INTERVIEWED:  0,
      OFFERED:      0,
      NOT_SELECTED: 0,
    };

    const branchMap = new Map<string, { registered: number; offered: number }>();
    let ctcSum = 0;
    let offeredCount = 0;

    for (const app of drive.applications) {
      stageCounts[app.stage]++;

      const branch = app.student.branch;
      const prev = branchMap.get(branch) ?? { registered: 0, offered: 0 };
      branchMap.set(branch, {
        registered: prev.registered + 1,
        offered:    prev.offered + (app.stage === "OFFERED" ? 1 : 0),
      });

      if (app.stage === "OFFERED" && app.placement?.ctc) {
        ctcSum += Number(app.placement.ctc);
        offeredCount++;
      }
    }

    const branchBreakdown = [...branchMap.entries()]
      .map(([branch, counts]) => ({ branch, ...counts }))
      .sort((a, b) => b.registered - a.registered);

    return {
      driveId:       drive.id,
      jobRole:       drive.jobRole,
      ctc:           toNumber(drive.ctc),
      driveDate:     drive.driveDate,
      status:        drive.status,
      academicYear:  drive.academicYear,
      company:       drive.company,
      stageCounts,
      branchBreakdown,
      avgCtcOffered: offeredCount > 0 ? ctcSum / offeredCount : null,
    };
  },

  async getParticipants(
    driveId: string,
    params:  DriveParticipantQuery
  ): Promise<{ items: DriveParticipant[]; total: number }> {
    const drive = await prisma.drive.findUnique({
      where:  { id: driveId },
      select: { id: true, jobRole: true, ctc: true },
    });
    if (!drive) throw new NotFoundError("Drive not found");

    const where: Prisma.DriveApplicationWhereInput = { driveId };

    if (params.stage)  where.stage = params.stage as FunnelStage;
    if (params.branch) where.student = { branch: { equals: params.branch, mode: "insensitive" } };

    if (params.q?.trim()) {
      where.student = {
        OR: [
          { name:       { contains: params.q, mode: "insensitive" } },
          { rollNumber: { contains: params.q, mode: "insensitive" } },
        ],
      };
    }

    if (params.jobRole?.trim()) {
      where.drive = { jobRole: { contains: params.jobRole, mode: "insensitive" } };
    }

    if (params.minCtc !== undefined || params.maxCtc !== undefined) {
      where.placement = {
        ctc: {
          ...(params.minCtc !== undefined && { gte: params.minCtc }),
          ...(params.maxCtc !== undefined && { lte: params.maxCtc }),
        },
      };
    }

    const ALLOWED_SORT: Record<string, Prisma.DriveApplicationOrderByWithRelationInput> = {
      name:      { student: { name: "asc" } },
      cgpa:      { student: { cgpa: "desc" } },
      branch:    { student: { branch: "asc" } },
      appliedAt: { appliedAt: "desc" },
      stage:     { stage: "asc" },
    };

    const orderBy = ALLOWED_SORT[params.sort ?? "appliedAt"] ?? { appliedAt: "desc" };

    const skip = (params.page - 1) * params.limit;

    const [total, rows] = await prisma.$transaction([
      prisma.driveApplication.count({ where }),
      prisma.driveApplication.findMany({
        where,
        skip,
        take:    params.limit,
        orderBy,
        select: {
          id:          true,
          stage:       true,
          appliedAt:   true,
          joiningDate: true,
          drive:       { select: { jobRole: true, ctc: true } },
          placement:   { select: { ctc: true } },
          student: {
            select: {
              id:         true,
              name:       true,
              rollNumber: true,
              branch:     true,
              cgpa:       true,
              user:       { select: { email: true } },
            },
          },
        },
      }),
    ]);

    const items: DriveParticipant[] = rows.map((r) => ({
      applicationId: r.id,
      stage:         r.stage,
      appliedAt:     r.appliedAt,
      joiningDate:   r.joiningDate,
      ctcOffered:    r.placement ? Number(r.placement.ctc) : null,
      student:       { ...r.student, cgpa: toNumber(r.student.cgpa) },
      drive:         { jobRole: r.drive.jobRole, ctc: toNumber(r.drive.ctc) },
    }));

    return { items, total };
  },

  async updateFunnelStage(
    driveId: string,
    appId:   string,
    data:    UpdateFunnelStageInput,
    actorId: string
  ): Promise<ApplicationItem> {
    const app = await prisma.driveApplication.findUnique({
      where:  { id: appId },
      select: { id: true, driveId: true, stage: true },
    });

    if (!app)              throw new NotFoundError("Application not found");
    if (app.driveId !== driveId) throw new NotFoundError("Application does not belong to this drive");

    // Forward-only validation
    if (TERMINAL_STAGES.has(app.stage)) {
      throw new ConflictError(`Application is already in a terminal stage (${app.stage})`);
    }

    const currentOrder = FUNNEL_ORDER[app.stage];
    const newOrder     = FUNNEL_ORDER[data.stage];

    if (newOrder < currentOrder) {
      throw new ConflictError("Cannot move application backwards in the funnel");
    }

    if (newOrder === currentOrder && data.stage !== app.stage) {
      throw new ConflictError("Cannot move between OFFERED and NOT_SELECTED");
    }

    await prisma.$transaction(async (tx) => {
      await tx.driveApplication.update({
        where: { id: appId },
        data:  {
          stage:       data.stage as FunnelStage,
          notes:       data.notes       ?? undefined,
          joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
          offerLetterUrl:  data.offerLetterUrl  ?? undefined,
          offerLetterName: data.offerLetterName ?? undefined,
        },
      });

      // Auto-create Placement when stage moves to OFFERED
      if (data.stage === "OFFERED") {
        const drive = await tx.drive.findUnique({
          where:  { id: driveId },
          select: { companyId: true, company: { select: { name: true } }, jobRole: true, ctc: true, academicYear: true },
        });

        if (drive) {
          const existingPlacement = await tx.placement.findUnique({
            where:  { applicationId: appId },
            select: { id: true },
          });

          if (!existingPlacement) {
            const driveApp = await tx.driveApplication.findUnique({
              where:  { id: appId },
              select: { studentId: true },
            });

            if (driveApp) {
              await tx.placement.create({
                data: {
                  studentId:    driveApp.studentId,
                  type:         "CAMPUS",
                  applicationId: appId,
                  company:      drive.company.name,
                  jobRole:      drive.jobRole,
                  ctc:          drive.ctc,
                  joiningDate:  data.joiningDate ? new Date(data.joiningDate) : null,
                  academicYear: drive.academicYear,
                },
              });
            }
          }
        }
      }

      await tx.activityLog.create({
        data: {
          userId:     actorId,
          action:     "UPDATE_FUNNEL_STAGE",
          resource:   "DriveApplication",
          resourceId: appId,
          metadata:   { previousStage: app.stage, newStage: data.stage },
        },
      });
    });

    const updated = await prisma.driveApplication.findUnique({
      where: { id: appId },
      select: {
        id: true, stage: true, appliedAt: true, updatedAt: true,
        notes: true, offerLetterUrl: true, offerLetterName: true, joiningDate: true,
        student: {
          select: {
            id: true, name: true, rollNumber: true, branch: true, cgpa: true, phone: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    return {
      ...updated!,
      student: { ...updated!.student, cgpa: toNumber(updated!.student.cgpa) },
    };
  },
};
