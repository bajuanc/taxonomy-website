// frontend/src/constants/taxonomy.js

export const OBJECTIVE_MEO = "Multiple environmental objectives";

export const ENV_OBJECTIVES = [
  "Climate mitigation",
  "Climate adaptation",
  "Water",
  "Biodiversity",
  "Circular economy",
  "Pollution prevention",
  OBJECTIVE_MEO,
];

export const SC_TYPE_THRESHOLD = "threshold";
export const SC_TYPE_TRAFFIC = "traffic_light";
export const SC_CRITERIA_TYPES = [SC_TYPE_THRESHOLD, SC_TYPE_TRAFFIC];

export const PRACTICE_LEVEL_BASIC = "basic";
export const PRACTICE_LEVEL_INTERMEDIATE = "intermediate";
export const PRACTICE_LEVEL_ADVANCED = "advanced";
export const PRACTICE_LEVEL_ADDITIONAL_GREEN = "Additional eligible green practices";
export const PRACTICE_LEVEL_AMBER = "amber";
export const PRACTICE_LEVEL_RED = "red";

export const PRACTICE_LEVELS = [
  PRACTICE_LEVEL_BASIC,
  PRACTICE_LEVEL_INTERMEDIATE,
  PRACTICE_LEVEL_ADVANCED,
  PRACTICE_LEVEL_ADDITIONAL_GREEN,
  PRACTICE_LEVEL_AMBER,
  PRACTICE_LEVEL_RED,
];

export const PRACTICE_LEVEL_ORDER = [
  PRACTICE_LEVEL_BASIC,
  PRACTICE_LEVEL_INTERMEDIATE,
  PRACTICE_LEVEL_ADVANCED,
  PRACTICE_LEVEL_ADDITIONAL_GREEN,
  PRACTICE_LEVEL_AMBER,
  PRACTICE_LEVEL_RED,
];

// Rwanda adaptation enums
export const RW_TYPES = ["Adapted", "Adapting", "Enabling"];
export const RW_LEVELS = ["Activity", "Measure"];
export const RW_CRITERIA_TYPES = ["Process-based", "Quantitative", "Qualitative", "Whitelist"];
