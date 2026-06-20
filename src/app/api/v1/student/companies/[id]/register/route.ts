import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { prisma } from "@/lib/db/prisma";
import { ConflictError, NotFoundError, ForbiddenError } from "@/lib/utils/errors";
import { logActivity } from "@/lib/middleware/audit.middleware";

export const POST = (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) =>
  createRoute(
    { roles: ["STUDENT"], rateLimit: "api", action: "REGISTER_FOR_DRIVE" },
    async (req, { session }) => {
      const { id: driveId } = await params;

      const student = await prisma.student.findUnique({
        where: { userId: session!.user.id },
        select: { id: true, branch: true, cgpa: true },
      });
      if (!student) throw new NotFoundError("Student profile not found");

      const drive = await prisma.drive.findUnique({
        where: { id: driveId },
        select: { id: true, status: true, eligibleBranches: true, minCgpa: true, applicationDeadline: true },
      });
      if (!drive || drive.status !== "ACTIVE") throw new NotFoundError("Drive not found or not active");

      if (!drive.eligibleBranches.includes(student.branch)) {
        throw new ForbiddenError("Your branch is not eligible for this drive");
      }
      if (Number(student.cgpa) < Number(drive.minCgpa)) {
        throw new ForbiddenError(`Minimum CGPA requirement is ${drive.minCgpa}`);
      }
      if (drive.applicationDeadline && new Date(drive.applicationDeadline) < new Date()) {
        throw new ForbiddenError("Application deadline has passed");
      }

      const existing = await prisma.driveApplication.findUnique({
        where: { driveId_studentId: { driveId, studentId: student.id } },
      });
      if (existing) throw new ConflictError("You have already applied for this drive");

      const app = await prisma.driveApplication.create({
        data: { driveId, studentId: student.id, stage: "REGISTERED" },
        select: { id: true, stage: true, appliedAt: true },
      });

      logActivity(
        session!.user.id, "REGISTER_FOR_DRIVE", "DriveApplication", app.id,
        { driveId }, req.headers.get("x-forwarded-for") ?? undefined
      ).catch(() => {});

      return Response.json(ApiResponse.success(app), { status: 201 });
    }
  )(req);
