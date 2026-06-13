import type { CompanyCategory, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { logActivity } from "@/lib/middleware/audit.middleware";
import { ConflictError, NotFoundError } from "@/lib/utils/errors";
import type { CreateCompanyInput, UpdateCompanyInput, CompanyListQuery } from "@/lib/validations/company.schema";

// ── Return types ──────────────────────────────────────────────────────────────

export type CompanyListItem = {
  id:       string;
  name:     string;
  industry: string;
  hrName:   string;
  hrEmail:  string;
  hrPhone:  string | null;
  category: CompanyCategory;
  website:  string | null;
  createdAt: Date;
  _count:   { drives: number };
};

export type CompanyDetail = {
  id:          string;
  name:        string;
  industry:    string;
  hrName:      string;
  hrEmail:     string;
  hrPhone:     string | null;
  website:     string | null;
  category:    CompanyCategory;
  description: string | null;
  createdAt:   Date;
  updatedAt:   Date;
  drives: Array<{
    id:          string;
    jobRole:     string;
    status:      string;
    driveDate:   Date;
    academicYear: string;
    _count:      { applications: number };
  }>;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildWhere(params: CompanyListQuery): Prisma.CompanyWhereInput {
  const where: Prisma.CompanyWhereInput = { deletedAt: null };

  if (params.q?.trim()) {
    where.OR = [
      { name:     { contains: params.q, mode: "insensitive" } },
      { industry: { contains: params.q, mode: "insensitive" } },
      { hrName:   { contains: params.q, mode: "insensitive" } },
    ];
  }

  if (params.category) {
    where.category = params.category as CompanyCategory;
  }

  return where;
}

const ALLOWED_SORT: Record<string, keyof Prisma.CompanyOrderByWithRelationInput> = {
  name:      "name",
  category:  "category",
  createdAt: "createdAt",
};

function buildOrderBy(sort = "createdAt", dir: "asc" | "desc" = "desc"): Prisma.CompanyOrderByWithRelationInput {
  const field = ALLOWED_SORT[sort] ?? "createdAt";
  return { [field]: dir };
}

// ── Service ───────────────────────────────────────────────────────────────────

export const CompanyService = {

  async list(params: CompanyListQuery): Promise<{ items: CompanyListItem[]; total: number }> {
    const where   = buildWhere(params);
    const orderBy = buildOrderBy(params.sort, params.dir);
    const skip    = (params.page - 1) * params.limit;

    const [total, items] = await prisma.$transaction([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        skip,
        take:    params.limit,
        orderBy,
        select: {
          id:        true,
          name:      true,
          industry:  true,
          hrName:    true,
          hrEmail:   true,
          hrPhone:   true,
          category:  true,
          website:   true,
          createdAt: true,
          _count:    { select: { drives: true } },
        },
      }),
    ]);

    return { items, total };
  },

  async getById(id: string): Promise<CompanyDetail> {
    const company = await prisma.company.findUnique({
      where:  { id, deletedAt: null },
      select: {
        id:          true,
        name:        true,
        industry:    true,
        hrName:      true,
        hrEmail:     true,
        hrPhone:     true,
        website:     true,
        category:    true,
        description: true,
        createdAt:   true,
        updatedAt:   true,
        drives: {
          where:   { },
          orderBy: { driveDate: "desc" },
          select: {
            id:           true,
            jobRole:      true,
            status:       true,
            driveDate:    true,
            academicYear: true,
            _count:       { select: { applications: true } },
          },
        },
      },
    });

    if (!company) throw new NotFoundError("Company not found");
    return company;
  },

  async create(data: CreateCompanyInput, actorId: string): Promise<CompanyDetail> {
    const existing = await prisma.company.findFirst({
      where: { hrEmail: data.hrEmail, deletedAt: null },
      select: { id: true },
    });
    if (existing) throw new ConflictError("A company with this HR email already exists");

    const company = await prisma.$transaction(async (tx) => {
      const created = await tx.company.create({
        data: {
          name:        data.name,
          industry:    data.industry,
          hrName:      data.hrName,
          hrEmail:     data.hrEmail,
          hrPhone:     data.hrPhone ?? null,
          website:     data.website || null,
          category:    data.category as CompanyCategory,
          description: data.description ?? null,
        },
        select: { id: true },
      });

      await tx.activityLog.create({
        data: {
          userId:     actorId,
          action:     "CREATE_COMPANY",
          resource:   "Company",
          resourceId: created.id,
          metadata:   { name: data.name, category: data.category },
        },
      });

      return created;
    });

    return this.getById(company.id);
  },

  async update(id: string, data: UpdateCompanyInput, actorId: string): Promise<CompanyDetail> {
    const existing = await prisma.company.findUnique({
      where:  { id, deletedAt: null },
      select: { id: true, hrEmail: true },
    });
    if (!existing) throw new NotFoundError("Company not found");

    // Check hrEmail uniqueness only if it's changing
    if (data.hrEmail && data.hrEmail !== existing.hrEmail) {
      const conflict = await prisma.company.findFirst({
        where: { hrEmail: data.hrEmail, deletedAt: null, id: { not: id } },
        select: { id: true },
      });
      if (conflict) throw new ConflictError("A company with this HR email already exists");
    }

    await prisma.$transaction(async (tx) => {
      await tx.company.update({
        where: { id },
        data:  {
          ...(data.name        !== undefined && { name:        data.name }),
          ...(data.industry    !== undefined && { industry:    data.industry }),
          ...(data.hrName      !== undefined && { hrName:      data.hrName }),
          ...(data.hrEmail     !== undefined && { hrEmail:     data.hrEmail }),
          ...(data.hrPhone     !== undefined && { hrPhone:     data.hrPhone ?? null }),
          ...(data.website     !== undefined && { website:     data.website || null }),
          ...(data.category    !== undefined && { category:    data.category as CompanyCategory }),
          ...(data.description !== undefined && { description: data.description ?? null }),
        },
      });

      await tx.activityLog.create({
        data: {
          userId:     actorId,
          action:     "UPDATE_COMPANY",
          resource:   "Company",
          resourceId: id,
          metadata:   { updatedFields: Object.keys(data) },
        },
      });
    });

    return this.getById(id);
  },

  async delete(id: string, actorId: string): Promise<void> {
    const existing = await prisma.company.findUnique({
      where:  { id, deletedAt: null },
      select: { id: true, name: true, _count: { select: { drives: true } } },
    });
    if (!existing) throw new NotFoundError("Company not found");

    if (existing._count.drives > 0) {
      throw new ConflictError(
        `Cannot delete a company with ${existing._count.drives} existing drive(s). Remove drives first.`
      );
    }

    await prisma.$transaction([
      prisma.company.update({
        where: { id },
        data:  { deletedAt: new Date() },
      }),
      prisma.activityLog.create({
        data: {
          userId:     actorId,
          action:     "DELETE_COMPANY",
          resource:   "Company",
          resourceId: id,
          metadata:   { name: existing.name },
        },
      }),
    ]);
  },
};
