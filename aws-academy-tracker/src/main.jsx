import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  ListChecks,
  Search,
  Table2,
  Upload
} from "lucide-react";
import { csvToGradebook } from "./csv.js";
import { buildStudentTrackers, summarizeTrackers } from "./tracker.js";
import "./styles.css";

const statusFilters = ["All", "Approved", "Pending"];
const typeFilters = ["Guided", "Challenge", "Test"];
const viewModes = [
  { id: "detail", label: "Detail", icon: ListChecks },
  { id: "excel", label: "Excel", icon: Table2 }
];

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }
  return `${Math.round(value)}%`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanCriterionTitle(title) {
  return String(title ?? "")
    .replace(/\s*\(\d+\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const exportPalette = {
  fixed: { background: "#F4F7F4", color: "#17211B" },
  score: { background: "#F2F4F5", color: "#17211B" },
  required: { background: "#E7F3E9", color: "#203B2B" },
  requiredBlockTwo: { background: "#CFE4D1", color: "#173821" },
  challenge: { background: "#FFF4C7", color: "#203B2B" },
  test: { background: "#E5F0FF", color: "#203B2B" },
  pending: { background: "#FDE2E2", color: "#6E1F1F" }
};

const blockTwoRequiredModules = new Set(["M10", "M11", "M12", "M13", "M14", "M15", "M16"]);

function exportStyle(...styles) {
  return styles.filter(Boolean).join("");
}

function colorStyle(tone) {
  return `background-color: ${tone.background}; color: ${tone.color};`;
}

function headerCell(value, attributes = "", className = "", style = "", background = "") {
  const baseAttributes = attributes ? ` ${attributes}` : "";
  const classAttribute = className ? ` class="${className}"` : "";
  const styleAttribute = style ? ` style="${style}"` : "";
  const backgroundAttribute = background ? ` bgcolor="${background}"` : "";
  return `<th${baseAttributes}${classAttribute}${styleAttribute}${backgroundAttribute}>${escapeHtml(value)}</th>`;
}

function dataCell(value, className = "", style = "", background = "") {
  const classAttribute = className ? ` class="${className}"` : "";
  const styleAttribute = style ? ` style="${style}"` : "";
  const backgroundAttribute = background ? ` bgcolor="${background}"` : "";
  return `<td${classAttribute}${styleAttribute}${backgroundAttribute}>${escapeHtml(value)}</td>`;
}

function exportToneForItem(item) {
  if (item.type === "Test") {
    return { className: "export-test", ...exportPalette.test };
  }
  if (item.required === "Required") {
    if (isBlockTwoRequiredItem(item)) {
      return { className: "export-required-block-two", ...exportPalette.requiredBlockTwo };
    }
    return { className: "export-required", ...exportPalette.required };
  }
  return { className: "export-challenge", ...exportPalette.challenge };
}

function exportHeaderForItem(item) {
  const moduleLabel = item.module || item.type;
  const title = cleanCriterionTitle(item.title);
  const guidedMatch = title.match(/^Guided\s+Lab:\s*(.+)$/i);
  const challengeMatch = title.match(/^Challenge\s*(?:\([^)]*\))?\s*lab:\s*(.+)$/i);

  if (guidedMatch) {
    return {
      prefix: `${moduleLabel} - Guided lab:`,
      title: guidedMatch[1]
    };
  }
  if (challengeMatch) {
    return {
      prefix: `${moduleLabel} - Challenge lab:`,
      title: challengeMatch[1]
    };
  }
  return {
    prefix: moduleLabel,
    title
  };
}

function exportPendingToneForItem(item) {
  if (item.percent === null || item.percent === undefined || Number.isNaN(item.percent)) {
    return null;
  }
  if (item.type === "Test") {
    return null;
  }
  const threshold = item.required === "Required" ? 75 : 60;
  return item.percent <= threshold ? { className: "export-pending", ...exportPalette.pending } : null;
}

function exportColumnSpanForHeader(cell) {
  return cell.columnCount ?? 2;
}

function formatScoreValue(score) {
  if (score === null || score === undefined) {
    return "";
  }
  return score;
}

function requiredCompletionRatio(tracker) {
  return tracker.requiredTotal > 0 ? tracker.completedRequired / tracker.requiredTotal : 0;
}

function exportTrackersToExcel(trackers, selectedTypes) {
  const baseCellStyle = "border: 1px solid #9FB0A5; padding: 6px 8px; white-space: nowrap;";
  const baseHeaderStyle = `${baseCellStyle} font-weight: 700; text-align: center; vertical-align: middle;`;
  const textCellStyle = 'mso-number-format: "\\@";';
  const titleHeaderStyle = "white-space: normal; width: 260px;";
  const prefixHeaderStyle = "white-space: normal; width: 260px;";
  const percentColumnStyle = "width: 75px; text-align: center;";
  const valueColumnStyle = "width: 95px; text-align: center;";
  const columns = trackers[0]?.items.filter((item) => selectedTypes.has(item.type)) ?? [];
  const fixedHeaders = [
    { label: "Student", className: "fixed-header student-col", width: 230, ...exportPalette.fixed },
    { label: "Email", className: "fixed-header email-col", width: 230, ...exportPalette.fixed },
    { label: "Approval", className: "fixed-header approval-col", width: 95, ...exportPalette.fixed }
  ];
  const pairedHeaders = [
    { label: "Required", className: "export-required", ...exportPalette.required },
    { label: "Extra", className: "export-challenge", ...exportPalette.challenge },
    { label: "Current Score", className: "score-header", ...exportPalette.score },
    { label: "Final Score", className: "score-header", ...exportPalette.score },
    ...columns.map((item) => ({
      ...exportHeaderForItem(item),
      ...exportToneForItem(item),
      columnCount: item.type === "Test" ? 1 : 2
    }))
  ];
  const colGroup = [
    ...fixedHeaders.map((cell) => `<col width="${cell.width}" style="width: ${cell.width}px;" />`),
    ...pairedHeaders.flatMap((cell) =>
      exportColumnSpanForHeader(cell) === 1
        ? [`<col width="75" style="width: 75px;" />`]
        : [`<col width="75" style="width: 75px;" />`, `<col width="95" style="width: 95px;" />`]
    )
  ].join("");
  const firstHeaderRow = [
    ...fixedHeaders.map((cell) =>
      headerCell(
        cell.label,
        'rowspan="3"',
        cell.className,
        exportStyle(baseHeaderStyle, colorStyle(cell), `width: ${cell.width}px;`),
        cell.background
      )
    ),
    ...pairedHeaders.map((cell) => {
      const columnSpan = exportColumnSpanForHeader(cell);
      const attributes = cell.prefix ? `colspan="${columnSpan}"` : `colspan="${columnSpan}" rowspan="2"`;
      const label = cell.prefix ? cell.prefix : cell.label;

      return headerCell(
        label,
        attributes,
        `${cell.className} title-header`,
        exportStyle(baseHeaderStyle, colorStyle(cell), cell.prefix ? prefixHeaderStyle : titleHeaderStyle),
        cell.background
      );
    })
  ].join("");
  const titleHeaderRow = pairedHeaders
    .map((cell) => {
      if (!cell.prefix) {
        return "";
      }
      return headerCell(
        cell.title,
        `colspan="${exportColumnSpanForHeader(cell)}"`,
        `${cell.className} title-header`,
        exportStyle(baseHeaderStyle, colorStyle(cell), prefixHeaderStyle),
        cell.background
      );
    })
    .join("");
  const secondHeaderRow = pairedHeaders
    .map(
      (cell) =>
        exportColumnSpanForHeader(cell) === 1
          ? headerCell(
              "Percent",
              "",
              `${cell.className} percent-col`,
              exportStyle(baseHeaderStyle, colorStyle(cell), percentColumnStyle),
              cell.background
            )
          : `${headerCell(
              "Percent",
              "",
              `${cell.className} percent-col`,
              exportStyle(baseHeaderStyle, colorStyle(cell), percentColumnStyle),
              cell.background
            )}${headerCell(
              "Value",
              "",
              `${cell.className} value-col`,
              exportStyle(baseHeaderStyle, colorStyle(cell), valueColumnStyle),
              cell.background
            )}`
    )
    .join("");
  const tableRows = [
    `<tr>${firstHeaderRow}</tr>`,
    `<tr>${titleHeaderRow}</tr>`,
    `<tr>${secondHeaderRow}</tr>`,
    ...[...trackers]
      .sort((left, right) => {
        const requiredDiff = requiredCompletionRatio(right) - requiredCompletionRatio(left);
        const completedDiff = right.completedRequired - left.completedRequired;
        return requiredDiff || completedDiff || left.name.localeCompare(right.name);
      })
      .map((tracker) => {
      const requiredPercent = tracker.requiredTotal > 0 ? (tracker.completedRequired / tracker.requiredTotal) * 100 : null;
      const extraPercent = tracker.extraTotal > 0 ? (tracker.completedExtra / tracker.extraTotal) * 100 : null;
      const itemCells = tracker.items
        .filter((item) => selectedTypes.has(item.type))
        .flatMap((item) => {
          const tone = exportPendingToneForItem(item) ?? exportToneForItem(item);
          const percentCell = dataCell(
            formatPercent(item.percent),
            `${tone.className} percent-col`,
            exportStyle(baseCellStyle, colorStyle(tone), percentColumnStyle),
            tone.background
          );

          if (item.type === "Test") {
            return [percentCell];
          }

          return [
            percentCell,
            dataCell(
              formatScoreValue(item.rawScore),
              `text-cell ${tone.className} value-col`,
              exportStyle(baseCellStyle, colorStyle(tone), textCellStyle, valueColumnStyle),
              tone.background
            )
          ];
        });
      const row = [
        dataCell(
          tracker.name,
          "text-cell student-col",
          exportStyle(baseCellStyle, colorStyle(exportPalette.fixed), textCellStyle, "width: 230px;"),
          exportPalette.fixed.background
        ),
        dataCell(
          tracker.email,
          "text-cell email-col",
          exportStyle(baseCellStyle, colorStyle(exportPalette.fixed), textCellStyle, "width: 230px;"),
          exportPalette.fixed.background
        ),
        dataCell(
          tracker.approvalStatus,
          "text-cell approval-col",
          exportStyle(baseCellStyle, colorStyle(exportPalette.fixed), textCellStyle, "width: 95px;"),
          exportPalette.fixed.background
        ),
        dataCell(
          formatPercent(requiredPercent),
          "export-required percent-col",
          exportStyle(baseCellStyle, colorStyle(exportPalette.required), percentColumnStyle),
          exportPalette.required.background
        ),
        dataCell(
          formatScoreValue(tracker.completedRequired),
          "text-cell export-required value-col",
          exportStyle(baseCellStyle, colorStyle(exportPalette.required), textCellStyle, valueColumnStyle),
          exportPalette.required.background
        ),
        dataCell(
          formatPercent(extraPercent),
          "export-challenge percent-col",
          exportStyle(baseCellStyle, colorStyle(exportPalette.challenge), percentColumnStyle),
          exportPalette.challenge.background
        ),
        dataCell(
          formatScoreValue(tracker.completedExtra),
          "text-cell export-challenge value-col",
          exportStyle(baseCellStyle, colorStyle(exportPalette.challenge), textCellStyle, valueColumnStyle),
          exportPalette.challenge.background
        ),
        dataCell(
          formatPercent(tracker.currentScore),
          "score-header percent-col",
          exportStyle(baseCellStyle, colorStyle(exportPalette.score), percentColumnStyle),
          exportPalette.score.background
        ),
        dataCell(
          "",
          "text-cell score-header value-col",
          exportStyle(baseCellStyle, colorStyle(exportPalette.score), textCellStyle, valueColumnStyle),
          exportPalette.score.background
        ),
        dataCell(
          formatPercent(tracker.finalScore),
          "score-header percent-col",
          exportStyle(baseCellStyle, colorStyle(exportPalette.score), percentColumnStyle),
          exportPalette.score.background
        ),
        dataCell(
          "",
          "text-cell score-header value-col",
          exportStyle(baseCellStyle, colorStyle(exportPalette.score), textCellStyle, valueColumnStyle),
          exportPalette.score.background
        ),
        ...itemCells
      ];

      return `<tr>${row.join("")}</tr>`;
    })
  ].join("");
  const workbook = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      table { border-collapse: collapse; font-family: Arial, sans-serif; }
      th { font-weight: 700; text-align: center; vertical-align: middle; }
      th, td { border: 1px solid #9fb0a5; padding: 6px 8px; white-space: nowrap; }
      .title-header { white-space: normal; width: 260px; }
      .student-col { width: 230px; }
      .email-col { width: 230px; }
      .approval-col { width: 95px; }
      .percent-col { width: 75px; text-align: center; }
      .value-col { width: 95px; text-align: center; }
      .fixed-header { background: #f4f7f4; color: #17211b; }
      .score-header { background: #f2f4f5; color: #17211b; }
      .export-required { background: #cfe6f3; color: #12384d; }
      .export-challenge { background: #dff0df; color: #183f25; }
      .export-test { background: #fff0b8; color: #4d3a00; }
      .text-cell { mso-number-format: "\\@"; }
    </style>
  </head>
  <body>
    <table><colgroup>${colGroup}</colgroup>${tableRows}</table>
  </body>
</html>`;
  const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStamp = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `aws-academy-tracker-${dateStamp}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function App() {
  const [gradebook, setGradebook] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("detail");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState(() => new Set(typeFilters));

  useEffect(() => {
    fetch("/data/default-grades.csv")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Default CSV could not be loaded.");
        }
        return response.text();
      })
      .then((text) => setGradebook(csvToGradebook(text)))
      .catch((error) => setLoadError(error.message));
  }, []);

  const trackers = useMemo(() => {
    if (!gradebook) {
      return [];
    }
    return buildStudentTrackers(gradebook.students, gradebook.pointsByTitle);
  }, [gradebook]);

  const summary = useMemo(() => summarizeTrackers(trackers), [trackers]);

  const filteredTrackers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return trackers.filter((tracker) => {
      const matchesQuery =
        !normalizedQuery ||
        tracker.name.toLowerCase().includes(normalizedQuery) ||
        tracker.email.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "All" || tracker.approvalStatus === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter, trackers]);

  const selectedStudent = useMemo(() => {
    return filteredTrackers.find((tracker) => tracker.id === selectedStudentId) ?? filteredTrackers[0] ?? null;
  }, [filteredTrackers, selectedStudentId]);

  function handleCsvUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        setGradebook(csvToGradebook(String(reader.result ?? "")));
        setSelectedStudentId(null);
        setLoadError("");
      } catch (error) {
        setLoadError(error.message);
      }
    };
    reader.readAsText(file);
  }

  function toggleType(type) {
    setSelectedTypes((current) => {
      const next = new Set(current);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  const visibleItems = selectedStudent?.items.filter((item) => selectedTypes.has(item.type)) ?? [];

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">AWS Academy</p>
          <h1>Student Approval Tracker</h1>
        </div>
        <div className="topbar-actions">
          <button
            className="export-button"
            disabled={filteredTrackers.length === 0}
            type="button"
            onClick={() => exportTrackersToExcel(filteredTrackers, selectedTypes)}
          >
            <Download size={18} />
            <span>Export Excel</span>
          </button>
          <label className="upload-button">
            <Upload size={18} />
            <span>Upload CSV</span>
            <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} />
          </label>
        </div>
      </section>

      {loadError ? <div className="error-banner">{loadError}</div> : null}

      <section className="metrics-grid" aria-label="Tracker summary">
        <Metric label="Students" value={summary.total} />
        <Metric label="Approved" value={summary.approved} tone="good" />
        <Metric label="Pending" value={summary.pending} tone="warning" />
        <Metric label="Required Progress" value={formatPercent(summary.averageRequired)} />
      </section>

      <section className="controls-row" aria-label="Tracker controls">
        <div className="view-switch" aria-label="Tracker views">
          {viewModes.map((view) => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                className={viewMode === view.id ? "active" : ""}
                type="button"
                onClick={() => setViewMode(view.id)}
                title={`${view.label} view`}
              >
                <Icon size={17} />
                <span>{view.label}</span>
              </button>
            );
          })}
        </div>
        <div className="search-box top-search">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search students" />
        </div>
        <div className="segmented top-segmented">
          {statusFilters.map((status) => (
            <button
              key={status}
              className={statusFilter === status ? "active" : ""}
              type="button"
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </section>

      <section className={`workspace ${viewMode === "excel" ? "excel-workspace" : ""}`}>
        {viewMode === "detail" ? (
        <aside className="student-panel">
          <div className="student-list">
            {filteredTrackers.map((tracker) => (
              <button
                key={tracker.id}
                className={`student-row ${selectedStudent?.id === tracker.id ? "selected" : ""}`}
                type="button"
                onClick={() => setSelectedStudentId(tracker.id)}
              >
                <span>
                  <strong>{tracker.name}</strong>
                  <small>{tracker.email || "No email"}</small>
                </span>
                <StatusBadge status={tracker.approvalStatus} />
              </button>
            ))}
          </div>
        </aside>
        ) : null}

        <section className={`detail-panel ${viewMode === "excel" ? "excel-panel" : ""}`}>
          {viewMode === "excel" ? (
            <ExcelView trackers={filteredTrackers} selectedTypes={selectedTypes} onSelectStudent={setSelectedStudentId} />
          ) : selectedStudent ? (
            <>
              <div className="student-header">
                <div>
                  <p className="eyebrow">{selectedStudent.section}</p>
                  <h2>{selectedStudent.name}</h2>
                  <p>{selectedStudent.email || "No email in CSV"}</p>
                </div>
                <StatusBadge status={selectedStudent.approvalStatus} large />
              </div>

              <div className="progress-strip">
                <Metric
                  label="Required Passed"
                  value={`${selectedStudent.completedRequired}/${selectedStudent.requiredTotal}`}
                  tone={selectedStudent.approvalStatus === "Approved" ? "good" : "warning"}
                />
                <Metric label="Extra Points Passed" value={`${selectedStudent.completedExtra}/${selectedStudent.extraTotal}`} />
                <Metric label="Current Score" value={formatPercent(selectedStudent.currentScore)} />
                <Metric label="Final Score" value={formatPercent(selectedStudent.finalScore)} />
              </div>

              <div className="detail-toolbar">
                <div className="type-toggles" aria-label="Visible criteria types">
                  {typeFilters.map((type) => (
                    <label key={type}>
                      <input checked={selectedTypes.has(type)} type="checkbox" onChange={() => toggleType(type)} />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
                <span className="criteria-count">{visibleItems.length} criteria</span>
              </div>

              <div className="criteria-table">
                <div className="criteria-head">
                  <span>Module</span>
                  <span>Type</span>
                  <span>Title</span>
                  <span>Required</span>
                  <span>Score</span>
                  <span>Status</span>
                </div>
                {visibleItems.map((item) => (
                  <div className="criteria-row" key={`${item.type}-${item.title}`}>
                    <span>{item.module || "-"}</span>
                    <span>{item.type}</span>
                    <span className="title-cell">{cleanCriterionTitle(item.title)}</span>
                    <span>{item.required || "-"}</span>
                    <span>{item.rawScore === null ? "-" : `${item.rawScore}/${item.possiblePoints ?? "-"}`}</span>
                    <span>
                      <ResultBadge item={item} />
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <FileSpreadsheet size={34} />
              <p>No matching students.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function ExcelView({ trackers, selectedTypes, onSelectStudent }) {
  const [sortConfig, setSortConfig] = useState({ key: "combined", direction: "desc" });
  const [collapsedGroups, setCollapsedGroups] = useState({
    required: false,
    extra: false,
    test: false
  });
  const availableColumns =
    trackers[0]?.items
      .map((item, criterionIndex) => ({ item, criterionIndex }))
      .filter((column) => selectedTypes.has(column.item.type)) ?? [];
  const groupCounts = useMemo(() => {
    return availableColumns.reduce(
      (counts, item) => {
        counts[groupKeyForItem(item.item)] += 1;
        return counts;
      },
      { required: 0, extra: 0, test: 0 }
    );
  }, [availableColumns]);
  const columns = useMemo(() => {
    const displayColumns = [];
    const addedCollapsedGroups = new Set();

    availableColumns.forEach((column) => {
      const groupKey = groupKeyForItem(column.item);
      if (collapsedGroups[groupKey]) {
        if (!addedCollapsedGroups.has(groupKey)) {
          displayColumns.push({
            kind: "group",
            groupKey,
            label: groupLabelForKey(groupKey),
            count: groupCounts[groupKey],
            type: groupKey === "test" ? "Test" : "Group",
            required: groupKey === "required" ? "Required" : ""
          });
          addedCollapsedGroups.add(groupKey);
        }
        return;
      }

      displayColumns.push({ kind: "criterion", item: column.item, criterionIndex: column.criterionIndex });
    });

    return displayColumns;
  }, [availableColumns, collapsedGroups, groupCounts]);
  const blockColumns = useMemo(() => buildBlockColumns(columns), [columns]);
  const sortedTrackers = useMemo(() => {
    const direction = sortConfig.direction === "asc" ? 1 : -1;

    return [...trackers].sort((left, right) => {
      if (sortConfig.key === "combined") {
        return (
          compareTrackerScore(left, right, "completedRequired", "requiredTotal", direction) ||
          compareTrackerScore(left, right, "completedExtra", "extraTotal", direction) ||
          left.name.localeCompare(right.name)
        );
      }

      const scoreKey = sortConfig.key === "extra" ? "completedExtra" : "completedRequired";
      const totalKey = sortConfig.key === "extra" ? "extraTotal" : "requiredTotal";

      return (
        compareTrackerScore(left, right, scoreKey, totalKey, direction) ||
        left.name.localeCompare(right.name)
      );
    });
  }, [sortConfig, trackers]);

  function toggleSort(key) {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "desc" ? "asc" : "desc"
    }));
  }

  function toggleGroup(key) {
    setCollapsedGroups((current) => ({
      ...current,
      [key]: !current[key]
    }));
  }

  if (trackers.length === 0) {
    return (
      <div className="empty-state">
        <FileSpreadsheet size={34} />
        <p>No matching students.</p>
      </div>
    );
  }

  return (
    <>
      <div className="excel-header">
        <div>
          <p className="eyebrow">Spreadsheet</p>
          <h2>Student Criteria Matrix</h2>
        </div>
        <span>{trackers.length} students</span>
      </div>
      <div
        className="excel-grid"
        role="table"
        aria-label="Student criteria matrix"
        style={{ "--criteria-columns": columns.length }}
      >
        <div className="excel-group-row" role="row">
          <div className="excel-group-spacer">Criteria Groups</div>
          <GroupToggle
            collapsed={collapsedGroups.required}
            count={groupCounts.required}
            label="Required"
            tone="required"
            onClick={() => toggleGroup("required")}
          />
          <GroupToggle
            collapsed={collapsedGroups.extra}
            count={groupCounts.extra}
            label="Extra"
            tone="other"
            onClick={() => toggleGroup("extra")}
          />
          <GroupToggle
            collapsed={collapsedGroups.test}
            count={groupCounts.test}
            label="Tests"
            tone="test"
            onClick={() => toggleGroup("test")}
          />
          <CombinedSortButton
            active={sortConfig.key === "combined"}
            direction={sortConfig.direction}
            onClick={() => toggleSort("combined")}
          />
        </div>
        <div className="excel-row excel-block-row" role="row">
          <div className="excel-cell sticky-name block-spacer" aria-hidden="true" />
          <div className="excel-cell block-spacer" aria-hidden="true" />
          <div className="excel-cell block-spacer" aria-hidden="true" />
          <div className="excel-cell block-spacer" aria-hidden="true" />
          {blockColumns.map((block, index) => (
            <div
              className={`excel-cell block-label ${block.key ? `block-${block.key}` : "block-empty"}`}
              role="columnheader"
              aria-label={block.label || "No block"}
              key={`${block.key || "empty"}-${index}`}
              style={{ gridColumn: `span ${block.columnCount}` }}
            >
              {block.label}
            </div>
          ))}
        </div>
        <div className="excel-row excel-head" role="row">
          <div className="excel-cell sticky-name" role="columnheader">
            Student
          </div>
          <div className="excel-cell summary-cell" role="columnheader">
            Approval
          </div>
          <SortableHeader
            active={sortConfig.key === "required"}
            direction={sortConfig.direction}
            label="Required"
            onClick={() => toggleSort("required")}
          />
          <SortableHeader
            active={sortConfig.key === "extra"}
            direction={sortConfig.direction}
            label="Extra"
            onClick={() => toggleSort("extra")}
          />
          {columns.map((column, index) =>
            column.kind === "group" ? (
              <button
                className={`excel-cell criterion-column collapsed-column ${toneClassForItem(column)}`}
                role="columnheader"
                type="button"
                key={`${column.groupKey}-${index}`}
                onClick={() => toggleGroup(column.groupKey)}
                title={`Expand ${column.label}`}
              >
                <ChevronRight size={16} />
                <strong>{column.label}</strong>
                <span>{column.count} hidden</span>
              </button>
            ) : (
              <div
                className={`excel-cell criterion-column ${toneClassForItem(column.item)}`}
                role="columnheader"
                key={`${column.item.title}-${index}`}
              >
                <strong>{column.item.module || column.item.type}</strong>
                <span>{cleanCriterionTitle(column.item.title)}</span>
              </div>
            )
          )}
        </div>

        {sortedTrackers.map((tracker) => {
          return (
            <div
              className="excel-row excel-data-row"
              key={tracker.id}
              role="row"
              tabIndex={0}
              onClick={() => onSelectStudent(tracker.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  onSelectStudent(tracker.id);
                }
              }}
            >
              <div className="excel-cell sticky-name student-name-cell">
                <strong>{tracker.name}</strong>
                <span>{tracker.email || "No email"}</span>
              </div>
              <div className="excel-cell summary-cell">
                <StatusBadge status={tracker.approvalStatus} />
              </div>
              <SummaryScoreCell completed={tracker.completedRequired} total={tracker.requiredTotal} />
              <SummaryScoreCell completed={tracker.completedExtra} total={tracker.extraTotal} />
              {columns.map((column, index) => {
                if (column.kind === "group") {
                  const groupItems = tracker.items.filter(
                    (item) => selectedTypes.has(item.type) && groupKeyForItem(item) === column.groupKey
                  );
                  const passed = groupItems.filter((item) => item.passed).length;

                  return (
                    <div
                      className={`excel-cell score-cell collapsed-score ${toneClassForItem(column)}`}
                      key={`${tracker.id}-${column.groupKey}-${index}`}
                      title={`${column.label}: ${passed}/${groupItems.length}`}
                    >
                      <strong>
                        {passed}/{groupItems.length}
                      </strong>
                      <span>collapsed</span>
                    </div>
                  );
                }

                const item = tracker.items[column.criterionIndex];
                return (
                  <div
                    className={`excel-cell score-cell ${toneClassForItem(item)} ${
                      item.missing ? "empty" : item.passed ? "pass" : "fail"
                    }`}
                    key={`${tracker.id}-${item.title}-${index}`}
                    title={`${cleanCriterionTitle(item.title)}: ${formatPercent(item.percent)}`}
                  >
                    <strong>{formatPercent(item.percent)}</strong>
                    <span>{item.rawScore === null ? "-" : `${item.rawScore}/${item.possiblePoints ?? "-"}`}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}

function SummaryScoreCell({ completed, total }) {
  const percent = total > 0 ? (completed / total) * 100 : null;
  return (
    <div className="excel-cell summary-cell summary-score-cell">
      <strong>{formatPercent(percent)}</strong>
      <span>
        {completed}/{total}
      </span>
    </div>
  );
}

function toneClassForItem(item) {
  if (item.type === "Test") {
    return "tone-test";
  }
  if (item.required === "Required") {
    if (isBlockTwoRequiredItem(item)) {
      return "tone-required-block-two";
    }
    return "tone-required";
  }
  return "tone-other";
}

function isBlockTwoRequiredItem(item) {
  return item.required === "Required" && (blockTwoRequiredModules.has(item.module) || item.module === "M04");
}

function blockKeyForColumn(column) {
  if (column.kind !== "criterion") {
    return "";
  }
  if (column.item.type === "Test") {
    return "four";
  }
  if (column.item.required === "Extra Point") {
    return "three";
  }
  if (column.item.required === "Required") {
    return isBlockTwoRequiredItem(column.item) ? "two" : "one";
  }
  return "";
}

function buildBlockColumns(columns) {
  const labels = {
    one: "Bloque I (deadline 14/5)",
    two: "Bloque II (deadline end of semester)",
    three: "Bloque III - Challenge Labs with Extra Point",
    four: "Bloque IV - Multiple Choice Questions"
  };

  return columns.reduce((blocks, column) => {
    const key = blockKeyForColumn(column);
    const previousBlock = blocks[blocks.length - 1];

    if (previousBlock?.key === key) {
      previousBlock.columnCount += 1;
      return blocks;
    }

    blocks.push({
      key,
      label: labels[key] || "",
      columnCount: 1
    });
    return blocks;
  }, []);
}

function compareTrackerScore(left, right, scoreKey, totalKey, direction) {
  const leftRatio = left[totalKey] ? left[scoreKey] / left[totalKey] : 0;
  const rightRatio = right[totalKey] ? right[scoreKey] / right[totalKey] : 0;
  const ratioDiff = leftRatio - rightRatio;
  const countDiff = left[scoreKey] - right[scoreKey];

  return (ratioDiff || countDiff) * direction;
}

function groupKeyForItem(item) {
  if (item.type === "Test") {
    return "test";
  }
  if (item.required === "Required") {
    return "required";
  }
  return "extra";
}

function groupLabelForKey(key) {
  return {
    required: "Required",
    extra: "Extra",
    test: "Tests"
  }[key];
}

function GroupToggle({ collapsed, count, label, tone, onClick }) {
  const Icon = collapsed ? ChevronRight : ChevronDown;
  return (
    <button
      className={`group-toggle group-${tone} ${collapsed ? "collapsed" : ""}`}
      disabled={count === 0}
      type="button"
      onClick={onClick}
      title={`${collapsed ? "Expand" : "Collapse"} ${label}`}
    >
      <Icon size={16} />
      <span>{label}</span>
      <strong>{count}</strong>
    </button>
  );
}

function CombinedSortButton({ active, direction, onClick }) {
  const Icon = direction === "asc" ? ArrowUpNarrowWide : ArrowDownWideNarrow;
  return (
    <button
      className={`combined-sort-button ${active ? "active" : ""}`}
      type="button"
      onClick={onClick}
      title="Sort students by Required, then Extra"
    >
      <Icon size={16} />
      <span>Sort</span>
      <strong>Required + Extra</strong>
    </button>
  );
}

function SortableHeader({ active, direction, label, onClick }) {
  const Icon = direction === "asc" ? ArrowUpNarrowWide : ArrowDownWideNarrow;
  return (
    <button
      className={`excel-cell summary-cell sortable-header ${active ? "active" : ""}`}
      role="columnheader"
      type="button"
      onClick={onClick}
      title={`Sort by ${label}`}
    >
      <span>{label}</span>
      {active ? <Icon size={15} /> : null}
    </button>
  );
}

function Metric({ label, value, tone = "neutral" }) {
  return (
    <div className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({ status, large = false }) {
  const approved = status === "Approved";
  const Icon = approved ? CheckCircle2 : AlertCircle;
  return (
    <span className={`status-badge ${approved ? "approved" : "pending"} ${large ? "large" : ""}`}>
      <Icon size={large ? 20 : 16} />
      {status}
    </span>
  );
}

function ResultBadge({ item }) {
  if (item.missing) {
    return <span className="result-badge missing">Missing</span>;
  }
  if (item.threshold === null) {
    return <span className="result-badge done">Recorded</span>;
  }
  return (
    <span className={`result-badge ${item.passed ? "done" : "low"}`}>
      {item.passed ? "Passed" : `Below ${item.threshold}%`}
    </span>
  );
}

createRoot(document.getElementById("root")).render(<App />);
