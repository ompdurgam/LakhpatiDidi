/** One CSV line: every cell quoted, quotes doubled. */
export const csvLine = (cells: readonly (string | number)[]) =>
  cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
