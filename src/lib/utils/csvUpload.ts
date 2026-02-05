export const validateCsvFile = (
  file: File
): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5mb

  if (file.size > maxSize) {
    return { valid: false, error: "file size exceeds 5mb limit" };
  }

  if (!file.name.endsWith(".csv")) {
    return { valid: false, error: "only csv files are allowed" };
  }

  return { valid: true };
};

export const validateCsvHeaders = (
  headers: string[],
  requiredHeaders: string[]
): { valid: boolean; error?: string } => {
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());
  const missingHeaders = requiredHeaders.filter(
    (h) => !normalizedHeaders.includes(h.toLowerCase())
  );

  if (missingHeaders.length > 0) {
    return {
      valid: false,
      error: `missing required headers: ${missingHeaders.join(", ")}`,
    };
  }

  return { valid: true };
};

export const parseCsvContent = (
  content: string
): { headers: string[]; rows: string[][] } => {
  const lines = content.split("\n").filter((line) => line.trim());
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => line.split(",").map((cell) => cell.trim()));

  return { headers, rows };
};
