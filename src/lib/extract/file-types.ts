/** File-type helpers shared by the browser uploader and the server reader. No heavy imports. */

export type FileKind = "pdf" | "excel" | "csv" | "word" | "text" | "image" | "unsupported";

export const ACCEPTED_EXTENSIONS = [
  ".pdf", ".xlsx", ".csv", ".docx", ".txt", ".jpg", ".jpeg", ".png", ".webp", ".heic", ".xls", ".doc",
] as const;

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  csv: "text/csv",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  txt: "text/plain",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
};

export function extensionOf(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toLowerCase() : "";
}

export function mimeFor(name: string, given?: string | null): string {
  return MIME_BY_EXT[extensionOf(name)] ?? given ?? "application/octet-stream";
}

export function kindOf(name: string, mime?: string | null): FileKind {
  const ext = extensionOf(name);
  if (ext === "pdf" || mime === "application/pdf") return "pdf";
  if (ext === "xlsx") return "excel";
  if (ext === "csv" || mime === "text/csv") return "csv";
  if (ext === "docx") return "word";
  if (ext === "txt" || mime === "text/plain") return "text";
  if (["jpg", "jpeg", "png", "webp", "heic"].includes(ext) || mime?.startsWith("image/")) return "image";
  return "unsupported";
}

/** Short label for the review screen. */
export function kindLabel(kind: FileKind): string {
  return { pdf: "PDF", excel: "Excel", csv: "CSV", word: "Word", text: "Text", image: "Image", unsupported: "File" }[kind];
}
