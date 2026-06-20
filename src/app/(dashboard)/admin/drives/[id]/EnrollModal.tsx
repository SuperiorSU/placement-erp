"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Search, UserPlus, CheckCircle2 } from "lucide-react";

interface EligibleStudent {
  id:         string;
  name:       string;
  rollNumber: string;
  branch:     string;
  cgpa:       number;
  user:       { email: string };
}

interface Props {
  driveId:         string;
  onEnrolled:      () => void;
  enrolledStudentIds: Set<string>;
}

export function EnrollModal({ driveId, onEnrolled, enrolledStudentIds }: Props) {
  const [open,     setOpen]     = useState(false);
  const [students, setStudents] = useState<EligibleStudent[]>([]);
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [enrolled,  setEnrolled]  = useState<Set<string>>(new Set(enrolledStudentIds));
  const [actionError, setActionError] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStudents = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ limit: "30" });
    if (q.trim()) params.set("q", q.trim());

    try {
      const res  = await fetch(`/api/v1/admin/drives/${driveId}/eligible-students?${params}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message ?? "Failed to load students");
        setStudents([]);
        return;
      }

      setStudents(json.data ?? []);
    } catch {
      setError("Network error — please try again");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [driveId]);

  // Fetch when modal opens or search changes
  useEffect(() => {
    if (!open) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchStudents(search), 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, search, fetchStudents]);

  // Escape key closes modal
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus search on open
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  // Sync enrolled set when prop changes
  useEffect(() => {
    setEnrolled(new Set(enrolledStudentIds));
  }, [enrolledStudentIds]);

  async function handleEnroll(studentId: string) {
    setEnrolling(studentId);
    setActionError(null);

    try {
      const res  = await fetch(`/api/v1/admin/drives/${driveId}/enroll`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ studentId }),
      });
      const json = await res.json();

      if (!res.ok) {
        setActionError(json.error?.message ?? "Failed to enroll student");
        return;
      }

      setEnrolled((prev) => new Set(prev).add(studentId));
      onEnrolled();
    } catch {
      setActionError("Network error — please try again");
    } finally {
      setEnrolling(null);
    }
  }

  function handleClose() {
    setOpen(false);
    setSearch("");
    setActionError(null);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-80"
      >
        <UserPlus className="w-4 h-4" aria-hidden />
        Enroll student
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="enroll-title"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div
            className="bg-surface-100 border border-border rounded-lg w-full max-w-lg mx-4 shadow-modal animate-scale-in flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h2 id="enroll-title" className="font-display text-lg font-semibold text-ink">
                Enroll student
              </h2>
              <button
                onClick={handleClose}
                className="h-8 w-8 rounded-md flex items-center justify-center text-ink-muted hover:bg-surface-200 hover:text-ink transition-colors duration-80"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-border shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle pointer-events-none" aria-hidden />
                <input
                  ref={searchRef}
                  type="search"
                  placeholder="Search by name or roll number…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-md text-sm bg-surface border border-border text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-80"
                  aria-label="Search eligible students"
                />
              </div>
              <p className="text-xs text-ink-subtle mt-2">
                Only showing students who meet the branch and CGPA requirements
              </p>
            </div>

            {/* Action error */}
            {actionError && (
              <div className="px-5 py-2 bg-below-soft border-b border-below/20 text-sm text-below shrink-0" role="alert">
                {actionError}
              </div>
            )}

            {/* Student list */}
            <div className="overflow-y-auto flex-1" role="list" aria-label="Eligible students">
              {loading ? (
                <div className="divide-y divide-border">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="px-5 py-3 flex items-center gap-3">
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-32 bg-surface-200 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-surface-200 rounded animate-pulse" />
                      </div>
                      <div className="h-8 w-20 bg-surface-200 rounded-md animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-5">
                  <p className="text-sm text-ink-muted mb-3">{error}</p>
                  <button
                    onClick={() => fetchStudents(search)}
                    className="text-sm text-accent hover:text-accent-hover transition-colors duration-80"
                  >
                    Try again
                  </button>
                </div>
              ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-5">
                  <p className="text-sm text-ink-muted">
                    {search
                      ? "No eligible students match your search."
                      : "No eligible students found for this drive."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {students.map((student) => {
                    const isEnrolled = enrolled.has(student.id);
                    const isEnrolling = enrolling === student.id;

                    return (
                      <div
                        key={student.id}
                        className="px-5 py-3 flex items-center gap-3 hover:bg-surface-200/40 transition-colors duration-80"
                        role="listitem"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-ink truncate">{student.name}</p>
                          <p className="text-xs text-ink-muted tabular-nums">
                            {student.rollNumber} · {student.branch} · {student.cgpa.toFixed(2)} CGPA
                          </p>
                        </div>
                        {isEnrolled ? (
                          <div className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md bg-prime-soft text-prime text-xs font-medium shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden />
                            Enrolled
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEnroll(student.id)}
                            disabled={isEnrolling}
                            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md bg-accent/10 text-accent border border-accent/20 text-xs font-medium hover:bg-accent/20 hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors duration-80 disabled:opacity-50 shrink-0"
                            aria-label={`Enroll ${student.name}`}
                          >
                            {isEnrolling ? "Enrolling…" : "Enroll"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border shrink-0 flex items-center justify-between">
              <p className="text-xs text-ink-subtle">
                {students.length > 0
                  ? `${students.length} eligible student${students.length !== 1 ? "s" : ""} shown`
                  : ""}
              </p>
              <button
                onClick={handleClose}
                className="inline-flex items-center px-4 h-8 rounded-md bg-surface-200 text-ink text-sm font-medium border border-border-strong hover:bg-surface-100 transition-colors duration-80"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
