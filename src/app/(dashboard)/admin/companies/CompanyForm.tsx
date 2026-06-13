"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CreateCompanyInput } from "@/lib/validations/company.schema";

type Mode = "create" | "edit";

interface CompanyFormProps {
  mode:       Mode;
  companyId?: string;
  defaults?:  Partial<CreateCompanyInput>;
}

interface FieldError { message: string }

const CATEGORY_OPTIONS = [
  { value: "PRIME",         label: "Prime"        },
  { value: "AVERAGE",       label: "Average"      },
  { value: "BELOW_AVERAGE", label: "Below Average" },
];

function Field({
  id, label, required, error, children,
}: {
  id:       string;
  label:    string;
  required?: boolean;
  error?:   string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-muted block">
        {label}
        {required && <span className="text-below ml-1" aria-label="required">*</span>}
      </label>
      {children}
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

export function CompanyForm({ mode, companyId, defaults = {} }: CompanyFormProps) {
  const router = useRouter();

  const [form, setForm] = useState({
    name:        defaults.name        ?? "",
    industry:    defaults.industry    ?? "",
    hrName:      defaults.hrName      ?? "",
    hrEmail:     defaults.hrEmail     ?? "",
    hrPhone:     defaults.hrPhone     ?? "",
    website:     defaults.website     ?? "",
    category:    defaults.category    ?? "AVERAGE",
    description: defaults.description ?? "",
  });

  const [errors,   setErrors]  = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    setLoading(true);

    const payload: Record<string, unknown> = {
      name:     form.name,
      industry: form.industry,
      hrName:   form.hrName,
      hrEmail:  form.hrEmail,
      category: form.category,
    };
    if (form.hrPhone.trim())     payload.hrPhone     = form.hrPhone.trim();
    if (form.website.trim())     payload.website     = form.website.trim();
    if (form.description.trim()) payload.description = form.description.trim();

    const url    = mode === "create" ? "/api/v1/admin/companies" : `/api/v1/admin/companies/${companyId}`;
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

      const id = json.data?.id ?? companyId;
      router.push(`/admin/companies/${id}`);
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

      {/* Company name */}
      <Field id="name" label="Company name" required error={errors.name}>
        <input
          id="name" type="text" autoComplete="organization"
          value={form.name} onChange={set("name")} required
          placeholder="Acme Corp" maxLength={200}
          className={inputClass(!!errors.name)}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          disabled={loading}
        />
      </Field>

      {/* Industry */}
      <Field id="industry" label="Industry" required error={errors.industry}>
        <input
          id="industry" type="text"
          value={form.industry} onChange={set("industry")} required
          placeholder="Software / FMCG / Finance…" maxLength={100}
          className={inputClass(!!errors.industry)}
          aria-invalid={!!errors.industry}
          aria-describedby={errors.industry ? "industry-error" : undefined}
          disabled={loading}
        />
      </Field>

      {/* Category */}
      <Field id="category" label="Category" required error={errors.category}>
        <select
          id="category" value={form.category} onChange={set("category")}
          className={`w-full h-9 px-3 rounded-md text-sm bg-surface border border-border text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-80 disabled:opacity-40 ${errors.category ? "border-below ring-1 ring-below" : ""}`}
          disabled={loading}
        >
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>

      <hr className="border-border" />

      {/* HR Name */}
      <Field id="hrName" label="HR name" required error={errors.hrName}>
        <input
          id="hrName" type="text"
          value={form.hrName} onChange={set("hrName")} required
          placeholder="Jane Smith" maxLength={100}
          className={inputClass(!!errors.hrName)}
          aria-invalid={!!errors.hrName}
          aria-describedby={errors.hrName ? "hrName-error" : undefined}
          disabled={loading}
        />
      </Field>

      {/* HR Email */}
      <Field id="hrEmail" label="HR email" required error={errors.hrEmail}>
        <input
          id="hrEmail" type="email" autoComplete="email"
          value={form.hrEmail} onChange={set("hrEmail")} required
          placeholder="hr@company.com"
          className={inputClass(!!errors.hrEmail)}
          aria-invalid={!!errors.hrEmail}
          aria-describedby={errors.hrEmail ? "hrEmail-error" : undefined}
          disabled={loading}
        />
      </Field>

      {/* HR Phone */}
      <Field id="hrPhone" label="HR phone" error={errors.hrPhone}>
        <input
          id="hrPhone" type="tel" autoComplete="tel"
          value={form.hrPhone} onChange={set("hrPhone")}
          placeholder="+91 98765 43210"
          className={inputClass(!!errors.hrPhone)}
          aria-invalid={!!errors.hrPhone}
          aria-describedby={errors.hrPhone ? "hrPhone-error" : undefined}
          disabled={loading}
        />
      </Field>

      {/* Website */}
      <Field id="website" label="Website" error={errors.website}>
        <input
          id="website" type="url"
          value={form.website} onChange={set("website")}
          placeholder="https://company.com"
          className={inputClass(!!errors.website)}
          aria-invalid={!!errors.website}
          aria-describedby={errors.website ? "website-error" : undefined}
          disabled={loading}
        />
      </Field>

      {/* Description */}
      <Field id="description" label="Description" error={errors.description}>
        <textarea
          id="description" rows={4}
          value={form.description} onChange={set("description")}
          placeholder="Brief description of the company…" maxLength={2000}
          className={`w-full px-3 py-2 rounded-md text-sm bg-surface border border-border text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-80 resize-y disabled:opacity-40 ${errors.description ? "border-below ring-1 ring-below" : ""}`}
          disabled={loading}
        />
      </Field>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit" disabled={loading}
          className="inline-flex items-center gap-2 px-5 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover active:bg-[#3D68E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-80"
        >
          {loading ? "Saving…" : mode === "create" ? "Add company" : "Save changes"}
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
