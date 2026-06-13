import type { CompanyCategory, DriveStatus, FunnelStage } from "@prisma/client";

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page:  number;
  limit: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data:    T[];
  pagination: PaginationMeta;
  timestamp:  string;
}

export interface ApiSuccessResponse<T> {
  success:   true;
  data:      T;
  meta:      object | null;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code:    string;
    message: string;
    details: unknown;
  };
  timestamp: string;
}

// ── Company ───────────────────────────────────────────────────────────────────

export interface CompanyListItem {
  id:        string;
  name:      string;
  industry:  string;
  hrName:    string;
  hrEmail:   string;
  hrPhone:   string | null;
  category:  CompanyCategory;
  website:   string | null;
  createdAt: string;
  _count:    { drives: number };
}

export interface CompanyDriveSummary {
  id:           string;
  jobRole:      string;
  status:       DriveStatus;
  driveDate:    string;
  academicYear: string;
  _count:       { applications: number };
}

export interface CompanyDetail extends CompanyListItem {
  description: string | null;
  updatedAt:   string;
  drives:      CompanyDriveSummary[];
}
