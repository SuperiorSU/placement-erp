import DOMPurify from "isomorphic-dompurify";
import { prisma } from "@/lib/db/prisma";
import { ConflictError, NotFoundError } from "@/lib/utils/errors";
import { logActivity } from "@/lib/middleware/audit.middleware";
import type { ConsentStatus } from "@prisma/client";
import type {
  CreateConsentFormInput,
  UpdateConsentFormInput,
  ConsentFormListQuery,
  SignConsentFormInput,
  ConsentSignatureListQuery,
} from "@/lib/validations/consent.schema";

export type ConsentFormItem = {
  id:        string;
  title:     string;
  isGeneric: boolean;
  isActive:  boolean;
  createdAt: Date;
  updatedAt: Date;
  drive:     { id: string; jobRole: string; company: { name: string } } | null;
  _count:    { signatures: number };
};

export type ConsentFormDetail = ConsentFormItem & {
  content: string;
  admin:   { id: string; name: string };
};

export type SignatureItem = {
  id:            string;
  status:        ConsentStatus;
  signatureType: string | null;
  signedAt:      Date | null;
  student: {
    id:         string;
    name:       string;
    rollNumber: string;
    branch:     string;
    user:       { email: string };
  };
};

const FORM_SELECT = {
  id: true, title: true, isGeneric: true, isActive: true, createdAt: true, updatedAt: true,
  drive: { select: { id: true, jobRole: true, company: { select: { name: true } } } },
  _count: { select: { signatures: true } },
} as const;

const DETAIL_SELECT = {
  ...FORM_SELECT,
  content: true,
  admin: { select: { id: true, name: true } },
} as const;

export const ConsentService = {
  async list(query: ConsentFormListQuery): Promise<{ items: ConsentFormItem[]; total: number }> {
    const { page, limit, driveId, isGeneric, isActive, q } = query;

    const where: any = {};
    if (driveId) where.driveId = driveId;
    if (isGeneric !== undefined) where.isGeneric = isGeneric === "true";
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (q) where.title = { contains: q, mode: "insensitive" };

    const [items, total] = await Promise.all([
      prisma.consentForm.findMany({
        where,
        select: FORM_SELECT,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.consentForm.count({ where }),
    ]);

    return { items, total };
  },

  async getById(id: string): Promise<ConsentFormDetail> {
    const row = await prisma.consentForm.findUnique({ where: { id }, select: DETAIL_SELECT });
    if (!row) throw new NotFoundError("Consent form not found");
    return row;
  },

  async create(
    data: CreateConsentFormInput,
    adminId: string,
    ip?: string
  ): Promise<ConsentFormItem> {
    const { title, driveId, isGeneric, isActive } = data;
    const content = DOMPurify.sanitize(data.content);

    const row = await prisma.consentForm.create({
      data: { title, content, adminId, driveId: driveId ?? null, isGeneric, isActive },
      select: FORM_SELECT,
    });

    logActivity(adminId, "CREATE_CONSENT_FORM", "ConsentForm", row.id, undefined, ip).catch(() => {});
    return row;
  },

  async update(
    id: string,
    data: UpdateConsentFormInput,
    adminId: string,
    ip?: string
  ): Promise<ConsentFormDetail> {
    const existing = await prisma.consentForm.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Consent form not found");

    const updateData: any = { ...data };
    if (data.content) updateData.content = DOMPurify.sanitize(data.content);
    if (data.driveId !== undefined) updateData.driveId = data.driveId ?? null;

    const row = await prisma.consentForm.update({ where: { id }, data: updateData, select: DETAIL_SELECT });
    logActivity(adminId, "UPDATE_CONSENT_FORM", "ConsentForm", id, undefined, ip).catch(() => {});
    return row;
  },

  async delete(id: string, adminId: string, ip?: string): Promise<void> {
    const existing = await prisma.consentForm.findUnique({
      where: { id },
      select: { id: true, _count: { select: { signatures: { where: { status: "SIGNED" } } } } },
    });
    if (!existing) throw new NotFoundError("Consent form not found");
    if (existing._count.signatures > 0) {
      throw new ConflictError("Cannot delete a form that has been signed by students");
    }

    await prisma.consentForm.delete({ where: { id } });
    logActivity(adminId, "DELETE_CONSENT_FORM", "ConsentForm", id, undefined, ip).catch(() => {});
  },

  async getSignatures(
    formId: string,
    query: ConsentSignatureListQuery
  ): Promise<{ items: SignatureItem[]; total: number }> {
    const { page, limit, status } = query;

    const form = await prisma.consentForm.findUnique({ where: { id: formId } });
    if (!form) throw new NotFoundError("Consent form not found");

    const where: any = { consentFormId: formId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.consentSignature.findMany({
        where,
        select: {
          id: true, status: true, signatureType: true, signedAt: true,
          student: {
            select: {
              id: true, name: true, rollNumber: true, branch: true,
              user: { select: { email: true } },
            },
          },
        },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { signedAt: "desc" },
      }),
      prisma.consentSignature.count({ where }),
    ]);

    return { items, total };
  },

  async signForm(
    formId: string,
    studentId: string,
    data: SignConsentFormInput,
    ip?: string
  ): Promise<SignatureItem> {
    const form = await prisma.consentForm.findUnique({ where: { id: formId } });
    if (!form || !form.isActive) throw new NotFoundError("Consent form not found or inactive");

    const existing = await prisma.consentSignature.findUnique({
      where: { consentFormId_studentId: { consentFormId: formId, studentId } },
    });
    if (existing?.status === "SIGNED") throw new ConflictError("You have already signed this form");

    const row = await prisma.consentSignature.upsert({
      where: { consentFormId_studentId: { consentFormId: formId, studentId } },
      create: {
        consentFormId: formId,
        studentId,
        status: "SIGNED",
        signatureData: data.signatureData,
        signatureType: data.signatureType,
        signedAt: new Date(),
      },
      update: {
        status: "SIGNED",
        signatureData: data.signatureData,
        signatureType: data.signatureType,
        signedAt: new Date(),
      },
      select: {
        id: true, status: true, signatureType: true, signedAt: true,
        student: {
          select: {
            id: true, name: true, rollNumber: true, branch: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    logActivity(studentId, "SIGN_CONSENT_FORM", "ConsentSignature", row.id, { formId }, ip).catch(() => {});
    return row;
  },
};
