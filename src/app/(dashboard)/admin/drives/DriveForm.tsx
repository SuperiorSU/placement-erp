"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = "create" | "edit";

interface CompanyOption {
  id:       string;
  name:     string;
  category: string;
}

interface DriveFormDefaults {
  companyId:           string;
  jobRole:             string;
  ctc:                 string;
  jobLocation:         string;
  eligibleBranches:    string[];
  minCgpa:             string;
  driveDate:           string;
  applicationDeadline: string;
  status:              string;
  academicYear:        string;
  description:         string;
}

interface DriveFormProps {
  mode:    Mode;
  driveId?: string;
  defaults?: Partial<DriveFormDefaults>;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const BRANCH_OPTIONS = [
  "CSE", "IT", "ECE", "EE", "ME", "CE", "CH", "BT", "MCA", "MBA",
];

const STATUS_OPTIONS = [
  { value: "UPCOMING",  label: "Upcoming"  },
  { value: "ACTIVE",    label: "Active"    },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

function getAcademicYears(): string[] {
  const now  = new Date();
  const year = now.getFullYear();
  return [
    `${year - 1}-${year}`,
    `${year}-${year + 1}`,
    `${year + 1}-${year + 2}`,
  ];
}

function toDateInput(d?: string | Date | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

// ── Field wrapper ──────────────────────────────────────────────────────────────

function Field({
  id, label, required, error, hint, children,
}: {
  id:        string;
  label:     string;
  required?: boolean;
  error?:    string;
  hint?:     string;
  children:  React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-muted block">
        {label}
        {required && <span className="text-below ml-1" aria-label="required">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-ink-subtle">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="text-xs text-below" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass = (hasError: boolean) =>
  `w-full h-9 px-3 rounded-md text-sm bg-surface border border-border text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-80 disabled:opacity-40 ${
    hasError ? "border-below ring-1 ring-below" : ""
  }`;

// ── Component ─────────────────────────────────────────────────────────────────

export function DriveForm({ mode, driveId, defaults = {} }: DriveFormProps) {
  const router = useRouter();
  const years  = getAcademicYears();

  const [form, setForm] = useState<DriveFormDefaults>({
    companyId:           defaults.companyId           ?? "",
    jobRole:             defaults.jobRole             ?? "",
    ctc:                 defaults.ctc                 ?? "",
    jobLocation:         defaults.jobLocation         ?? "",
    eligibleBranches:    defaults.eligibleBranches    ?? [],
    minCgpa:             defaults.minCgpa             ?? "0",
    driveDate:           defaults.driveDate           ?? "",
    applicationDeadline: defaults.applicationDeadline ?? "",
    status:              defaults.status              ?? "UPCOMING",
    academicYear:        defaults.academicYear        ?? years[1],
    description:         defaults.description         ?? "",
  });

  const [companies,  setCompanies]  = useState<CompanyOption[]>([]);
  const [loadingCo,  setLoadingCo]  = useState(true);
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [apiError,   setApiError]   = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    fetch("/api/v1/admin/companies?limit=100&sort=name&dir=asc")
      .then((r) => r.json())
      .then((j) => {
        setCompanies(j.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingCo(false));
  }, []);

  function set(key: keyof DriveFormDefaults) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    };
  }

  function toggleBranch(branch: string) {
    setForm((prev) => {
      const branches = prev.eligibleBranches.includes(branch)
        ? prev.eligibleBranches.filter((b) => b !== branch)
        : [...prev.eligibleBranches, branch];
      return { ...prev, eligibleBranches: branches };
    });
    setErrors((prev) => { const n = { ...prev }; delete n.eligibleBranches; return n; });
  }

  function selectAllBranches() {
    setForm((prev) => ({ ...prev, eligibleBranches: [...BRANCH_OPTIONS] }));
    setErrors((prev) => { const n = { ...prev }; delete n.eligibleBranches; return n; });
  }

  function clearBranches() {
    setForm((prev) => ({ ...prev, eligibleBranches: [] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    setLoading(true);

    const payload: Record<string, unknown> = {
      companyId:        form.companyId,
      jobRole:          form.jobRole,
      ctc:              parseFloat(form.ctc),
      jobLocation:      form.jobLocation,
      eligibleBranches: form.eligibleBranches,
      minCgpa:          parseFloat(form.minCgpa),
      driveDate:        form.driveDate,
      status:           form.status,
      academicYear:     form.academicYear,
    };

    if (form.applicationDeadline.trim()) payload.applicationDeadline = form.applicationDeadline;
    if (form.description.trim())         payload.description         = form.description.trim();

    const url    = mode === "create" ? "/api/v1/admin/drives" : `/api/v1/admin/drives/${driveId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        const fieldErrors = json.error?.details?.fieldErrors as Record<string, string[]> | undefined;
        if (fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [field, msgs] of Object.entries(fieldErrors)) {
            mapped[field] = msgs[0];
          }
          setErrors(mapped);
        } else {
          setApiError(json.error?.message ?? "Something went wrong");
        }
        return;
      }

      const id = json.data?.id ?? driveId;
      router.push(`/admin/drives/${id}`);
      router.refresh();
    } catch {
      setApiError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {apiError && (
        <div className="px-4 py-3 rounded-md bg-below-soft border border-below/20 text-sm text-below" role="alert">
          {apiError}
        </div>
      )}

      {/* Company */}
      <Field id="companyId" label="Company" required error={errors.companyId}>
        <select
          id="companyId"
          value={form.companyId}
          onChange={set("companyId")}
          disabled={loading || loadingCo}
          className={`w-full h-9 px-3 rounded-md text-sm bg-surface border border-border text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-80 disabled:opacity-40 ${errors.companyId ? "border-below ring-1 ring-below" : ""}`}
          aria-invalid={!!errors.companyId}
          aria-describedby={errors.companyId ? "companyId-error" : undefined}
        >
          <option value="">
            {loadingCo ? "Loading companies…" : "Select a company"}
          </option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>

      {/* Job role */}
      <Field id="jobRole" label="Job role" required error={errors.jobRole}>
        <input
          id="jobRole" type="text"
          value={form.jobRole} onChange={set("jobRole")} required
          placeholder="Software Engineer" maxLength={200}
          className={inputClass(!!errors.jobRole)}
          aria-invalid={!!errors.jobRole}
          aria-describedby={errors.jobRole ? "jobRole-error" : undefined}
          disabled={loading}
        />
      </Field>

      {/* CTC + Location row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="ctc" label="CTC (₹ per annum)" required error={errors.ctc}
          hint="Enter the annual package in rupees">
          <input
            id="ctc" type="number" min="0" step="1000"
            value={form.ctc} onChange={set("ctc")} required
            placeholder="1200000"
            className={inputClass(!!errors.ctc)}
            aria-invalid={!!errors.ctc}
            disabled={loading}
          />
        </Field>

        <Field id="jobLocation" label="Job location" required error={errors.jobLocation}>
          <input
            id="jobLocation" type="text"
            value={form.jobLocation} onChange={set("jobLocation")} required
            placeholder="Bangalore, Karnataka" maxLength={200}
            className={inputClass(!!errors.jobLocation)}
            aria-invalid={!!errors.jobLocation}
            disabled={loading}
          />
        </Field>
      </div>

      {/* Min CGPA + Academic Year row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="minCgpa" label="Minimum CGPA" required error={errors.minCgpa}>
          <input
            id="minCgpa" type="number" min="0" max="10" step="0.1"
            value={form.minCgpa} onChange={set("minCgpa")} required
            placeholder="7.0"
            className={inputClass(!!errors.minCgpa)}
            aria-invalid={!!errors.minCgpa}
            disabled={loading}
          />
        </Field>

        <Field id="academicYear" label="Academic year" required error={errors.academicYear}>
          <select
            id="academicYear"
            value={form.academicYear}
            onChange={set("academicYear")}
            disabled={loading}
            className={`w-full h-9 px-3 rounded-md text-sm bg-surface border border-border text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-80 disabled:opacity-40 ${errors.academicYear ? "border-below ring-1 ring-below" : ""}`}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Drive date + Deadline row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="driveDate" label="Drive date" required error={errors.driveDate}>
          <input
            id="driveDate" type="date"
            value={form.driveDate} onChange={set("driveDate")} required
            className={inputClass(!!errors.driveDate)}
            aria-invalid={!!errors.driveDate}
            disabled={loading}
          />
        </Field>

        <Field id="applicationDeadline" label="Application deadline" error={errors.applicationDeadline}
          hint="Optional — leave blank if no deadline">
          <input
            id="applicationDeadline" type="date"
            value={form.applicationDeadline} onChange={set("applicationDeadline")}
            className={inputClass(!!errors.applicationDeadline)}
            disabled={loading}
          />
        </Field>
      </div>

      {/* Status */}
      <Field id="status" label="Status" required error={errors.status}>
        <select
          id="status" value={form.status} onChange={set("status")}
          disabled={loading}
          className={`w-full h-9 px-3 rounded-md text-sm bg-surface border border-border text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-80 disabled:opacity-40 ${errors.status ? "border-below ring-1 ring-below" : ""}`}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>

      {/* Eligible branches */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink-muted">
            Eligible branches
            <span className="text-below ml-1" aria-label="required">*</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button" onClick={selectAllBranches} disabled={loading}
              className="text-xs text-accent hover:text-accent-hover transition-colors duration-80 disabled:opacity-40"
            >
              Select all
            </button>
            <span className="text-ink-subtle text-xs">·</span>
            <button
              type="button" onClick={clearBranches} disabled={loading}
              className="text-xs text-ink-muted hover:text-ink transition-colors duration-80 disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {BRANCH_OPTIONS.map((branch) => {
            const checked = form.eligibleBranches.includes(branch);
            return (
              <label key={branch} className="cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleBranch(branch)}
                  disabled={loading}
                  className="sr-only"
                  aria-checked={checked}
                />
                <span
                  className={`inline-flex items-center px-3 h-7 rounded-md text-xs font-medium transition-colors duration-80 select-none ${
                    checked
                      ? "bg-accent text-white"
                      : "bg-surface-100 text-ink-muted border border-border hover:border-accent hover:text-ink"
                  } ${loading ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {branch}
                </span>
              </label>
            );
          })}
        </div>

        {errors.eligibleBranches && (
          <p className="text-xs text-below" role="alert">{errors.eligibleBranches}</p>
        )}
        {form.eligibleBranches.length > 0 && (
          <p className="text-xs text-ink-subtle">
            {form.eligibleBranches.length} branch{form.eligibleBranches.length !== 1 ? "es" : ""} selected
          </p>
        )}
      </div>

      {/* Description */}
      <Field id="description" label="Description" error={errors.description}>
        <textarea
          id="description" rows={3}
          value={form.description} onChange={set("description")}
          placeholder="Brief description of the role and requirements…" maxLength={2000}
          className={`w-full px-3 py-2 rounded-md text-sm bg-surface border border-border text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-80 resize-y disabled:opacity-40 ${errors.description ? "border-below ring-1 ring-below" : ""}`}
          disabled={loading}
        />
      </Field>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit" disabled={loading}
          className="inline-flex items-center gap-2 px-5 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover active:bg-[#3D68E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-80 min-w-[130px] justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : mode === "create" ? "Create drive" : "Save changes"}
        </button>
        <button
          type="button" disabled={loading}
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-5 h-9 rounded-md bg-surface-100 text-ink text-sm font-medium border border-border-strong hover:bg-surface-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-40 transition-colors duration-80"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export { toDateInput };
