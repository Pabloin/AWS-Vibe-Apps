import { readFile, writeFile } from "node:fs/promises";

import { parseCsv } from "../src/csv.js";

const [sourcePath, outputPath] = process.argv.slice(2);

if (!sourcePath || !outputPath) {
  throw new Error("Usage: node scripts/anonymize-gradebook.mjs <source.csv> <output.csv>");
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function firstName(studentName) {
  const [leftPart = "", ...rightParts] = studentName.split(",");
  const left = leftPart.trim();
  const right = rightParts.join(",").trim();

  // AWS Academy normally exports "Given name, surname(s)". A few records use
  // a multi-word surname before the comma, or a numeric prefix, so use the
  // right-hand name only for those exceptional shapes.
  if (/^\d+$/.test(left) || (left.includes(" ") && right)) {
    return right.split(/\s+/)[0] || "Student";
  }

  return left.split(/\s+/)[0] || "Student";
}

function emailName(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z]/g, "")
    .toLowerCase() || "student";
}

const rows = parseCsv(await readFile(sourcePath, "utf8"));
const headers = rows[0] ?? [];
const studentIndex = headers.indexOf("Student");
const idIndex = headers.indexOf("ID");
const emailIndex = headers.indexOf("SIS Login ID");

if (studentIndex < 0 || idIndex < 0 || emailIndex < 0) {
  throw new Error("The CSV must include Student, ID, and SIS Login ID columns.");
}

let sequence = 0;
for (const row of rows.slice(2)) {
  if (!row[studentIndex]?.trim()) continue;

  sequence += 1;
  const number = String(sequence).padStart(3, "0");
  const name = firstName(row[studentIndex]);

  row[studentIndex] = `Student_${number}, ${name}`;
  row[idIndex] = `student_${number}`;
  row[emailIndex] = `student_${number}_${emailName(name)}@uni.edu.ar`;
}

const output = `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
await writeFile(outputPath, output, "utf8");

console.log(`Masked ${sequence} students in ${outputPath}`);
