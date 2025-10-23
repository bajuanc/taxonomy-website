# === Canonical strings (one source of truth) ===

OBJECTIVE_MEO = "Multiple environmental objectives"

# Subset común de objetivos (ajústalo si añades más)
ENV_OBJECTIVES = [
    "Climate mitigation",
    "Climate adaptation",
    "Water",
    "Biodiversity",
    "Circular economy",
    "Pollution prevention",
    OBJECTIVE_MEO,
]

# Screening / Criteria types
SC_TYPE_THRESHOLD = "threshold"
SC_TYPE_TRAFFIC = "traffic_light"

SC_CRITERIA_TYPES = [SC_TYPE_THRESHOLD, SC_TYPE_TRAFFIC]

# Practice levels (orden visual sugerido en el frontend)
PRACTICE_LEVEL_BASIC = "basic"
PRACTICE_LEVEL_INTERMEDIATE = "intermediate"
PRACTICE_LEVEL_ADVANCED = "advanced"
PRACTICE_LEVEL_ADDITIONAL_GREEN = "Additional eligible green practices"
PRACTICE_LEVEL_AMBER = "amber"
PRACTICE_LEVEL_RED = "red"

PRACTICE_LEVELS = [
    PRACTICE_LEVEL_BASIC,
    PRACTICE_LEVEL_INTERMEDIATE,
    PRACTICE_LEVEL_ADVANCED,
    PRACTICE_LEVEL_ADDITIONAL_GREEN,
    PRACTICE_LEVEL_AMBER,
    PRACTICE_LEVEL_RED,
]

# Orden sugerido para render (acordeones)
PRACTICE_LEVEL_ORDER = [
    PRACTICE_LEVEL_BASIC,
    PRACTICE_LEVEL_INTERMEDIATE,
    PRACTICE_LEVEL_ADVANCED,
    PRACTICE_LEVEL_ADDITIONAL_GREEN,
    PRACTICE_LEVEL_AMBER,
    PRACTICE_LEVEL_RED,
]

# Rwanda Adaptation enums
RW_TYPE_ADAPTED = "Adapted"
RW_TYPE_ADAPTING = "Adapting"
RW_TYPE_ENABLING = "Enabling"
RW_TYPES = [RW_TYPE_ADAPTED, RW_TYPE_ADAPTING, RW_TYPE_ENABLING]

RW_LEVEL_ACTIVITY = "Activity"
RW_LEVEL_MEASURE = "Measure"
RW_LEVELS = [RW_LEVEL_ACTIVITY, RW_LEVEL_MEASURE]

RW_CRITERIA_PROCESS = "Process-based"
RW_CRITERIA_QUANT = "Quantitative"
RW_CRITERIA_QUAL = "Qualitative"
RW_CRITERIA_WHITE = "Whitelist"
RW_CRITERIA_TYPES = [RW_CRITERIA_PROCESS, RW_CRITERIA_QUANT, RW_CRITERIA_QUAL, RW_CRITERIA_WHITE]


# === Helpers canónicos (para centralizar lógica condicional) ===

def is_meo(objective: str) -> bool:
    """Devuelve True si el objetivo es Multiple environmental objectives (MEO)."""
    return (objective or "").strip() == OBJECTIVE_MEO


def is_traffic(sc_type: str) -> bool:
    return (sc_type or "").strip() == SC_TYPE_TRAFFIC


def is_threshold(sc_type: str) -> bool:
    return (sc_type or "").strip() == SC_TYPE_THRESHOLD


# === Opcional: Choices para modelos Django (si quieres usar choices=...) ===

DJANGO_SC_CRITERIA_CHOICES = [(v, v) for v in SC_CRITERIA_TYPES]
DJANGO_PRACTICE_LEVEL_CHOICES = [(v, v) for v in PRACTICE_LEVELS]
DJANGO_RW_TYPE_CHOICES = [(v, v) for v in RW_TYPES]
DJANGO_RW_LEVEL_CHOICES = [(v, v) for v in RW_LEVELS]
DJANGO_RW_CRITERIA_CHOICES = [(v, v) for v in RW_CRITERIA_TYPES]
