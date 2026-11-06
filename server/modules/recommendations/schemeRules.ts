// One rule per livelihood / credit / skill scheme (entitlements come from the open
// entitlement gaps instead). A rule says how well the scheme fits a Didi, from her
// income sources, category and special status. Text goes through msg() so it is in
// the request's language; the English lives in server/shared/messages.en.json.
import { msg } from "../../shared/i18n.ts"
import type { Fit, Profile, Rule, SourceKind } from "./types.ts"

const docs = (...extra: string[]) => [msg("आधार"), msg("पासबुक"), msg("फोटो"), ...extra]
const has = (p: Profile, ...kinds: SourceKind[]) => kinds.some((kind) => p.kinds.has(kind))
const tribal = (p: Profile) => p.category === "ST" || p.category === "SC"
/** Field checks that no record can confirm in advance. */
const siteCheck = (): [boolean, string] => [false, msg("स्थल सत्यापन बाकी")]
const confirmed = (text: string): [boolean, string] => [true, msg(text)]

const withBoost = (base: number, ...boosts: [boolean, number][]) =>
  base + boosts.reduce((sum, [on, points]) => sum + (on ? points : 0), 0)

export const rules: Rule[] = [
  {
    code: "AH_POULTRY",
    gain: 36_000,
    fit: (p): Fit => ({
      score: withBoost(
        60,
        [!has(p, "livestock"), 15],
        [p.activeSources < 2, 10],
        [p.income < 90_000, 5],
      ),
      why: has(p, "livestock")
        ? msg("पशुपालन का अनुभव है — कुक्कुट इकाई से आय बढ़ेगी")
        : msg("कुक्कुट पालन से नया नियमित आय स्रोत जुड़ेगा"),
      checks: [confirmed("SHG सदस्य"), confirmed("ग्रामीण परिवार"), siteCheck()],
      docs: docs(msg("SHG प्रस्ताव")),
      office: msg("पशु चिकित्सा अधिकारी, {{block}}", { block: p.block }),
    }),
  },
  {
    code: "AH_GOAT",
    gain: 45_000,
    fit: (p) =>
      has(p, "livestock", "farming", "forest")
        ? {
            score: withBoost(
              55,
              [has(p, "livestock"), 20],
              [tribal(p), 5],
              [p.activeSources < 2, 8],
            ),
            why: has(p, "livestock")
              ? msg("पशुपालन का अनुभव है — बकरी इकाई से आय बढ़ेगी")
              : msg("खेती/वन क्षेत्र में चराई उपलब्ध — बकरी पालन उपयुक्त"),
            checks: [
              confirmed("SHG सदस्य"),
              [has(p, "livestock"), msg("पशुपालन का अनुभव")],
              siteCheck(),
            ],
            docs: docs(msg("भूमि सहमति")),
            office: msg("पशुधन विकास विभाग, {{block}}", { block: p.block }),
          }
        : null,
  },
  {
    code: "FISH_OWNPOND",
    gain: 40_000,
    fit: (p) =>
      has(p, "farming") && !has(p, "fisheries")
        ? {
            score: withBoost(58, [p.income >= 60_000, 8], [p.activeSources < 3, 4]),
            why: msg("खेती के साथ निजी तालाब से मत्स्य आय जुड़ सकती है"),
            checks: [confirmed("कृषि आय स्रोत"), [false, msg("तालाब योग्य भूमि का सत्यापन बाकी")]],
            docs: docs(msg("तालाब पट्टा")),
            office: msg("सहायक संचालक मत्स्य, {{block}}", { block: p.block }),
          }
        : null,
  },
  {
    code: "PMMSY_POND",
    gain: 37_500,
    fit: (p) =>
      has(p, "fisheries", "farming")
        ? {
            score: withBoost(52, [has(p, "fisheries"), 20], [tribal(p), 5]),
            why: has(p, "fisheries")
              ? msg("मत्स्य पालन का अनुभव है — PMMSY से तालाब का उन्नयन")
              : msg("PMMSY से तालाब बनाकर मत्स्य पालन शुरू कर सकती हैं"),
            checks: [
              confirmed("बैंक खाता"),
              [has(p, "fisheries"), msg("मत्स्य पालन का अनुभव")],
              siteCheck(),
            ],
            docs: docs(msg("तालाब पट्टा")),
            office: msg("सहायक संचालक मत्स्य, {{block}}", { block: p.block }),
          }
        : null,
  },
  {
    code: "FISH_BOATNET",
    gain: 30_000,
    fit: (p) =>
      has(p, "fisheries")
        ? {
            score: withBoost(78, [p.activeSources < 3, 4]),
            why: msg("मत्स्य आय है — नाव/जाल पर 60% अनुदान से लागत घटेगी"),
            checks: [confirmed("मत्स्य आय स्रोत"), siteCheck()],
            docs: docs(msg("मत्स्य समिति पत्र")),
            office: msg("सहायक संचालक मत्स्य, {{block}}", { block: p.block }),
          }
        : null,
  },
  {
    code: "LAC",
    gain: 25_000,
    fit: (p) =>
      has(p, "forest")
        ? {
            score: withBoost(68, [p.special === "FRA", 8], [p.special === "PVTG", 8]),
            why: msg("वन उपज संग्रह की आय है — लाख पालन से मूल्य बढ़ेगा"),
            checks: [
              confirmed("वन उपज आय स्रोत"),
              [p.special !== "NONE", msg("FRA / PVTG अधिकारधारी")],
            ],
            docs: docs(msg("FRA पट्टा")),
            office: msg("वन परिक्षेत्र अधिकारी, {{block}}", { block: p.block }),
          }
        : null,
  },
  {
    code: "VANDHAN",
    gain: 30_000,
    fit: (p) =>
      has(p, "forest") || p.special !== "NONE"
        ? {
            score: withBoost(
              has(p, "forest") ? 72 : 55,
              [p.special === "FRA", 8],
              [p.special === "PVTG", 8],
            ),
            why: has(p, "forest")
              ? msg("वन उपज संग्रह की आय है — वन धन केंद्र से बेहतर दाम")
              : msg("FRA/PVTG अधिकार — वन धन केंद्र से जुड़कर आय बढ़ा सकती हैं"),
            checks: [
              [has(p, "forest"), msg("वन उपज संग्रह")],
              [p.special !== "NONE", msg("FRA / PVTG अधिकारधारी")],
              siteCheck(),
            ],
            docs: docs(msg("FRA पट्टा")),
            office: msg("वन धन केंद्र, {{block}}", { block: p.block }),
          }
        : null,
  },
  {
    code: "NHM_MICRO",
    gain: 30_000,
    fit: (p) =>
      has(p, "farming", "horticulture")
        ? {
            score: withBoost(66, [has(p, "horticulture"), 10], [p.income >= 50_000, 3]),
            why: msg("खेती है — सूक्ष्म सिंचाई (55% अनुदान) से उपज और आय बढ़ेगी"),
            checks: [
              confirmed("कृषि आय स्रोत"),
              confirmed("आधार-बैंक लिंक"),
              [false, msg("जल स्रोत और B1-P2 का सत्यापन बाकी")],
            ],
            docs: docs(msg("B1-P2")),
            office: msg("उद्यानिकी विकास अधिकारी, {{block}}", { block: p.block }),
          }
        : null,
  },
  {
    code: "MUDRA",
    gain: 40_000,
    fit: (p) =>
      has(p, "nonfarm") || p.activeSources >= 2
        ? {
            score: withBoost(has(p, "nonfarm") ? 70 : 50, [p.income >= 60_000, 4]),
            why: has(p, "nonfarm")
              ? msg("उद्यम चल रहा है — मुद्रा ऋण से कार्यशील पूँजी मिलेगी")
              : msg("एक से अधिक आय स्रोत — छोटे उद्यम के लिए मुद्रा ऋण संभव"),
            checks: [confirmed("बैंक खाता"), [has(p, "nonfarm"), msg("चालू उद्यम")]],
            docs: docs(msg("उद्यम विवरण")),
            office: msg("बैंक शाखा / बैंक सखी, {{block}}", { block: p.block }),
          }
        : null,
  },
  {
    code: "PMEGP",
    gain: 60_000,
    fit: (p) =>
      has(p, "nonfarm")
        ? {
            score: withBoost(80, [p.income >= 60_000, 3]),
            why: msg("उद्यम चल रहा है — PMEGP से 35% अनुदान पर विस्तार"),
            checks: [confirmed("गैर-कृषि उद्यम"), confirmed("बैंक खाता"), siteCheck()],
            docs: docs(msg("उद्यम विवरण")),
            office: msg("जिला उद्योग केंद्र (DTIC)", {}),
          }
        : null,
  },
  {
    code: "TRIBAL_SELF",
    gain: 45_000,
    fit: (p) =>
      p.category === "ST"
        ? {
            score: withBoost(62, [p.special === "PVTG", 8], [p.special === "FRA", 4]),
            why: msg("ST वर्ग — आदिवासी स्वरोजगार योजना में 50% अनुदान"),
            checks: [confirmed("ST श्रेणी"), confirmed("बैंक खाता"), siteCheck()],
            docs: docs(msg("जाति प्रमाण पत्र")),
            office: msg("आदिवासी विकास विभाग, {{block}}", { block: p.block }),
          }
        : null,
  },
  {
    code: "HANDLOOM_SHED",
    gain: 35_000,
    fit: (p) =>
      has(p, "nonfarm")
        ? {
            score: 55,
            why: msg("उद्यम चल रहा है — बुनकर वर्कशेड से उत्पादन बढ़ेगा"),
            checks: [confirmed("गैर-कृषि उद्यम"), siteCheck()],
            docs: docs(msg("उद्यम विवरण")),
            office: msg("हथकरघा विभाग, {{block}}", { block: p.block }),
          }
        : null,
  },
  {
    code: "SERI_TRAIN",
    gain: 24_000,
    fit: (p) =>
      has(p, "wage", "migration")
        ? {
            score: withBoost(58, [p.category === "ST", 5]),
            why: msg("मजदूरी पर निर्भर — रेशम प्रशिक्षण से कुशल आय का रास्ता"),
            checks: [confirmed("मजदूरी आय स्रोत"), siteCheck()],
            docs: docs(),
            office: msg("रेशम विभाग, {{block}}", { block: p.block }),
          }
        : null,
  },
  {
    code: "CG_HOMESTAY",
    gain: 60_000,
    fit: (p) =>
      has(p, "tourism")
        ? {
            score: 85,
            why: msg("पर्यटन से आय है — होम-स्टे से स्थायी आय संभव"),
            checks: [confirmed("पर्यटन आय स्रोत"), siteCheck()],
            docs: docs(msg("मकान स्वामित्व")),
            office: msg("पर्यटन विभाग, {{block}}", { block: p.block }),
          }
        : null,
  },
]

export const ruleFor = (code: string) => rules.find((rule) => rule.code === code)
