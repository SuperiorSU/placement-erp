import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { StudentService } from "@/lib/services/student.service";
import { SignConsentFormSchema, type SignConsentFormInput } from "@/lib/validations/consent.schema";

export const POST = (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) =>
  createRoute(
    {
      roles: ["STUDENT"],
      rateLimit: "api",
      bodySchema: SignConsentFormSchema,
      action: "SIGN_CONSENT_FORM",
    },
    async (req, { session, body }) => {
      const { id } = await params;
      await StudentService.signConsentForm(
        id,
        session!.user.id,
        body as SignConsentFormInput,
        req.headers.get("x-forwarded-for") ?? undefined
      );
      return Response.json(ApiResponse.success({ message: "Consent form signed successfully" }));
    }
  )(req);
