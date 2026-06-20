"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EnrollModal } from "./EnrollModal";
import { BulkEnrollUpload } from "./BulkEnrollUpload";
import { FunnelBoard } from "./FunnelBoard";

interface StageCounts {
  REGISTERED:   number;
  SHORTLISTED:  number;
  INTERVIEWED:  number;
  OFFERED:      number;
  NOT_SELECTED: number;
}

interface Props {
  driveId:     string;
  stageCounts: StageCounts;
  canEnroll:   boolean; // false when drive is COMPLETED or CANCELLED
}

export function DriveDetailClient({ driveId, stageCounts, canEnroll }: Props) {
  const router               = useRouter();
  const [enrollKey, setEnrollKey] = useState(0);

  function handleEnrolled() {
    // Remount FunnelBoard to refetch fresh data, then also refresh server data
    setEnrollKey((k) => k + 1);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Enrollment actions */}
      {canEnroll && (
        <div className="bg-surface-50 border border-border rounded-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="font-display text-base font-semibold text-ink mb-1">Enrollment</h3>
          <p className="text-sm text-ink-muted mb-4">
            Add students individually or import them via an Excel spreadsheet.
          </p>
          <div className="flex items-center gap-3 mb-5">
            <EnrollModal
              driveId={driveId}
              onEnrolled={handleEnrolled}
              enrolledStudentIds={new Set()}
            />
          </div>
          <BulkEnrollUpload driveId={driveId} onEnrolled={handleEnrolled} />
        </div>
      )}

      {/* Funnel board */}
      <FunnelBoard
        key={enrollKey}
        driveId={driveId}
        stageCounts={stageCounts}
      />
    </div>
  );
}
