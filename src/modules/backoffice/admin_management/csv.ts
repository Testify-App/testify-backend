import { BadException } from '../shared/lib/errors';

const EXPECTED_HEADERS = ['first_name', 'last_name', 'email', 'phone_number', 'role_id'];
const MAX_ROWS = 500;

const normalizeHeader = (header: string): string => header.trim().toLowerCase().replace(/\s+/g, '_');

const parseLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
};

export interface ParsedInviteRow {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  role_id: string;
}

export const parseBulkInviteCSV = (input: Buffer | string): ParsedInviteRow[] => {
  const text = (typeof input === 'string' ? input : input.toString('utf-8')).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    throw new BadException('CSV file is empty.');
  }
  const headers = parseLine(lines[0]).map(normalizeHeader);
  const missing = EXPECTED_HEADERS.filter((expected) => !headers.includes(expected));
  if (missing.length > 0) {
    throw new BadException(`CSV is missing required column(s): ${missing.join(', ')}.`);
  }
  const dataRows = lines.slice(1);
  if (dataRows.length === 0) {
    throw new BadException('CSV file has no data rows.');
  }
  if (dataRows.length > MAX_ROWS) {
    throw new BadException(`CSV exceeds the maximum of ${MAX_ROWS} rows per upload.`);
  }
  return dataRows.map((line) => {
    const cells = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? '';
    });
    return {
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      phone_number: row.phone_number || undefined,
      role_id: row.role_id,
    };
  });
};
