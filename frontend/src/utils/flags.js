// frontend/src/utils/flags.js
const NAME_TO_ISO2 = {

  "rwanda": "RW",
  "thailand": "TH",
  "panama": "PA",
  "panamá": "PA",
  "costa rica": "CR",
  "european union": "EU",
  "europe": "EU",
  "colombia": "CO",
  "pakistan": "PK",
  "dominican republic": "DO",
  "república dominicana": "DO",
  
};

const norm = (v) => (v ? String(v).trim().toLowerCase() : "");

export function getFlagCodeFromAny(taxonomy) {
  // 1) country_code directo si parece ISO2 (2 letras)
  const direct = taxonomy?.country_code;
  if (direct && String(direct).trim().length === 2) {
    return String(direct).trim().toUpperCase();
  }

  // 2) Intentar por 'country'
  const byCountry = NAME_TO_ISO2[norm(taxonomy?.country)];
  if (byCountry) return byCountry;

  // 3) Intentar por 'name' (por ej. "Rwanda Adaptation")
  const name = norm(taxonomy?.name);
  if (name) {
    for (const key of Object.keys(NAME_TO_ISO2)) {
      if (name.includes(key)) return NAME_TO_ISO2[key];
    }
  }

  // 4) Intentar por 'region' si es Europa / EU
  const region = norm(taxonomy?.region);
  if (region.includes("eu") || region === "europe") return "EU";

  // 5) Sin bandera
  return "";
}
