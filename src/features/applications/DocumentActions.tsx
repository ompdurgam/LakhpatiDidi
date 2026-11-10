import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"
import { printDocument } from "@/lib/print"

/**
 * Print and Download buttons for the mounted application document. Download opens
 * the same dialog where the person picks "Save as PDF" (the browser shapes Hindi
 * text correctly, which PDF libraries do not), with the file named after the code.
 */
export function DocumentActions({ code }: { code: string }) {
  const tr = useTr()
  return (
    <div className="document-actions">
      <button type="button" className="secondary" onClick={() => printDocument(code)}>
        <Icon name="file" size={15} /> {tr("प्रिंट करें")}
      </button>
      <button type="button" className="primary" onClick={() => printDocument(code)}>
        <Icon name="download" size={15} /> {tr("PDF डाउनलोड")}
      </button>
      <small>{tr("डाउनलोड के लिए प्रिंट विंडो में “PDF के रूप में सेव करें” चुनें")}</small>
    </div>
  )
}
