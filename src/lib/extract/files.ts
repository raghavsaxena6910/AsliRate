import type { ReadInput, ReadMethod } from "./read-quote";

/**
 * Turn an uploaded quote file into text lines (and rows for spreadsheets).
 * Runs on our server only; no outside service sees the file.
 */

import { extensionOf, kindOf } from "./file-types";

export { extensionOf, kindOf, kindLabel, mimeFor, ACCEPTED_EXTENSIONS, type FileKind } from "./file-types";

export interface FileText {
  input: ReadInput;
  method: ReadMethod;
  /** Why we couldn't read it automatically, in plain language (null when read). */
  problem: string | null;
}

const splitLines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

function cellText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v.trim();
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    const o = v as { richText?: { text: string }[]; text?: string; result?: unknown; hyperlink?: string };
    if (o.richText) return o.richText.map((r) => r.text).join("").trim();
    if (o.result !== undefined) return cellText(o.result);
    if (o.text) return String(o.text).trim();
  }
  return String(v).trim();
}

/** Minimal CSV parser that understands quoted fields. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }
  return rows.filter((r) => r.some(Boolean));
}

const rowsToLines = (rows: string[][]) => rows.map((r) => r.filter(Boolean).join(" | ")).filter(Boolean);

export async function fileToText(name: string, mime: string | null, bytes: ArrayBuffer): Promise<FileText> {
  const kind = kindOf(name, mime);
  const empty = (method: ReadMethod, problem: string): FileText => ({ input: { lines: [] }, method, problem });

  try {
    switch (kind) {
      case "pdf": {
        const { extractText, getDocumentProxy } = await import("unpdf");
        const pdf = await getDocumentProxy(new Uint8Array(bytes));
        const { text } = await extractText(pdf, { mergePages: true });
        const lines = splitLines(text);
        if (lines.join("").replace(/\s/g, "").length < 40) {
          return empty("manual", "This PDF looks like a scanned image, so there's no text to read. Type the numbers from it below.");
        }
        return { input: { lines }, method: "pdf", problem: null };
      }
      case "excel": {
        const ExcelJS = (await import("exceljs")).default;
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(bytes);
        const rows: string[][] = [];
        wb.worksheets.slice(0, 3).forEach((ws) => {
          ws.eachRow({ includeEmpty: false }, (row) => {
            const vals = (row.values as unknown[]).slice(1).map(cellText);
            if (vals.some(Boolean)) rows.push(vals);
          });
        });
        if (!rows.length) return empty("manual", "This spreadsheet looks empty. Type the numbers from the quote below.");
        return { input: { lines: rowsToLines(rows), rows }, method: "excel", problem: null };
      }
      case "csv": {
        const rows = parseCsv(new TextDecoder().decode(bytes));
        return { input: { lines: rowsToLines(rows), rows }, method: "csv", problem: null };
      }
      case "word": {
        const mammoth = await import("mammoth");
        const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
        return { input: { lines: splitLines(value) }, method: "word", problem: null };
      }
      case "text":
        return { input: { lines: splitLines(new TextDecoder().decode(bytes)) }, method: "text", problem: null };
      case "image":
        return empty(
          "manual",
          "Photos and screenshots can't be read automatically yet. Look at the image and type the numbers below; it takes about a minute.",
        );
      default: {
        const ext = extensionOf(name);
        const hint =
          ext === "xls" ? " Save it as .xlsx in Excel and upload again, or" : ext === "doc" ? " Save it as .docx and upload again, or" : "";
        return empty("manual", `We can't read this file type automatically.${hint} type the numbers below.`);
      }
    }
  } catch {
    return empty("manual", "We couldn't open this file. Check it opens on your computer, or type the numbers below.");
  }
}
