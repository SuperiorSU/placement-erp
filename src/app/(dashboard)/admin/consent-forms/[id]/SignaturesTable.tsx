import type { SignatureItem } from "@/lib/services/consent.service";

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:  "bg-average-soft text-average",
  SIGNED:   "bg-prime-soft text-prime",
  DECLINED: "bg-below-soft text-below",
};

export function SignaturesTable({ signatures }: { signatures: SignatureItem[] }) {
  if (signatures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <p className="text-sm text-ink-muted">No signatures yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-surface-50/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Student</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Roll No</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Branch</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-ink-muted">Status</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-ink-muted">Signed On</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {signatures.map((sig) => (
            <tr key={sig.id} className="hover:bg-surface-100/40 transition-colors duration-80">
              <td className="px-4 py-3">
                <p className="font-medium text-ink">{sig.student.name}</p>
                <p className="text-xs text-ink-muted">{sig.student.user.email}</p>
              </td>
              <td className="px-4 py-3 text-ink-muted">{sig.student.rollNumber}</td>
              <td className="px-4 py-3 text-ink-muted">{sig.student.branch}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-widest ${STATUS_STYLES[sig.status] ?? ""}`}>
                  {sig.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-ink-muted text-xs tabular-nums">
                {formatDate(sig.signedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
