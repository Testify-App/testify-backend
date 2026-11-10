/** Quotes a cell and neutralises spreadsheet formulas (CSV injection). */
const quoteCell = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : value instanceof Date ? value.toISOString() : `${value}`;
  const safe = /^[\t\r\n]|^\s*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};

export const toCsv = (header: string[], rows: unknown[][]): string => (
  [header, ...rows].map((row) => row.map(quoteCell).join(',')).join('\r\n')
);
