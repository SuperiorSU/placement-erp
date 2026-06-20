import { Suspense } from "react";
import { GraduationCap } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { StudentSearch } from "./StudentSearch";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; branch?: string; page?: string }>;
}) {
  const { q, branch, page: pageParam } = await searchParams;
  const page  = Math.max(1, parseInt(pageParam ?? "1"));
  const limit = 20;

  const where: any = {};
  if (q) {
    where.OR = [
      { name:       { contains: q, mode: "insensitive" } },
      { rollNumber: { contains: q, mode: "insensitive" } },
      { user:       { email: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (branch) where.branch = branch;

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      select: {
        id: true, name: true, rollNumber: true, branch: true, cgpa: true, graduationYear: true,
        user: { select: { email: true, isActive: true, createdAt: true } },
        _count: { select: { applications: true, placements: true } },
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { name: "asc" },
    }),
    prisma.student.count({ where }),
  ]);

  const branches = await prisma.student.findMany({
    select: { branch: true },
    distinct: ["branch"],
    orderBy: { branch: "asc" },
  });

  const pages = Math.ceil(total / limit);

  return (
    <>
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-2xl font-bold text-ink">Students</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {total} student{total !== 1 ? "s" : ""} in the system
          </p>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <Suspense>
            <StudentSearch defaultQ={q} defaultBranch={branch} branches={branches.map((b) => b.branch)} />
          </Suspense>
        </div>

        <div className="bg-surface-50 border border-border rounded-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <GraduationCap className="w-8 h-8 text-ink-subtle mb-4" aria-hidden />
              <h3 className="font-display text-lg font-semibold text-ink mb-1">No students found</h3>
              <p className="text-sm text-ink-muted max-w-xs">
                {q || branch ? "Try adjusting your filters." : "No student records yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-surface-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Roll No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Branch</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">CGPA</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-ink-muted">Applications</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-ink-muted">Placements</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-100/40 transition-colors duration-80">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{s.name}</p>
                        <p className="text-xs text-ink-muted">{s.user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-muted tabular-nums">{s.rollNumber}</td>
                      <td className="px-4 py-3 text-ink-muted">{s.branch}</td>
                      <td className="px-4 py-3 tabular-nums">
                        <span className={Number(s.cgpa) >= 8 ? "text-prime font-semibold" : "text-ink"}>
                          {Number(s.cgpa).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink">{s._count.applications}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className={s._count.placements > 0 ? "text-prime font-semibold" : "text-ink-muted"}>
                          {s._count.placements}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-muted">{total} students</p>
            <div className="flex gap-2">
              {page > 1 && (
                <a
                  href={`?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}${branch ? `&branch=${encodeURIComponent(branch)}` : ""}`}
                  className="px-3 h-8 rounded-md border border-border text-sm text-ink-muted hover:text-ink transition-colors flex items-center"
                >
                  Previous
                </a>
              )}
              {page < pages && (
                <a
                  href={`?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}${branch ? `&branch=${encodeURIComponent(branch)}` : ""}`}
                  className="px-3 h-8 rounded-md border border-border text-sm text-ink-muted hover:text-ink transition-colors flex items-center"
                >
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
