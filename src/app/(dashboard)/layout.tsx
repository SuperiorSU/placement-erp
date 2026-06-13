import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar role={session.user.role} />
      <main className="flex-1 min-h-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
