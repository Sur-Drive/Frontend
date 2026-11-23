import { toast } from "@/lib/toast-store";

// Quote a CSV field when it contains a comma, quote or newline, and prefix a
// single quote to cells that could be read as a spreadsheet formula.
function escapeCell(value: string): string {
  let cell = value;
  if (/^[=+@-]/.test(cell)) {
    cell = `'${cell}`;
  }
  if (/[",\r\n]/.test(cell)) {
    cell = `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

export function toCsv(columns: string[], rows: (string | number)[][]): string {
  const lines = [columns, ...rows].map((row) =>
    row.map((cell) => escapeCell(String(cell))).join(","),
  );
  // Leading BOM so Excel renders the naira sign correctly.
  return `\uFEFF${lines.join("\r\n")}`;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success({
    title: "Export ready",
    description: `${filename} has been downloaded.`,
  });
}
