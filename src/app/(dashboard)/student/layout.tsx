import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") redirect("/login");
  return <>{children}</>;
}
