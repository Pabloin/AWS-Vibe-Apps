export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function normalizeTitle(value) {
  return value
    .replace(/^\s+|\s+$/g, "")
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function parseNumber(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized === "(read only)") {
    return null;
  }
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function csvToGradebook(text) {
  const rows = parseCsv(text);
  const headers = rows[0] ?? [];
  const pointsRow = rows.find((row) => row[0]?.trim() === "Points Possible") ?? [];
  const students = rows
    .slice(2)
    .filter((row) => row[0]?.trim())
    .map((row) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = row[index] ?? "";
      });
      return record;
    });

  const pointsByTitle = new Map();
  headers.forEach((header, index) => {
    const points = parseNumber(pointsRow[index]);
    if (points !== null) {
      pointsByTitle.set(normalizeTitle(header), points);
    }
  });

  return { headers, students, pointsByTitle };
}
