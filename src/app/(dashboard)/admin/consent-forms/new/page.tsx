import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ConsentFormEditor } from "./ConsentFormEditor";

export default function NewConsentFormPage() {
  return (
    <>
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <Link
            href="/admin/consent-forms"
            className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors duration-80"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden />
            Consent Forms
          </Link>
          <span className="text-ink-subtle">/</span>
          <h1 className="font-display text-lg font-semibold text-ink">New Form</h1>
        </div>
      </div>

      <div className="px-6 py-6 max-w-3xl mx-auto">
        <ConsentFormEditor />
      </div>
    </>
  );
}
