import { useState } from "react"

import { Icon } from "@/components/ui/Icon"

export function AdminGeography({ onNotify }: { onNotify: (message: string) => void }) {
  const [open, setOpen] = useState(["बस्तर", "जगदलपुर", "बड़ांजी GP"])
  const toggle = (item: string) =>
    setOpen(open.includes(item) ? open.filter((value) => value !== item) : [...open, item])
  return (
    <section className="card geography-admin">
      <div className="card-head">
        <div>
          <h3>भूगोल मास्टर</h3>
          <p>जिला → ब्लॉक → GP → गाँव</p>
        </div>
        <button className="primary" onClick={() => onNotify("LokOS आयात शुरू हुआ")}>
          <Icon name="download" size={14} /> LokOS से SHG/VO/CLF आयात
        </button>
      </div>
      <div className="geo-tree">
        <button className="level district" onClick={() => toggle("बस्तर")}>
          <Icon name="chevron" size={14} />
          <strong>बस्तर जिला</strong>
          <span>7 ब्लॉक</span>
        </button>
        {open.includes("बस्तर") && (
          <div>
            <button className="level block" onClick={() => toggle("जगदलपुर")}>
              <Icon name="chevron" size={14} />
              <strong>जगदलपुर ब्लॉक</strong>
              <span>68 GP</span>
            </button>
            {open.includes("जगदलपुर") && (
              <div>
                <button className="level gp" onClick={() => toggle("बड़ांजी GP")}>
                  <Icon name="chevron" size={14} />
                  <strong>बड़ांजी GP</strong>
                  <span>5 गाँव</span>
                </button>
                {open.includes("बड़ांजी GP") && (
                  <div>
                    {["बड़ांजी", "नानगुर", "धुरगुड़ा", "आड़ावाल", "कुम्हरावंड"].map((village) => (
                      <button className="level village" key={village}>
                        <Icon name="map" size={13} />
                        <strong>{village}</strong>
                        <span>12 SHG • 2 VO</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button className="level block">
              <Icon name="chevron" size={14} />
              <strong>बकावंड ब्लॉक</strong>
              <span>52 GP</span>
            </button>
            <button className="level block">
              <Icon name="chevron" size={14} />
              <strong>तोकापाल ब्लॉक</strong>
              <span>43 GP</span>
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
