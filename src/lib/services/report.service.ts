import ExcelJS from "exceljs";
import type { FunnelStage } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { DriveReportQuery } from "@/lib/validations/report.schema";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function createWorkbook(sheetName: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Placement ERP";
  wb.created = new Date();
  const ws = wb.addWorksheet(sheetName);
  return { wb, ws };
}

function styleHeader(ws: ExcelJS.Worksheet, row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1C1F2A" } };
  });
}

function autoWidth(ws: ExcelJS.Worksheet) {
  ws.columns.forEach((col) => {
    let max = 12;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? "").length;
      if (len > max) max = len;
    });
    col.width = Math.min(max + 2, 40);
  });
}

export const ReportService = {
  async branchWise(year: string) {
    const { wb, ws } = createWorkbook("Branch-wise Placements");

    const placements = await prisma.placement.findMany({
      where: { academicYear: year },
      select: {
        type: true, ctc: true,
        student: { select: { branch: true } },
      },
    });

    const map = new Map<string, { total: number; campus: number; manual: number; ppo: number; ctcSum: number }>();
    for (const p of placements) {
      const b = p.student.branch;
      const prev = map.get(b) ?? { total: 0, campus: 0, manual: 0, ppo: 0, ctcSum: 0 };
      map.set(b, {
        total:   prev.total + 1,
        campus:  prev.campus  + (p.type === "CAMPUS" ? 1 : 0),
        manual:  prev.manual  + (p.type === "MANUAL" ? 1 : 0),
        ppo:     prev.ppo     + (p.type === "PPO"    ? 1 : 0),
        ctcSum:  prev.ctcSum  + Number(p.ctc),
      });
    }

    ws.columns = [
      { header: "Branch",             key: "branch" },
      { header: "Total Placements",   key: "total"  },
      { header: "Campus",             key: "campus" },
      { header: "Manual",             key: "manual" },
      { header: "PPO",                key: "ppo"    },
      { header: "Average CTC (LPA)",  key: "avgCtc" },
    ];
    styleHeader(ws, ws.getRow(1));

    for (const [branch, d] of [...map.entries()].sort((a, b) => b[1].total - a[1].total)) {
      ws.addRow({ branch, ...d, avgCtc: (d.ctcSum / d.total).toFixed(2) });
    }

    autoWidth(ws);
    return wb.xlsx.writeBuffer();
  },

  async companyWise(year: string) {
    const { wb, ws } = createWorkbook("Company-wise Placements");

    const placements = await prisma.placement.findMany({
      where: { academicYear: year },
      select: { company: true, jobRole: true, ctc: true },
    });

    const map = new Map<string, { roles: Set<string>; count: number; ctcSum: number }>();
    for (const p of placements) {
      const prev = map.get(p.company) ?? { roles: new Set<string>(), count: 0, ctcSum: 0 };
      prev.roles.add(p.jobRole);
      prev.count++;
      prev.ctcSum += Number(p.ctc);
      map.set(p.company, prev);
    }

    ws.columns = [
      { header: "Company",            key: "company"  },
      { header: "Job Role(s)",        key: "roles"    },
      { header: "Total Offers",       key: "count"    },
      { header: "Average CTC (LPA)",  key: "avgCtc"   },
    ];
    styleHeader(ws, ws.getRow(1));

    for (const [company, d] of [...map.entries()].sort((a, b) => b[1].count - a[1].count)) {
      ws.addRow({
        company,
        roles:  [...d.roles].join(", "),
        count:  d.count,
        avgCtc: (d.ctcSum / d.count).toFixed(2),
      });
    }

    autoWidth(ws);
    return wb.xlsx.writeBuffer();
  },

  async monthly(year: string) {
    const { wb, ws } = createWorkbook("Monthly Summary");

    const startYear = parseInt(year.split("-")[0]);
    const placements = await prisma.placement.findMany({
      where: {
        academicYear: year,
        joiningDate: { not: null },
      },
      select: { joiningDate: true, ctc: true },
    });

    const monthData = new Map<number, { count: number; ctcSum: number }>();
    for (const p of placements) {
      if (!p.joiningDate) continue;
      const m = p.joiningDate.getMonth();
      const prev = monthData.get(m) ?? { count: 0, ctcSum: 0 };
      monthData.set(m, { count: prev.count + 1, ctcSum: prev.ctcSum + Number(p.ctc) });
    }

    ws.columns = [
      { header: "Month",              key: "month"  },
      { header: "Placements",         key: "count"  },
      { header: "Average CTC (LPA)",  key: "avgCtc" },
    ];
    styleHeader(ws, ws.getRow(1));

    for (let i = 0; i < 12; i++) {
      const d = monthData.get(i);
      ws.addRow({
        month:  MONTHS[i],
        count:  d?.count ?? 0,
        avgCtc: d ? (d.ctcSum / d.count).toFixed(2) : "—",
      });
    }

    autoWidth(ws);
    return wb.xlsx.writeBuffer();
  },

  async yearly() {
    const { wb, ws } = createWorkbook("Yearly Summary");

    const groups = await prisma.placement.groupBy({
      by: ["academicYear", "type"],
      _count: { id: true },
      _avg: { ctc: true },
      orderBy: { academicYear: "asc" },
    });

    const yearMap = new Map<string, { campus: number; manual: number; ppo: number; ctcSum: number; total: number }>();
    for (const g of groups) {
      const prev = yearMap.get(g.academicYear) ?? { campus: 0, manual: 0, ppo: 0, ctcSum: 0, total: 0 };
      const count = g._count.id;
      const ctcAvg = Number(g._avg.ctc ?? 0);
      yearMap.set(g.academicYear, {
        campus: prev.campus + (g.type === "CAMPUS" ? count : 0),
        manual: prev.manual + (g.type === "MANUAL" ? count : 0),
        ppo:    prev.ppo   + (g.type === "PPO"    ? count : 0),
        ctcSum: prev.ctcSum + ctcAvg * count,
        total:  prev.total + count,
      });
    }

    ws.columns = [
      { header: "Academic Year",      key: "year"   },
      { header: "Total",              key: "total"  },
      { header: "Campus",             key: "campus" },
      { header: "Manual",             key: "manual" },
      { header: "PPO",                key: "ppo"    },
      { header: "Average CTC (LPA)",  key: "avgCtc" },
    ];
    styleHeader(ws, ws.getRow(1));

    for (const [year, d] of yearMap) {
      ws.addRow({
        year, ...d,
        avgCtc: d.total > 0 ? (d.ctcSum / d.total).toFixed(2) : "—",
      });
    }

    autoWidth(ws);
    return wb.xlsx.writeBuffer();
  },

  async internshipConversion(year: string) {
    const { wb, ws } = createWorkbook("Internship Conversion");

    const internships = await prisma.internship.findMany({
      where: { placement: { academicYear: year } },
      select: {
        startDate: true, endDate: true, outcome: true,
        student: { select: { name: true, rollNumber: true, branch: true } },
        placement: { select: { company: true } },
      },
      orderBy: { startDate: "asc" },
    });

    ws.columns = [
      { header: "Student",    key: "name"       },
      { header: "Roll No",    key: "rollNumber" },
      { header: "Branch",     key: "branch"     },
      { header: "Company",    key: "company"    },
      { header: "Start Date", key: "startDate"  },
      { header: "End Date",   key: "endDate"    },
      { header: "Outcome",    key: "outcome"    },
    ];
    styleHeader(ws, ws.getRow(1));

    for (const r of internships) {
      ws.addRow({
        name:       r.student.name,
        rollNumber: r.student.rollNumber,
        branch:     r.student.branch,
        company:    r.placement.company,
        startDate:  r.startDate.toLocaleDateString("en-IN"),
        endDate:    r.endDate.toLocaleDateString("en-IN"),
        outcome:    r.outcome,
      });
    }

    autoWidth(ws);
    return wb.xlsx.writeBuffer();
  },

  async companyAllDrives(companyId: string) {
    const drives = await prisma.drive.findMany({
      where:   { companyId },
      orderBy: { driveDate: "desc" },
      select: {
        id:           true,
        jobRole:      true,
        ctc:          true,
        driveDate:    true,
        academicYear: true,
        status:       true,
        applications: {
          select: {
            stage:     true,
            student:   { select: { name: true, rollNumber: true, branch: true, cgpa: true } },
            placement: { select: { ctc: true } },
          },
        },
      },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = "Placement ERP";
    wb.created = new Date();

    // Summary sheet
    const summary = wb.addWorksheet("Summary");
    summary.columns = [
      { header: "Academic Year", key: "year"        },
      { header: "Drive Date",    key: "date"        },
      { header: "Job Role",      key: "role"        },
      { header: "CTC (LPA)",    key: "ctc"         },
      { header: "Status",        key: "status"      },
      { header: "Registered",    key: "registered"  },
      { header: "Shortlisted",   key: "shortlisted" },
      { header: "Interviewed",   key: "interviewed" },
      { header: "Offered",       key: "offered"     },
      { header: "Not Selected",  key: "notSelected" },
    ];
    styleHeader(summary, summary.getRow(1));

    for (const drive of drives) {
      const counts = { REGISTERED: 0, SHORTLISTED: 0, INTERVIEWED: 0, OFFERED: 0, NOT_SELECTED: 0 };
      for (const app of drive.applications) counts[app.stage]++;
      summary.addRow({
        year:        drive.academicYear,
        date:        drive.driveDate.toLocaleDateString("en-IN"),
        role:        drive.jobRole,
        ctc:         Number(drive.ctc),
        status:      drive.status,
        registered:  counts.REGISTERED,
        shortlisted: counts.SHORTLISTED,
        interviewed: counts.INTERVIEWED,
        offered:     counts.OFFERED,
        notSelected: counts.NOT_SELECTED,
      });

      // One sheet per drive
      const sheetName = `${drive.academicYear} ${drive.jobRole}`.slice(0, 31);
      const ws = wb.addWorksheet(sheetName);
      ws.columns = [
        { header: "Student",    key: "name"        },
        { header: "Roll No",    key: "rollNumber"  },
        { header: "Branch",     key: "branch"      },
        { header: "CGPA",       key: "cgpa"        },
        { header: "Stage",      key: "stage"       },
        { header: "CTC (LPA)", key: "ctcOffered"  },
      ];
      styleHeader(ws, ws.getRow(1));

      for (const app of drive.applications) {
        ws.addRow({
          name:       app.student.name,
          rollNumber: app.student.rollNumber,
          branch:     app.student.branch,
          cgpa:       Number(app.student.cgpa),
          stage:      app.stage,
          ctcOffered: app.placement ? Number(app.placement.ctc) : "",
        });
      }
      autoWidth(ws);
    }

    autoWidth(summary);
    return wb.xlsx.writeBuffer();
  },

  async companyFiltered(companyId: string, year?: string, month?: number) {
    const drives = await prisma.drive.findMany({
      where: {
        companyId,
        ...(year && { academicYear: year }),
      },
      orderBy: { driveDate: "desc" },
      select: {
        id:           true,
        jobRole:      true,
        ctc:          true,
        driveDate:    true,
        academicYear: true,
        status:       true,
        applications: {
          select: {
            stage:     true,
            student:   { select: { name: true, rollNumber: true, branch: true, cgpa: true } },
            placement: { select: { ctc: true } },
          },
        },
      },
    });

    const filtered = month !== undefined
      ? drives.filter((d) => d.driveDate.getMonth() === month)
      : drives;

    const wb = new ExcelJS.Workbook();
    wb.creator = "Placement ERP";
    wb.created = new Date();

    const ws = wb.addWorksheet("Drive Participants");
    ws.columns = [
      { header: "Academic Year", key: "year"       },
      { header: "Drive Date",    key: "date"       },
      { header: "Job Role",      key: "role"       },
      { header: "CTC (LPA)",    key: "ctc"        },
      { header: "Student",       key: "name"       },
      { header: "Roll No",       key: "rollNumber" },
      { header: "Branch",        key: "branch"     },
      { header: "CGPA",          key: "cgpa"       },
      { header: "Stage",         key: "stage"      },
      { header: "Offered CTC",   key: "ctcOffered" },
    ];
    styleHeader(ws, ws.getRow(1));

    for (const drive of filtered) {
      for (const app of drive.applications) {
        ws.addRow({
          year:       drive.academicYear,
          date:       drive.driveDate.toLocaleDateString("en-IN"),
          role:       drive.jobRole,
          ctc:        Number(drive.ctc),
          name:       app.student.name,
          rollNumber: app.student.rollNumber,
          branch:     app.student.branch,
          cgpa:       Number(app.student.cgpa),
          stage:      app.stage,
          ctcOffered: app.placement ? Number(app.placement.ctc) : "",
        });
      }
    }

    autoWidth(ws);
    return wb.xlsx.writeBuffer();
  },

  async yearAllCompanies(year: string) {
    const companies = await prisma.company.findMany({
      where:    { deletedAt: null, drives: { some: { academicYear: year } } },
      orderBy:  { name: "asc" },
      select: {
        name:     true,
        category: true,
        drives: {
          where:  { academicYear: year },
          select: {
            id:       true,
            jobRole:  true,
            ctc:      true,
            status:   true,
            driveDate: true,
            applications: {
              select: {
                stage:     true,
                placement: { select: { ctc: true } },
              },
            },
          },
        },
      },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = "Placement ERP";
    wb.created = new Date();

    // Summary sheet
    const summary = wb.addWorksheet("Summary");
    summary.columns = [
      { header: "Company",        key: "company"    },
      { header: "Category",       key: "category"   },
      { header: "Drives",         key: "drives"     },
      { header: "Total Enrolled", key: "enrolled"   },
      { header: "Total Offered",  key: "offered"    },
      { header: "Offer Rate %",   key: "offerRate"  },
      { header: "Avg CTC (LPA)", key: "avgCtc"     },
    ];
    styleHeader(summary, summary.getRow(1));

    // Detail sheet: every drive × application
    const detail = wb.addWorksheet("Drive Details");
    detail.columns = [
      { header: "Company",       key: "company"    },
      { header: "Job Role",      key: "role"       },
      { header: "Drive Date",    key: "date"       },
      { header: "Status",        key: "status"     },
      { header: "CTC (LPA)",    key: "ctc"        },
      { header: "Registered",    key: "registered" },
      { header: "Offered",       key: "offered"    },
      { header: "Avg Offered CTC", key: "avgOffered" },
    ];
    styleHeader(detail, detail.getRow(1));

    for (const co of companies) {
      let totalEnrolled = 0;
      let totalOffered  = 0;
      let totalCtcSum   = 0;
      let offeredCount  = 0;

      for (const drive of co.drives) {
        const registered = drive.applications.length;
        const offered    = drive.applications.filter((a) => a.stage === "OFFERED").length;
        const ctcSum     = drive.applications.reduce((s, a) => s + (a.placement ? Number(a.placement.ctc) : 0), 0);
        const drvOffered = drive.applications.filter((a) => a.placement).length;

        totalEnrolled += registered;
        totalOffered  += offered;
        totalCtcSum   += ctcSum;
        offeredCount  += drvOffered;

        detail.addRow({
          company:    co.name,
          role:       drive.jobRole,
          date:       drive.driveDate.toLocaleDateString("en-IN"),
          status:     drive.status,
          ctc:        Number(drive.ctc),
          registered,
          offered,
          avgOffered: drvOffered > 0 ? (ctcSum / drvOffered).toFixed(2) : "—",
        });
      }

      summary.addRow({
        company:   co.name,
        category:  co.category,
        drives:    co.drives.length,
        enrolled:  totalEnrolled,
        offered:   totalOffered,
        offerRate: totalEnrolled > 0 ? ((totalOffered / totalEnrolled) * 100).toFixed(1) : "0.0",
        avgCtc:    offeredCount > 0 ? (totalCtcSum / offeredCount).toFixed(2) : "—",
      });
    }

    autoWidth(summary);
    autoWidth(detail);
    return wb.xlsx.writeBuffer();
  },

  async branchDetail(branch: string, year?: string) {
    const where: Parameters<typeof prisma.driveApplication.findMany>[0]["where"] = {
      student: { branch: { equals: branch, mode: "insensitive" } },
    };
    if (year) {
      where.drive = { academicYear: year };
    }

    const applications = await prisma.driveApplication.findMany({
      where,
      orderBy: { appliedAt: "desc" },
      select: {
        stage:     true,
        appliedAt: true,
        student:   { select: { name: true, rollNumber: true, cgpa: true } },
        drive: {
          select: {
            jobRole:      true,
            ctc:          true,
            driveDate:    true,
            academicYear: true,
            status:       true,
            company:      { select: { name: true } },
          },
        },
        placement: { select: { ctc: true } },
      },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = "Placement ERP";
    wb.created = new Date();

    // Summary by drive
    const summary = wb.addWorksheet("By Drive");
    summary.columns = [
      { header: "Academic Year", key: "year"       },
      { header: "Company",       key: "company"    },
      { header: "Job Role",      key: "role"       },
      { header: "Drive Date",    key: "date"       },
      { header: "Enrolled",      key: "enrolled"   },
      { header: "Offered",       key: "offered"    },
      { header: "CTC (LPA)",    key: "ctc"        },
    ];
    styleHeader(summary, summary.getRow(1));

    // Aggregate by drive
    const driveMap = new Map<string, {
      year: string; company: string; role: string; date: string;
      enrolled: number; offered: number; ctc: number;
    }>();
    for (const app of applications) {
      const key = `${app.drive.academicYear}::${app.drive.company.name}::${app.drive.jobRole}`;
      const prev = driveMap.get(key) ?? {
        year:     app.drive.academicYear,
        company:  app.drive.company.name,
        role:     app.drive.jobRole,
        date:     app.drive.driveDate.toLocaleDateString("en-IN"),
        enrolled: 0,
        offered:  0,
        ctc:      Number(app.drive.ctc),
      };
      driveMap.set(key, {
        ...prev,
        enrolled: prev.enrolled + 1,
        offered:  prev.offered + (app.stage === "OFFERED" ? 1 : 0),
      });
    }
    for (const row of driveMap.values()) summary.addRow(row);

    // Detail sheet
    const detail = wb.addWorksheet("All Students");
    detail.columns = [
      { header: "Student",       key: "name"        },
      { header: "Roll No",       key: "rollNumber"  },
      { header: "CGPA",          key: "cgpa"        },
      { header: "Academic Year", key: "year"        },
      { header: "Company",       key: "company"     },
      { header: "Job Role",      key: "role"        },
      { header: "Drive Date",    key: "date"        },
      { header: "Stage",         key: "stage"       },
      { header: "Offered CTC",   key: "ctcOffered"  },
    ];
    styleHeader(detail, detail.getRow(1));

    for (const app of applications) {
      detail.addRow({
        name:       app.student.name,
        rollNumber: app.student.rollNumber,
        cgpa:       Number(app.student.cgpa),
        year:       app.drive.academicYear,
        company:    app.drive.company.name,
        role:       app.drive.jobRole,
        date:       app.drive.driveDate.toLocaleDateString("en-IN"),
        stage:      app.stage,
        ctcOffered: app.placement ? Number(app.placement.ctc) : "",
      });
    }

    autoWidth(summary);
    autoWidth(detail);
    return wb.xlsx.writeBuffer();
  },

  async driveParticipants(query: DriveReportQuery) {
    const where: Parameters<typeof prisma.driveApplication.findMany>[0]["where"] = {
      driveId: query.driveId,
    };

    if (query.stage)  where.stage = query.stage as FunnelStage;
    if (query.branch) where.student = { branch: { equals: query.branch, mode: "insensitive" } };
    if (query.jobRole) where.drive = { jobRole: { contains: query.jobRole, mode: "insensitive" } };

    if (query.minCtc !== undefined || query.maxCtc !== undefined) {
      where.placement = {
        ctc: {
          ...(query.minCtc !== undefined && { gte: query.minCtc }),
          ...(query.maxCtc !== undefined && { lte: query.maxCtc }),
        },
      };
    }

    const drive = await prisma.drive.findUnique({
      where:  { id: query.driveId },
      select: { jobRole: true, academicYear: true, company: { select: { name: true } } },
    });

    const applications = await prisma.driveApplication.findMany({
      where,
      orderBy: { student: { name: "asc" } },
      select: {
        stage:     true,
        joiningDate: true,
        student:   { select: { name: true, rollNumber: true, branch: true, cgpa: true } },
        drive:     { select: { jobRole: true, ctc: true } },
        placement: { select: { ctc: true } },
      },
    });

    const sheetName = `${drive?.company.name ?? ""} ${drive?.jobRole ?? ""}`.trim().slice(0, 31) || "Participants";
    const { wb, ws } = createWorkbook(sheetName);

    ws.columns = [
      { header: "Student",      key: "name"        },
      { header: "Roll No",      key: "rollNumber"  },
      { header: "Branch",       key: "branch"      },
      { header: "CGPA",         key: "cgpa"        },
      { header: "Stage",        key: "stage"       },
      { header: "Job Role",     key: "role"        },
      { header: "CTC (LPA)",   key: "ctc"         },
      { header: "Offered CTC",  key: "ctcOffered"  },
      { header: "Joining Date", key: "joiningDate" },
    ];
    styleHeader(ws, ws.getRow(1));

    for (const app of applications) {
      ws.addRow({
        name:        app.student.name,
        rollNumber:  app.student.rollNumber,
        branch:      app.student.branch,
        cgpa:        Number(app.student.cgpa),
        stage:       app.stage,
        role:        app.drive.jobRole,
        ctc:         Number(app.drive.ctc),
        ctcOffered:  app.placement ? Number(app.placement.ctc) : "",
        joiningDate: app.joiningDate ? app.joiningDate.toLocaleDateString("en-IN") : "",
      });
    }

    autoWidth(ws);
    return wb.xlsx.writeBuffer();
  },

  async manualPlacements(year: string) {
    const { wb, ws } = createWorkbook("Manual Placements");

    const records = await prisma.manualPlacement.findMany({
      where: { academicYear: year },
      select: {
        company: true, jobRole: true, ctc: true,
        type: true, referralSource: true, joiningDate: true, academicYear: true,
        admin: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Fetch students separately to avoid complex joins
    const manualWithStudents = await prisma.manualPlacement.findMany({
      where: { academicYear: year },
      select: {
        id: true,
        studentId: true,
        company: true, jobRole: true, ctc: true,
        type: true, referralSource: true, joiningDate: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const studentIds = manualWithStudents.map((m) => m.studentId);
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, name: true, rollNumber: true, branch: true },
    });
    const studentMap = new Map(students.map((s) => [s.id, s]));

    ws.columns = [
      { header: "Student",        key: "name"           },
      { header: "Roll No",        key: "rollNumber"     },
      { header: "Branch",         key: "branch"         },
      { header: "Company",        key: "company"        },
      { header: "Job Role",       key: "jobRole"        },
      { header: "CTC (LPA)",      key: "ctc"            },
      { header: "Type",           key: "type"           },
      { header: "Referral",       key: "referralSource" },
      { header: "Joining Date",   key: "joiningDate"    },
    ];
    styleHeader(ws, ws.getRow(1));

    for (const m of manualWithStudents) {
      const s = studentMap.get(m.studentId);
      ws.addRow({
        name:           s?.name       ?? "",
        rollNumber:     s?.rollNumber ?? "",
        branch:         s?.branch     ?? "",
        company:        m.company,
        jobRole:        m.jobRole,
        ctc:            Number(m.ctc),
        type:           m.type,
        referralSource: m.referralSource,
        joiningDate:    m.joiningDate ? m.joiningDate.toLocaleDateString("en-IN") : "",
      });
    }

    autoWidth(ws);
    return wb.xlsx.writeBuffer();
  },
};
