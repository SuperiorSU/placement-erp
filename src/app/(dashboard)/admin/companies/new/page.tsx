import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CompanyForm } from "../CompanyForm";

export default function NewCompanyPage() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {/* Page header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center gap-3 max-w-7xl mx-auto">
          <Link
            href="/admin/companies"
            className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors duration-80"
            aria-label="Back to companies"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden />
            Companies
          </Link>
          <span className="text-border">/</span>
          <h1 className="font-display text-2xl font-bold text-ink">Add company</h1>
        </div>
      </div>

      {/* Form */}
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <CompanyForm mode="create" />
        </div>
      </div>
    </div>
  );
}
