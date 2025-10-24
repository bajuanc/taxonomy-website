# backend/taxonomies_manager/management/commands/import_db_taxonomies.py
import pandas as pd
from django.core.management.base import BaseCommand
from django.conf import settings
from taxonomies_manager.models import (
    Taxonomy, EnvironmentalObjective, Sector, Subsector,
    Activity, Practice, RwandaAdaptation,
    AdaptationWhitelist, AdaptationGeneralCriterion,
)
from taxonomies_manager.constants import OBJECTIVE_MEO


# -----------------------
# Helpers
# -----------------------
def to_str(val) -> str:
    if pd.isna(val):
        return ""
    return str(val).strip()

def norm_lower(val) -> str:
    return to_str(val).lower()

def pick(df_row, *names, default=""):
    """Devuelve el primer valor no vacío entre varios nombres de columna (case-insensitive)."""
    for n in names:
        key = str(n).strip().lower()
        if key in df_row and pd.notna(df_row[key]) and str(df_row[key]).strip():
            return str(df_row[key]).strip()
    return default

def synth_title(*parts, maxlen=120):
    """Genera un título corto a partir de la primera parte no vacía."""
    for p in parts:
        if p and str(p).strip():
            s = str(p).strip()
            return (s[: maxlen - 1] + "…") if len(s) > maxlen else s
    return "Untitled"

def warn(stdout, msg, counters):
    counters["warnings"] += 1
    stdout.write(f"⚠️  {msg}")

def norm_practice_level(val: object) -> str:
    if pd.isna(val):
        return ""
    s = str(val).strip().lower()
    aliases = {
        "basic": "basic", "básico": "basic", "basico": "basic",
        "intermediate": "intermediate", "intermedio": "intermediate",
        "advanced": "advanced", "avanzado": "advanced",
        "amber": "amber", "ámbar": "amber", "ambar": "amber",
        "red": "red",
        "additional eligible green practices": "additional eligible green practices",
        "additional green practices": "additional eligible green practices",
        "green additional": "additional eligible green practices",
        "adicionales elegibles verdes": "additional eligible green practices",
        "practicas verdes elegibles adicionales": "additional eligible green practices",
        "prácticas verdes elegibles adicionales": "additional eligible green practices",
    }
    cap = s.capitalize()
    if cap in ["Basic", "Intermediate", "Advanced", "Amber", "Red"]:
        return cap.lower()
    return aliases.get(s, s)

ALLOWED_PRACTICE_LEVELS = {
    "basic",
    "intermediate",
    "advanced",
    "additional eligible green practices",
    "amber",
    "red",
}

# -----------------------
# Command
# -----------------------
class Command(BaseCommand):
    help = "Importa taxonomías desde Excel (hoja principal, Rwanda_Adaptation y Caso2/Caso3)."

    # ---- args
    def add_arguments(self, parser):
        parser.add_argument("--file", type=str, help="Ruta del Excel. Por defecto: backend/data/db_taxonomies.xlsx")
        parser.add_argument("--dry-run", action="store_true", help="No escribe en DB, solo valida y muestra logs.")
        parser.add_argument("--caso3-sector", "--c3-sector", dest="caso3_sector", type=str, default=None,
                            help="(Hoy no se usa; CASO3 no lleva sector. Se mantiene por compatibilidad.)")
        parser.add_argument("--caso2-sector", "--c2-sector", dest="caso2_sector", type=str, default=None,
                            help="Sector a usar en CASO2 si faltara (normalmente viene en hoja).")

    # ---- CASO2
    def import_case2(self, df, default_sector=None):
        """
        CASO2 (CR/PAN): whitelist por sector.
        Columnas esperadas (alias aceptados):
          - taxonomy
          - language (opcional)
          - environmental_objective  (alias: 'objective', 'objetivo')
          - sector (si falta y se pasó --c2-sector, se usa ese)
          - description (alias: 'descripcion', 'descripción')
          - eligible_activities (alias: 'eligible_practices', 'acciones_elegibles', 'ejemplos')
          - title (opcional; si falta lo generamos)
        * Cualquier columna DNSH se ignora (no aplica a whitelist).
        """
        df = df.copy()
        df.columns = [str(c).strip().lower() for c in df.columns]

        if "taxonomy" not in df.columns or "environmental_objective" not in df.columns:
            self.stdout.write(self.style.ERROR("❌ CASO2: faltan columnas mínimas 'taxonomy' o 'environmental_objective'"))
            return (0, 0, 0, 0)

        created = updated = skipped = warnings = 0

        for _, row in df.iterrows():
            taxonomy_name = pick(row, "taxonomy")
            language = pick(row, "language", default="ES")
            objective_name = pick(row, "environmental_objective", "objective", "objetivo")
            sector_name = pick(row, "sector") or (default_sector or "").strip()
            if not sector_name:
                warnings += 1
                self.stdout.write("⚠️  CASO2: no hay 'sector' ni --c2-sector; fila omitida.")
                skipped += 1
                continue

            description = pick(row, "description", "descripcion", "descripción")
            eligible = pick(row, "eligible_activities", "eligible_practices", "acciones_elegibles", "ejemplos")

            given_title = pick(row, "title", "titulo", "título")
            title = given_title or synth_title(eligible, description, sector_name)

            # Upserts de jerarquía
            taxonomy, _ = Taxonomy.objects.get_or_create(name=taxonomy_name)
            objective, _ = EnvironmentalObjective.objects.get_or_create(
                taxonomy=taxonomy, name=objective_name
            )
            sector, _ = Sector.objects.get_or_create(
                taxonomy=taxonomy, environmental_objective=objective, name=sector_name
            )

            obj, was_created = AdaptationWhitelist.objects.update_or_create(
                taxonomy=taxonomy,
                environmental_objective=objective,
                sector=sector,
                title=title,
                defaults={
                    "language": language,
                    "description": description,
                    "eligible_activities": eligible,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        return created, updated, skipped, warnings

    # ---- CASO3
    def import_case3(self, df):
        """
        CASO3 (CR/PAN): criterios generales sin sector.
        Columnas esperadas (alias aceptados):
          - taxonomy
          - language (opcional)
          - environmental_objective  (alias: 'objective', 'objetivo')
          - criteria  (alias: 'criterion', 'criterio')
          - subcriteria  (alias: 'subcriterio', 'detalle')  [opcional]
          - title (opcional; si falta lo generamos)
        """
        df = df.copy()
        df.columns = [str(c).strip().lower() for c in df.columns]

        if "taxonomy" not in df.columns or "environmental_objective" not in df.columns:
            self.stdout.write(self.style.ERROR("❌ CASO3: faltan columnas mínimas 'taxonomy' o 'environmental_objective'"))
            return (0, 0, 0, 0)

        created = updated = skipped = warnings = 0

        for _, row in df.iterrows():
            taxonomy_name = pick(row, "taxonomy")
            language = pick(row, "language", default="ES")
            objective_name = pick(row, "environmental_objective", "objective", "objetivo")

            criteria = pick(row, "criteria", "criterion", "criterio")
            subcriteria = pick(row, "subcriteria", "subcriterio", "detalle")

            given_title = pick(row, "title", "titulo", "título")
            title = given_title or synth_title(criteria, subcriteria, objective_name)

            taxonomy, _ = Taxonomy.objects.get_or_create(name=taxonomy_name)
            objective, _ = EnvironmentalObjective.objects.get_or_create(
                taxonomy=taxonomy, name=objective_name
            )

            obj, was_created = AdaptationGeneralCriterion.objects.update_or_create(
                taxonomy=taxonomy,
                environmental_objective=objective,
                title=title,
                defaults={
                    "language": language,
                    "criteria": criteria,
                    "subcriteria": subcriteria,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        return created, updated, skipped, warnings

    # ---- handle
    def handle(self, *args, **options):
        base_default = settings.BASE_DIR / "data" / "db_taxonomies.xlsx"
        file_path = options.get("file") or base_default
        dry_run = options.get("dry_run", False)
        c2_sector_override = options.get("caso2_sector")

        g_created = g_updated = g_skipped = g_warnings = 0

        # ========= Hoja principal =========
        self.stdout.write("• Importando hoja principal (Sheet1 / Main)…")
        df_main = pd.read_excel(file_path, sheet_name=0)
        df_main.columns = [str(c).strip().lower() for c in df_main.columns]

        main_counters = {"created": 0, "updated": 0, "skipped": 0, "warnings": 0}

        if "dnsh_general" not in df_main.columns:
            warn(self.stdout, "Columna opcional ausente: 'dnsh_general'. Se continuará sin ella.", main_counters)
        if "mss" not in df_main.columns:
            warn(self.stdout, "Columna opcional ausente: 'mss'. Se continuará sin ella.", main_counters)

        for i, row in df_main.iterrows():
            excel_rownum = i + 2
            taxonomy_name   = to_str(row.get("taxonomy"))
            region          = to_str(row.get("region")) or "Other"
            language        = to_str(row.get("language")) or "EN"
            objective_name  = to_str(row.get("environmental_objective"))
            sector_name     = to_str(row.get("sector"))
            subsector_name  = to_str(row.get("subsector")) or ""

            economic_code_system = to_str(row.get("economic_code_system"))
            economic_code   = to_str(row.get("economic_code"))
            taxonomy_code   = to_str(row.get("taxonomy_code"))
            activity_name   = to_str(row.get("activity"))
            contribution    = to_str(row.get("contribution_type")) or "None"
            description     = to_str(row.get("description"))

            sc_type         = norm_lower(row.get("sc_criteria_type") or "threshold")
            sc_threshold    = to_str(row.get("substantial_contribution_criteria"))
            sc_green        = to_str(row.get("sc_criteria_green"))
            sc_amber        = to_str(row.get("sc_criteria_amber"))
            sc_red          = to_str(row.get("sc_criteria_red"))
            non_elig        = to_str(row.get("non_eligibility_criteria"))

            dnsh_climate_mitigation = to_str(row.get("dnsh_climate_mitigation"))
            dnsh_climate_adaptation = to_str(row.get("dnsh_climate_adaptation"))
            dnsh_water      = to_str(row.get("dnsh_water"))
            dnsh_circular   = to_str(row.get("dnsh_circular_economy"))
            dnsh_pollution  = to_str(row.get("dnsh_pollution_prevention"))
            dnsh_biodiv     = to_str(row.get("dnsh_biodiversity"))
            dnsh_land       = to_str(row.get("dnsh_land_management"))

            practice_level  = norm_practice_level(row.get("practice_level"))
            practice_name   = to_str(row.get("practice_name"))
            practice_desc   = to_str(row.get("practice_description"))
            eligible_prac   = to_str(row.get("eligible_practices"))
            non_eligible_prac = to_str(row.get("non_eligible_practices"))
            green_prac      = to_str(row.get("green_practices"))
            amber_prac      = to_str(row.get("amber_practices"))
            red_prac        = to_str(row.get("red_practices"))

            if dry_run:
                taxonomy = Taxonomy(name=taxonomy_name)
                objective = EnvironmentalObjective(taxonomy=taxonomy, name=objective_name)
                sector = Sector(taxonomy=taxonomy, environmental_objective=objective, name=sector_name)
                subsector = Subsector(sector=sector, name=subsector_name) if subsector_name else None
            else:
                taxonomy, _ = Taxonomy.objects.update_or_create(
                    name=taxonomy_name,
                    defaults={
                        "region": region,
                        "language": language,
                        **({"dnsh_general": to_str(row.get("dnsh_general"))} if "dnsh_general" in df_main.columns else {}),
                        **({"mss": to_str(row.get("mss"))} if "mss" in df_main.columns else {}),
                    },
                )
                objective, _ = EnvironmentalObjective.objects.get_or_create(
                    taxonomy=taxonomy, name=objective_name
                )
                sector, _ = Sector.objects.get_or_create(
                    taxonomy=taxonomy, environmental_objective=objective, name=sector_name
                )
                subsector = None
                if subsector_name:
                    subsector, _ = Subsector.objects.get_or_create(sector=sector, name=subsector_name)

            # Activity (clásica)
            if activity_name:
                if sc_type not in ("threshold", "traffic_light"):
                    warn(self.stdout, f"[fila {excel_rownum}] sc_criteria_type '{sc_type}' inválido; usando 'threshold'.", main_counters)
                    sc_type = "threshold"

                defaults = {
                    "economic_code_system": economic_code_system,
                    "economic_code": economic_code,
                    "name": activity_name,
                    "description": description,
                    "contribution_type": contribution,
                    "sc_criteria_type": sc_type,
                    "substantial_contribution_criteria": sc_threshold if sc_type == "threshold" else "",
                    "sc_criteria_green": sc_green if sc_type == "traffic_light" else "",
                    "sc_criteria_amber": sc_amber if sc_type == "traffic_light" else "",
                    "sc_criteria_red": sc_red if sc_type == "traffic_light" else "",
                    "non_eligibility_criteria": non_elig,
                    "dnsh_climate_mitigation": dnsh_climate_mitigation,
                    "dnsh_climate_adaptation": dnsh_climate_adaptation,
                    "dnsh_water": dnsh_water,
                    "dnsh_circular_economy": dnsh_circular,
                    "dnsh_pollution_prevention": dnsh_pollution,
                    "dnsh_biodiversity": dnsh_biodiv,
                    "dnsh_land_management": dnsh_land,
                }

                if dry_run:
                    main_counters["created"] += 1
                else:
                    obj, was_created = Activity.objects.update_or_create(
                        taxonomy=taxonomy,
                        environmental_objective=objective,
                        sector=sector,
                        subsector=subsector,
                        name=activity_name,
                        defaults={**defaults, "taxonomy_code": taxonomy_code},
                    )
                    if was_created:
                        main_counters["created"] += 1
                    else:
                        main_counters["updated"] += 1

            # Practice (MEO)
            # Practice (solo cuando el objetivo es MEO)
            if practice_level and (objective_name == OBJECTIVE_MEO):
                norm_level = practice_level
                if norm_level not in ALLOWED_PRACTICE_LEVELS:
                    warn(
                        self.stdout,
                        f"[fila {excel_rownum}] practice_level '{practice_level}' no reconocido, "
                        f"permitido: {sorted(list(ALLOWED_PRACTICE_LEVELS))}",
                        main_counters,
                    )
                else:
                    if norm_level in {"amber", "red"}:
                        filled = sum(bool(x) for x in [green_prac, amber_prac, red_prac])
                        if filled != 1:
                            warn(self.stdout, f"[fila {excel_rownum}] MEO traffic: debe haber exactamente UNA de green/amber/red con texto.", main_counters)
                            main_counters["skipped"] += 1
                        else:
                            defaults = {
                                "practice_description": practice_desc,
                                "eligible_practices": "",
                                "non_eligible_practices": "",
                                "green_practices": green_prac,
                                "amber_practices": amber_prac,
                                "red_practices": red_prac,
                            }
                            if dry_run:
                                main_counters["created"] += 1
                            else:
                                obj, was_created = Practice.objects.update_or_create(
                                    taxonomy=taxonomy,
                                    environmental_objective=objective,
                                    sector=sector,
                                    subsector=subsector,
                                    practice_level=norm_level,
                                    practice_name=practice_name,
                                    defaults=defaults,
                                )
                                if was_created:
                                    main_counters["created"] += 1
                                else:
                                    main_counters["updated"] += 1
                    else:
                        defaults = {
                            "practice_description": practice_desc,
                            "eligible_practices": eligible_prac,
                            "non_eligible_practices": non_eligible_prac,
                            "green_practices": "",
                            "amber_practices": "",
                            "red_practices": "",
                        }
                        if dry_run:
                            main_counters["created"] += 1
                        else:
                            obj, was_created = Practice.objects.update_or_create(
                                taxonomy=taxonomy,
                                environmental_objective=objective,
                                sector=sector,
                                subsector=subsector,
                                practice_level=norm_level,
                                practice_name=practice_name,
                                defaults=defaults,
                            )
                            if was_created:
                                main_counters["created"] += 1
                            else:
                                main_counters["updated"] += 1
            
            elif practice_level and (objective_name != OBJECTIVE_MEO):
                # Seguridad: si el Excel trae "practice_level" para adaptación u otros objetivos, lo ignoramos.
                warn(self.stdout, f"[fila {excel_rownum}] practice_level presente pero objetivo no es MEO; se ignora fila de Practice.", main_counters)


            if activity_name and sc_type == "threshold" and not sc_threshold:
                warn(self.stdout, f"[fila {excel_rownum}] clásico/threshold sin substantial_contribution_criteria. Se importa igual pero revisa.", main_counters)

        self.stdout.write(
            f"✅ MAIN listo. created={main_counters['created']} updated={main_counters['updated']} "
            f"skipped={main_counters['skipped']} warnings={main_counters['warnings']}"
        )
        g_created += main_counters["created"]; g_updated += main_counters["updated"]
        g_skipped += main_counters["skipped"]; g_warnings += main_counters["warnings"]

        # ========= Rwanda_Adaptation =========
        try:
            self.stdout.write("• Importando hoja Rwanda_Adaptation…")
            df_rw = pd.read_excel(file_path, sheet_name="Rwanda_Adaptation")
            df_rw.columns = [str(c).strip().lower() for c in df_rw.columns]

            rw_counters = {"created": 0, "updated": 0, "skipped": 0, "warnings": 0}

            for i, row in df_rw.iterrows():
                excel_rownum = i + 2
                taxonomy_name = to_str(row.get("taxonomy"))
                language = to_str(row.get("language")) or "EN"

                environmental_objective = to_str(row.get("environmental_objective"))
                sector = to_str(row.get("sector"))
                hazard = to_str(row.get("hazard"))
                division = to_str(row.get("division"))
                investment = to_str(row.get("investment"))

                expected_effect = to_str(row.get("expected effect")) or to_str(row.get("expected_effect"))
                expected_result = to_str(row.get("expected result")) or to_str(row.get("expected_result"))

                type_ = to_str(row.get("type"))
                level = to_str(row.get("level"))
                criteria_type = to_str(row.get("criteria type")) or to_str(row.get("criteria_type"))

                generic_dnsh = to_str(row.get("generic dnsh")) or to_str(row.get("generic_dnsh"))
                source_ref = to_str(row.get("source_ref"))

                taxonomy, _ = Taxonomy.objects.get_or_create(name=taxonomy_name)

                defaults = {
                    "language": language,
                    "expected_effect": expected_effect,
                    "expected_result": expected_result,
                    "type": type_,
                    "level": level,
                    "criteria_type": criteria_type,
                    "generic_dnsh": generic_dnsh,
                    "source_ref": source_ref,
                }

                if not (taxonomy_name and environmental_objective and sector and hazard and division and investment):
                    warn(self.stdout, f"[fila {excel_rownum}] RWANDA: faltan campos clave para unique_together, se omite.", rw_counters)
                    rw_counters["skipped"] += 1
                    continue

                obj, was_created = RwandaAdaptation.objects.update_or_create(
                    taxonomy=taxonomy,
                    environmental_objective=environmental_objective,
                    sector=sector,
                    hazard=hazard,
                    division=division,
                    investment=investment,
                    type=type_,
                    level=level,
                    criteria_type=criteria_type,
                    expected_effect=expected_effect,
                    expected_result=expected_result,
                    defaults=defaults,
                )
                if was_created:
                    rw_counters["created"] += 1
                else:
                    rw_counters["updated"] += 1

            self.stdout.write(
                f"✅ RWANDA listo. created={rw_counters['created']} updated={rw_counters['updated']} "
                f"skipped={rw_counters['skipped']} warnings={rw_counters['warnings']}"
            )
            g_created += rw_counters["created"]; g_updated += rw_counters["updated"]
            g_skipped += rw_counters["skipped"]; g_warnings += rw_counters["warnings"]
        except ValueError:
            self.stdout.write("• Hoja Rwanda_Adaptation no encontrada (se omite).")

        # ========= CASO2 (CR-PAN) =========
        # Intentamos varios nombres de hoja comunes
        for sheet_name in ["CASO2 (CR-PAN)", "Caso2_CR_PAN", "CASO2", "Case2", "caso2"]:
            try:
                df_c2 = pd.read_excel(file_path, sheet_name=sheet_name)
                self.stdout.write("• Importando hoja CASO2 (CR-PAN)…")
                c2_created, c2_updated, c2_skipped, c2_warn = self.import_case2(df_c2, default_sector=c2_sector_override)
                self.stdout.write(
                    f"✅ CASO2 listo. created={c2_created} updated={c2_updated} skipped={c2_skipped} warnings={c2_warn}"
                )
                g_created += c2_created; g_updated += c2_updated
                g_skipped += c2_skipped; g_warnings += c2_warn
                break
            except ValueError:
                # hoja no existe con ese nombre; probamos el siguiente
                continue

        # ========= CASO3 (CR-PAN) =========
        for sheet_name in ["CASO3 (CR-PAN)", "Caso3_CR_PAN", "CASO3", "Case3", "caso3"]:
            try:
                df_c3 = pd.read_excel(file_path, sheet_name=sheet_name)
                self.stdout.write("• Importando hoja CASO3 (CR-PAN)…")
                c3_created, c3_updated, c3_skipped, c3_warn = self.import_case3(df_c3)
                self.stdout.write(
                    f"✅ CASO3 listo. created={c3_created} updated={c3_updated} skipped={c3_skipped} warnings={c3_warn}"
                )
                g_created += c3_created; g_updated += c3_updated
                g_skipped += c3_skipped; g_warnings += c3_warn
                break
            except ValueError:
                continue

        # ========= Resumen global =========
        self.stdout.write(
            f"🏁 FIN: created={g_created} updated={g_updated} skipped={g_skipped} warnings={g_warnings}"
            + (" (dry-run)" if dry_run else "")
        )