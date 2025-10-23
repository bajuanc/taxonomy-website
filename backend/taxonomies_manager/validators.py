
from .constants import (
    ENV_OBJECTIVES,
    SC_CRITERIA_TYPES,
    PRACTICE_LEVELS,
    OBJECTIVE_MEO,
    SC_TYPE_TRAFFIC,
    SC_TYPE_THRESHOLD,
)

def norm(s: str) -> str:
    return (s or "").strip()

def validate_env_objective(obj: str) -> str:
    v = norm(obj)
    if v not in ENV_OBJECTIVES:
        raise ValueError(f"Invalid environmental_objective: '{obj}'. Allowed: {ENV_OBJECTIVES}")
    return v

def validate_sc_type(sc: str) -> str:
    v = norm(sc)
    if v not in SC_CRITERIA_TYPES:
        raise ValueError(f"Invalid sc_criteria_type: '{sc}'. Allowed: {SC_CRITERIA_TYPES}")
    return v

def validate_practice_level(level: str) -> str:
    v = norm(level)
    if v and v not in PRACTICE_LEVELS:
        raise ValueError(f"Invalid practice_level: '{level}'. Allowed: {PRACTICE_LEVELS}")
    return v

def decide_columns(objective: str, sc_type: str) -> dict:
    """
    Devuelve qué columnas deben usarse según la matriz acordada:
    - traffic_light + MEO => green/amber/red_practices
    - traffic_light + OTHER => sc_criteria_green/amber/red
    - threshold + MEO => practice_* + eligible/non_eligible_practices
    - threshold + OTHER => substantial_contribution_criteria / non_eligibility_criteria
    """
    o = norm(objective)
    sc = norm(sc_type)
    is_meo = (o == OBJECTIVE_MEO)
    if sc == SC_TYPE_TRAFFIC:
        return dict(mode="traffic", use_meo=is_meo, columns=("green/amber/red_practices" if is_meo else "sc_criteria_*"))
    elif sc == SC_TYPE_THRESHOLD:
        return dict(mode="threshold", use_meo=is_meo, columns=("practice + eligible/non_eligible" if is_meo else "substantial/non_eligibility"))
    else:
        raise ValueError(f"Unknown combination objective='{objective}' sc_type='{sc_type}'")
