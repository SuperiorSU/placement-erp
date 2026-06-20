import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { prisma } from "@/lib/db/prisma";
import { NotFoundError, ForbiddenError } from "@/lib/utils/errors";

export const GET = (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) =>
  createRoute(
    { roles: ["STUDENT"], rateLimit: "api" },
    async (_req, { session }) => {
      const { id } = await params;

      const student = await prisma.student.findUnique({
        where: { userId: session!.user.id },
        select: { id: true },
      });
      if (!student) throw new NotFoundError("Student profile not found");

      const sig = await prisma.consentSignature.findUnique({
        where: { consentFormId_studentId: { consentFormId: id, studentId: student.id } },
        select: { status: true, signatureData: true, signatureType: true },
      });
      if (!sig || sig.status !== "SIGNED") throw new NotFoundError("No signed signature found");

      return Response.json(ApiResponse.success({
        signatureType: sig.signatureType,
        signatureData: sig.signatureData,
      }));
    }
  )(req);
