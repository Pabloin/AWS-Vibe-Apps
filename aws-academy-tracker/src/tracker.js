import { REQUIRED_STATUS, criteria } from "./criteria.js";
import { normalizeTitle, parseNumber } from "./csv.js";

export const EXCLUDED_STUDENTS = new Set([
  "ALBERTO, MONZON NICOLAS",
  "Marquez, Mariano Andrade",
  "Ergas, Neyen",
  "Francisco Isola",
  "Isola, Francisco",
  "Student, Test"
]);

const EXCLUDED_STUDENT_EMAILS = new Set([
  "franciscoisola1@gmail.com"
]);

function isExcludedStudent(student) {
  const studentName = student.Student?.trim();
  const studentEmail = student["SIS Login ID"]?.trim().toLowerCase();

  return EXCLUDED_STUDENTS.has(studentName) || EXCLUDED_STUDENT_EMAILS.has(studentEmail);
}

function scorePercent(rawScore, possiblePoints) {
  if (rawScore === null || possiblePoints === null || possiblePoints <= 0) {
    return null;
  }
  return (rawScore / possiblePoints) * 100;
}

function resultForCriterion(student, criterion, pointsByTitle) {
  const normalizedTitle = normalizeTitle(criterion.title);
  const column = Object.keys(student).find((key) => normalizeTitle(key) === normalizedTitle);
  const rawScore = column ? parseNumber(student[column]) : null;
  const possiblePoints = pointsByTitle.get(normalizedTitle) ?? null;
  const percent = scorePercent(rawScore, possiblePoints);
  const isRequired = criterion.required === REQUIRED_STATUS.REQUIRED;
  const isExtraPoint = criterion.required === REQUIRED_STATUS.EXTRA_POINT;
  const passed = criterion.threshold === null ? rawScore !== null : percent !== null && percent >= criterion.threshold;

  return {
    ...criterion,
    column,
    rawScore,
    possiblePoints,
    percent,
    passed,
    missing: rawScore === null,
    countsForApproval: isRequired,
    countsForExtraPoint: isExtraPoint
  };
}

export function buildStudentTrackers(students, pointsByTitle) {
  return students.filter((student) => !isExcludedStudent(student)).map((student) => {
    const items = criteria.map((criterion) => resultForCriterion(student, criterion, pointsByTitle));
    const requiredItems = items.filter((item) => item.countsForApproval);
    const extraPointItems = items.filter((item) => item.countsForExtraPoint);
    const completedRequired = requiredItems.filter((item) => item.passed).length;
    const completedExtra = extraPointItems.filter((item) => item.passed).length;
    const requiredApproval = requiredItems.length > 0 && completedRequired === requiredItems.length;

    return {
      id: student.ID || student["SIS User ID"] || student.Student,
      name: student.Student,
      email: student["SIS Login ID"],
      section: student.Section,
      currentScore: parseNumber(student["Current Score"]),
      finalScore: parseNumber(student["Final Score"]),
      items,
      requiredItems,
      extraPointItems,
      completedRequired,
      completedExtra,
      requiredTotal: requiredItems.length,
      extraTotal: extraPointItems.length,
      missingRequired: requiredItems.filter((item) => !item.passed),
      approvalStatus: requiredApproval ? "Approved" : "Pending"
    };
  });
}

export function summarizeTrackers(trackers) {
  const approved = trackers.filter((tracker) => tracker.approvalStatus === "Approved").length;
  const pending = trackers.length - approved;
  const averageRequired =
    trackers.length === 0
      ? 0
      : trackers.reduce((total, tracker) => total + tracker.completedRequired / tracker.requiredTotal, 0) / trackers.length;

  return {
    total: trackers.length,
    approved,
    pending,
    averageRequired: averageRequired * 100
  };
}
