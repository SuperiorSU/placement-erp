"use client";

import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle } from "lucide-react";

interface BulkEnrollResult {
  enrolled: number;
  skipped:  number;
  errors:   { rollNumber: string; reason: string }[];
}

interface Props {
  driveId:    string;
  onEnrolled: () => void;
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function BulkEnrollUpload({ driveId, onEnrolled }: Props) {
  const [file,    setFile]    = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<BulkEnrollResult | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  function acceptFile(f: File) {
    const ext = f.name.split(".").pop()?.toLowerCase();

    if (ext !== "xlsx" && ext !== "xls") {
      setError("Only .xlsx or .xls files are supported.");
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setError("File size must be under 5 MB.");
      return;
    }

    setFile(f);
    setError(null);
    setResult(null);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
    // Reset so the same file can be re-selected
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  }

  async function handleUpload() {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res  = await fetch(`/api/v1/admin/drives/${driveId}/bulk-enroll`, {
        method: "POST",
        body:   formData,
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message ?? "Upload failed");
        return;
      }

      setResult(json.data);
      setFile(null);

      if (json.data?.enrolled > 0) {
        onEnrolled();
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setFile(null);
    setError(null);
    setResult(null);
  }

  return (
    <div className="border-t border-border pt-5">
      <div className="flex items-center gap-2 mb-4">
        <FileSpreadsheet className="w-5 h-5 text-ink-muted" aria-hidden />
        <h3 className="font-display text-base font-semibold text-ink">Bulk enroll via Excel</h3>
      </div>

      <p className="text-sm text-ink-muted mb-4">
        Upload an <strong className="text-ink">.xlsx</strong> file with a{" "}
        <strong className="text-ink">"Roll Number"</strong> column. Students must meet branch and
        CGPA requirements. Duplicate enrollments are skipped automatically.
      </p>

      {/* Success result */}
      {result && (
        <div className="mb-4 rounded-md border p-4 bg-prime-soft border-prime/20 text-sm text-ink" role="status">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-prime mt-0.5 shrink-0" aria-hidden />
            <div className="flex-1">
              <p className="font-semibold text-prime mb-1">Upload complete</p>
              <p>
                <span className="text-ink font-medium">{result.enrolled}</span> student{result.enrolled !== 1 ? "s" : ""} enrolled
                {result.skipped > 0 && (
                  <>, <span className="text-ink-muted">{result.skipped} skipped</span></>
                )}
              </p>
              {result.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-ink-muted cursor-pointer hover:text-ink transition-colors">
                    {result.errors.length} row{result.errors.length !== 1 ? "s" : ""} had issues
                  </summary>
                  <ul className="mt-1 space-y-0.5 list-disc list-inside text-xs text-ink-muted">
                    {result.errors.map((e, i) => (
                      <li key={i}><span className="font-medium">{e.rollNumber}</span>: {e.reason}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
            <button
              onClick={handleClear}
              className="text-ink-muted hover:text-ink transition-colors"
              aria-label="Dismiss result"
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-md border p-3 bg-below-soft border-below/20 flex items-start gap-3 text-sm text-below" role="alert">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
          <p className="flex-1">{error}</p>
          <button onClick={() => setError(null)} className="shrink-0" aria-label="Dismiss error">
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>
      )}

      {/* Drop zone */}
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-md transition-colors duration-80 cursor-pointer ${
            dragging
              ? "border-accent bg-accent/5"
              : "border-border hover:border-accent/50 hover:bg-surface-100/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
          aria-label="Click or drag to upload XLSX file"
        >
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center pointer-events-none">
            <Upload className="w-8 h-8 text-ink-subtle mb-3" aria-hidden />
            <p className="text-sm font-medium text-ink mb-1">
              {dragging ? "Drop the file here" : "Drop your Excel file here"}
            </p>
            <p className="text-xs text-ink-muted">or click to browse · .xlsx or .xls · max 5 MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="sr-only"
            onChange={handleInputChange}
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      ) : (
        /* File ready to upload */
        <div className="border border-border rounded-md p-4 flex items-center gap-3 bg-surface-100/60">
          <FileSpreadsheet className="w-8 h-8 text-accent shrink-0" aria-hidden />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{file.name}</p>
            <p className="text-xs text-ink-muted">
              {(file.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button
            onClick={handleClear}
            className="h-7 w-7 rounded-md flex items-center justify-center text-ink-muted hover:bg-surface-200 hover:text-ink transition-colors"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>
      )}

      {/* Upload button */}
      {file && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-80 disabled:opacity-50 min-w-32.5 justify-center"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" aria-hidden />
                Upload &amp; enroll
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
