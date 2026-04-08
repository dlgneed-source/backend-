type CsvPrimitive = string | number | boolean | null | undefined;
type CsvRow = Record<string, CsvPrimitive>;

const CSV_FORMULA_PREFIX = /^[=+\-@]/;

export function sanitizeCsvCell(value: CsvPrimitive): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const formulaSafe = CSV_FORMULA_PREFIX.test(raw) ? `\t${raw}` : raw;
  return `"${formulaSafe.replace(/"/g, '""')}"`;
}

export function buildCsv(rows: CsvRow[], headers?: string[]): string {
  if (rows.length === 0) {
    return '';
  }

  const resolvedHeaders = headers && headers.length > 0
    ? headers
    : Array.from(rows.reduce((set, row) => {
        Object.keys(row).forEach((key) => set.add(key));
        return set;
      }, new Set<string>()));

  return [
    resolvedHeaders.join(','),
    ...rows.map((row) => resolvedHeaders.map((header) => sanitizeCsvCell(row[header])).join(',')),
  ].join('\n');
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportCsv(filename: string, rows: CsvRow[], headers?: string[]): void {
  const csv = buildCsv(rows, headers);
  if (!csv) return;
  downloadCsv(filename, csv);
}
