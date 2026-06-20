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

// ── Drive ─────────────────────────────────────────────────────────────────────

export interface StageCounts {
  REGISTERED:   number;
  SHORTLISTED:  number;
  INTERVIEWED:  number;
  OFFERED:      number;
  NOT_SELECTED: number;
}

export interface DriveListItem {
  id:           string;
  jobRole:      string;
  ctc:          number;
  jobLocation:  string;
  status:       DriveStatus;
  driveDate:    string;
  academicYear: string;
  company:      { id: string; name: string; category: CompanyCategory };
  _count:       { applications: number };
}

export interface DriveDetail {
  id:                  string;
  jobRole:             string;
  ctc:                 number;
  jobLocation:         string;
  eligibleBranches:    string[];
  minCgpa:             number;
  driveDate:           string;
  applicationDeadline: string | null;
  status:              DriveStatus;
  academicYear:        string;
  description:         string | null;
  createdAt:           string;
  updatedAt:           string;
  company: {
    id:       string;
    name:     string;
    category: CompanyCategory;
    industry: string;
    hrName:   string;
    hrEmail:  string;
  };
  admin:       { id: string; name: string };
  _count:      { applications: number };
  stageCounts: StageCounts;
}

export interface ApplicationItem {
  id:              string;
  stage:           FunnelStage;
  appliedAt:       string;
  updatedAt:       string;
  notes:           string | null;
  offerLetterUrl:  string | null;
  offerLetterName: string | null;
  joiningDate:     string | null;
  student: {
    id:         string;
    name:       string;
    rollNumber: string;
    branch:     string;
    cgpa:       number;
    phone:      string | null;
    user:       { email: string };
  };
}

export interface BulkEnrollResult {
  enrolled: number;
  skipped:  number;
  errors:   { rollNumber: string; reason: string }[];
}
