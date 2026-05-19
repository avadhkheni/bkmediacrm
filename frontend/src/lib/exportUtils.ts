/**
 * Utility function to export data to a CSV file in a safe, robust manner
 * using Blob URLs. This avoids the limitations of encodeURI for large datasets
 * or strings with special characters like hashes, percent signs, etc.
 */
export const exportToCSV = (headers: string[], rows: any[][], filename: string) => {
  const csvContent = [
    headers.join(","),
    ...rows.map(row => 
      row.map(value => {
        const strValue = value === null || value === undefined ? "" : String(value);
        // Escape quotes and wrap in quotes if the value contains commas, quotes, or newlines
        if (/[",\n\r]/.test(strValue)) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      }).join(",")
    )
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
