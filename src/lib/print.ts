/**
 * Opens the browser's print dialog for the mounted `.print-root` document.
 * The page title becomes the suggested file name when the person picks
 * "Save as PDF", so a download is named after the application (APP-2026-0012.pdf).
 */
export function printDocument(fileName: string) {
  const previous = document.title
  document.title = fileName
  const restore = () => {
    document.title = previous
    window.removeEventListener("afterprint", restore)
  }
  window.addEventListener("afterprint", restore)
  window.print()
}
