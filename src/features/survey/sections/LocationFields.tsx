import { useContext, useState } from "react"

import { SurveyDraftContext } from "@/components/ui/draft"
import { FormGroup } from "@/components/ui/FormGroup"
import { Icon } from "@/components/ui/Icon"
import { SelectControl } from "@/components/ui/Select"
import { currentLanguage } from "@/i18n"
import { useTr } from "@/i18n/tr"
import { useSession } from "@/stores/session"

import type { SurveyHousehold } from "../surveyHouseholds"
import { useVillageOptions } from "../village/useVillageProfile"

/** Section A location: GPS from the device, and the Didi's district → village. */
export function LocationFields({
  household,
  onNotify,
}: {
  household?: SurveyHousehold
  onNotify: (message: string) => void
}) {
  const tr = useTr()
  // A Didi on record keeps her own place; a new one is placed in the surveyor's area.
  const scope = useSession((s) => s.user?.scope)
  const english = currentLanguage() === "en"
  const villages = useVillageOptions("").data ?? []
  const draft = useContext(SurveyDraftContext)
  const [gps, setGps] = useState<string>()
  const captureGps = () => {
    if (!navigator.geolocation) return onNotify(tr("इस डिवाइस पर GPS उपलब्ध नहीं"))
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const value = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)} • ±${Math.round(coords.accuracy)}m`
        setGps(value)
        if (draft) draft.GPS = value
      },
      () => onNotify(tr("GPS स्थान नहीं मिला — अनुमति जाँचें")),
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }
  return (
    <FormGroup title={tr("स्थान")}>
      <div className="gps-control">
        <Icon name="map" size={18} />
        <div>
          <strong>{gps ? tr("GPS कैप्चर हुआ") : tr("GPS अभी नहीं लिया गया")}</strong>
          <span>{gps ?? "—"}</span>
        </div>
        <button onClick={captureGps}>{gps ? tr("पुनः लें") : tr("GPS लें")}</button>
      </div>
      {household ? (
        <div className="control-grid">
          <SelectControl label="जिला" value={household.district} options={[household.district]} />
          <SelectControl label="ब्लॉक" value={household.block} options={[household.block]} />
          <SelectControl
            label="ग्राम पंचायत"
            value={household.panchayat}
            options={[household.panchayat]}
          />
          <SelectControl label="गाँव" value={household.village} options={[household.village]} />
        </div>
      ) : (
        <div className="control-grid">
          <SelectControl
            label="जिला"
            value={(english ? scope?.districtEn : scope?.districtHi) ?? ""}
            options={[(english ? scope?.districtEn : scope?.districtHi) ?? ""]}
          />
          <SelectControl
            label="ब्लॉक"
            value={(english ? scope?.blockEn : scope?.blockHi) ?? ""}
            options={[(english ? scope?.blockEn : scope?.blockHi) ?? ""]}
          />
          <SelectControl
            key={`gp-${villages.length}`}
            label="ग्राम पंचायत"
            value=""
            options={["", ...new Set(villages.map((v) => v.panchayat))]}
          />
          <SelectControl
            key={`village-${villages.length}`}
            label="गाँव"
            value=""
            options={["", ...villages.map((v) => v.name)]}
          />
        </div>
      )}
    </FormGroup>
  )
}
