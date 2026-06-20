import { prisma } from "@/lib/db/prisma";
import { ConflictError, NotFoundError } from "@/lib/utils/errors";
import { logActivity } from "@/lib/middleware/audit.middleware";
import type { ConsentStatus, DriveStatus, FunnelStage } from "@prisma/client";

export type StudentProfile = {
  id:             string;
  name:           string;
  rollNumber:     string;
  branch:         string;
  cgpa:           number;
  graduationYear: number;
  phone:          string | null;
  email:          string;
  role:           string;
  createdAt:      Date;
  _count: {
    applications: number;
    placements:   number;
  };
};

export type DriveListingItem = {
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
  applied:             boolean;
  company: {
    id:       string;
    name:     string;
    category: string;
    industry: string;
  };
  _count: { applications: number };
};

export type StudentApplicationItem = {
  id:              string;
  stage:           FunnelStage;
  appliedAt:       Date;
  updatedAt:       Date;
  notes:           string | null;
  offerLetterUrl:  string | null;
  offerLetterName: string | null;
  joiningDate:     Date | null;
  drive: {
    id:        string;
    jobRole:   string;
    ctc:       number;
    driveDate: Date;
    company:   { name: string; category: string };
  };
};

export type StudentConsentItem = {
  id:        string;
  title:     string;
  isGeneric: boolean;
  createdAt: Date;
  drive:     { id: string; jobRole: string; company: { name: string } } | null;
  signature: {
    status:   ConsentStatus;
    signedAt: Date | null;
  } | null;
};

export const StudentService = {
  async getProfile(userId: string): Promise<StudentProfile> {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: {
        id: true, name: true, rollNumber: true, branch: true, cgpa: true,
        graduationYear: true, phone: true,
        user: { select: { email: true, role: true, createdAt: true } },
        _count: { select: { applications: true, placements: true } },
      },
    });
    if (!student) throw new NotFoundError("Student profile not found");

    return {
      id:             student.id,
      name:           student.name,
      rollNumber:     student.rollNumber,
      branch:         student.branch,
      cgpa:           Number(student.cgpa),
      graduationYear: student.graduationYear,
      phone:          student.phone,
      email:          student.user.email,
      role:           student.user.role,
      createdAt:      student.user.createdAt,
      _count:         student._count,
    };
  },

  async updateProfile(
    userId: string,
    data: { name?: string; phone?: string | null }
  ): Promise<StudentProfile> {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundError("Student profile not found");

    await prisma.student.update({ where: { userId }, data });
    return this.getProfile(userId);
  },

  async browseDrives(
    query: { status?: string; q?: string; page: number; limit: number },
    userId: string
  ): Promise<{ items: DriveListingItem[]; total: number }> {
    const { page, limit, status, q } = query;

    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    const where: any = { company: { deletedAt: null } };
    if (status) {
      where.status = status;
    } else {
      where.status = { in: ["ACTIVE", "UPCOMING"] };
    }
    if (q) {
      where.OR = [
        { jobRole:  { contains: q, mode: "insensitive" } },
        { company:  { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const driveSelect = {
      id: true, jobRole: true, ctc: true, jobLocation: true,
      eligibleBranches: true, minCgpa: true, driveDate: true,
      applicationDeadline: true, status: true, academicYear: true,
      description: true,
      company: { select: { id: true, name: true, category: true, industry: true } },
      _count:   { select: { applications: true } },
    };

    const [drives, total] = await Promise.all([
      prisma.drive.findMany({
        where,
        select: driveSelect,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { driveDate: "asc" },
      }),
      prisma.drive.count({ where }),
    ]);

    let appliedSet = new Set<string>();
    if (student) {
      const apps = await prisma.driveApplication.findMany({
        where: { studentId: student.id, driveId: { in: drives.map((d) => d.id) } },
        select: { driveId: true },
      });
      appliedSet = new Set(apps.map((a) => a.driveId));
    }

    return {
      items: drives.map((d) => ({
        ...d,
        ctc:     Number(d.ctc),
        minCgpa: Number(d.minCgpa),
        applied: appliedSet.has(d.id),
      })),
      total,
    };
  },

  async getDriveById(driveId: string, userId: string): Promise<DriveListingItem & { myStage?: FunnelStage }> {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    const drive = await prisma.drive.findUnique({
      where: { id: driveId },
      select: {
        id: true, jobRole: true, ctc: true, jobLocation: true,
        eligibleBranches: true, minCgpa: true, driveDate: true,
        applicationDeadline: true, status: true, academicYear: true,
        description: true,
        company: { select: { id: true, name: true, category: true, industry: true } },
        _count:   { select: { applications: true } },
      },
    });
    if (!drive) throw new NotFoundError("Drive not found");

    let applied = false;
    let myStage: FunnelStage | undefined;
    if (student) {
      const myApp = await prisma.driveApplication.findUnique({
        where: { driveId_studentId: { driveId, studentId: student.id } },
        select: { stage: true },
      });
      applied  = !!myApp;
      myStage  = myApp?.stage;
    }

    return { ...drive, ctc: Number(drive.ctc), minCgpa: Number(drive.minCgpa), applied, myStage };
  },

  async getApplications(
    userId: string,
    query: { page: number; limit: number; stage?: FunnelStage }
  ): Promise<{ items: StudentApplicationItem[]; total: number }> {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!student) return { items: [], total: 0 };

    const { page, limit, stage } = query;
    const where: any = { studentId: student.id };
    if (stage) where.stage = stage;

    const [items, total] = await Promise.all([
      prisma.driveApplication.findMany({
        where,
        select: {
          id: true, stage: true, appliedAt: true, updatedAt: true,
          notes: true, offerLetterUrl: true, offerLetterName: true, joiningDate: true,
          drive: {
            select: {
              id: true, jobRole: true, ctc: true, driveDate: true,
              company: { select: { name: true, category: true } },
            },
          },
        },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { appliedAt: "desc" },
      }),
      prisma.driveApplication.count({ where }),
    ]);

    return {
      items: items.map((a) => ({ ...a, drive: { ...a.drive, ctc: Number(a.drive.ctc) } })),
      total,
    };
  },

  async getConsentForms(
    userId: string,
    query: { page: number; limit: number; status?: ConsentStatus }
  ): Promise<{ items: StudentConsentItem[]; total: number }> {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true, applications: { select: { driveId: true } } },
    });
    if (!student) return { items: [], total: 0 };

    const driveIds = student.applications.map((a) => a.driveId);
    const { page, limit, status } = query;

    const forms = await prisma.consentForm.findMany({
      where: {
        isActive: true,
        OR: [{ isGeneric: true }, { driveId: { in: driveIds } }],
      },
      select: {
        id: true, title: true, isGeneric: true, createdAt: true,
        drive: { select: { id: true, jobRole: true, company: { select: { name: true } } } },
        signatures: {
          where: { studentId: student.id },
          select: { status: true, signedAt: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped: StudentConsentItem[] = forms.map((f) => ({
      id:        f.id,
      title:     f.title,
      isGeneric: f.isGeneric,
      createdAt: f.createdAt,
      drive:     f.drive,
      signature: f.signatures[0] ?? null,
    }));

    const filtered = status
      ? mapped.filter((f) => (f.signature?.status ?? "PENDING") === status)
      : mapped;

    return {
      items: filtered.slice((page - 1) * limit, page * limit),
      total: filtered.length,
    };
  },

  async signConsentForm(
    formId: string,
    userId: string,
    data: { signatureData: string; signatureType: "draw" | "typed" },
    ip?: string
  ): Promise<void> {
    const student = await prisma.student.findUnique({ where: { userId }, select: { id: true } });
    if (!student) throw new NotFoundError("Student profile not found");

    const form = await prisma.consentForm.findUnique({ where: { id: formId } });
    if (!form || !form.isActive) throw new NotFoundError("Consent form not found or inactive");

    const existing = await prisma.consentSignature.findUnique({
      where: { consentFormId_studentId: { consentFormId: formId, studentId: student.id } },
    });
    if (existing?.status === "SIGNED") throw new ConflictError("You have already signed this form");

    await prisma.consentSignature.upsert({
      where: { consentFormId_studentId: { consentFormId: formId, studentId: student.id } },
      create: {
        consentFormId: formId,
        studentId:     student.id,
        status:        "SIGNED",
        signatureData: data.signatureData,
        signatureType: data.signatureType,
        signedAt:      new Date(),
      },
      update: {
        status:        "SIGNED",
        signatureData: data.signatureData,
        signatureType: data.signatureType,
        signedAt:      new Date(),
      },
    });

    logActivity(userId, "SIGN_CONSENT_FORM", "ConsentSignature", formId, { formId }, ip).catch(() => {});
  },
};
