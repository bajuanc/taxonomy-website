
import { OBJECTIVE_MEO, SC_TYPE_THRESHOLD, SC_TYPE_TRAFFIC } from "../constants/taxonomy";

export function decideColumns(objective, scType) {
  const o = (objective || "").trim();
  const sc = (scType || "").trim();
  const isMeo = o === OBJECTIVE_MEO;

  if (sc === SC_TYPE_TRAFFIC) {
    return { mode: "traffic", useMeo: isMeo, columns: isMeo ? "green/amber/red_practices" : "sc_criteria_*" };
  }
  if (sc === SC_TYPE_THRESHOLD) {
    return { mode: "threshold", useMeo: isMeo, columns: isMeo ? "practice + eligible/non_eligible" : "substantial/non_eligibility" };
  }
  return { mode: "unknown", useMeo: isMeo, columns: "" };
}
