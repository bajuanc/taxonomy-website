# backend/taxonomies_manager/management/commands/import_taxonomies.py
import pandas as pd
from django.core.management.base import BaseCommand
from django.conf import settings
from taxonomies_manager.models import Taxonomy, EnvironmentalObjective, Sector, Activity

REQUIRED_COLUMNS = [
    "taxonomy",
    "region",
    "environmental_objective",
    "economic_code",
    "sector",
    "taxonomy_code",
    "activity",
    "contribution_type",
    "description",
    "sc_criteria_type",
    # One of the following sets must be present depending on sc_criteria_type
    # threshold -> substantial_contribution_criteria
    # traffic_light -> sc_criteria_green / sc_criteria_amber / sc_criteria_red
    "substantial_contribution_criteria",
    "non_eligibility_criteria",
    "sc_criteria_green",
    "sc_criteria_amber",
    "sc_criteria_red",
    "dnsh_climate_adaptation",
    "dnsh_water",
    "dnsh_circular_economy",
    "dnsh_pollution_prevention",
    "dnsh_biodiversity",
    "dnsh_land_management",
]

def to_str(val: object) -> str:
    """Safe string cast that turns NaN/None into empty string and strips."""
    if pd.isna(val):
        return ""
    return str(val).strip()

class Command(BaseCommand):
    help = "Import taxonomies from Excel"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            help="Path to the Excel file (defaults to backend/data/eu_taxonomy_cleaned.xlsx)",
        )

    def handle(self, *args, **options):
        default_path = settings.BASE_DIR / "data" / "eu_taxonomy_cleaned.xlsx"
        file_path = options.get("file") or default_path

        df = pd.read_excel(file_path)

        # Normalize column names to lowercase (so Excel case won’t matter)
        df.columns = [str(c).strip().lower() for c in df.columns]

        # Validate required columns are present
        missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
        if missing:
            self.stdout.write(self.style.ERROR(f"❌ Missing required columns: {missing}"))
            return

        created_or_updated = 0
        warnings = 0

        for idx, row in df.iterrows():
            # --- taxonomy hierarchy ---
            taxonomy_name   = to_str(row["taxonomy"])
            region          = to_str(row["region"]) or "Other"
            objective_name  = to_str(row["environmental_objective"])
            sector_name     = to_str(row["sector"])

            # --- identity / details ---
            taxonomy_code   = to_str(row["taxonomy_code"])
            economic_code   = to_str(row["economic_code"])
            activity_name   = to_str(row["activity"])
            description     = to_str(row["description"])
            contribution    = to_str(row["contribution_type"]) or "None"

            # --- substantial contribution (trust Excel; no validation) ---
            sc_type         = to_str(row["sc_criteria_type"]).lower() or "threshold"
            sc_threshold    = to_str(row["substantial_contribution_criteria"])
            sc_green        = to_str(row["sc_criteria_green"])
            sc_amber        = to_str(row["sc_criteria_amber"])
            sc_red          = to_str(row["sc_criteria_red"])

            non_elig        = to_str(row["non_eligibility_criteria"])

            # --- DNSH fields ---
            dnsh_adapt      = to_str(row["dnsh_climate_adaptation"])
            dnsh_water      = to_str(row["dnsh_water"])
            dnsh_circ       = to_str(row["dnsh_circular_economy"])
            dnsh_poll       = to_str(row["dnsh_pollution_prevention"])
            dnsh_bio        = to_str(row["dnsh_biodiversity"])
            dnsh_land       = to_str(row["dnsh_land_management"])


            # Upsert hierarchy
            taxonomy, _ = Taxonomy.objects.update_or_create(
                name=taxonomy_name,
                defaults={"region": region},
            )
            objective, _ = EnvironmentalObjective.objects.get_or_create(
                taxonomy=taxonomy,
                name=objective_name,
            )
            sector, _ = Sector.objects.get_or_create(
                taxonomy=taxonomy,
                environmental_objective=objective,
                name=sector_name,
            )

            # Upsert activity by natural key (taxonomy+objective+sector+taxonomy_code)
            Activity.objects.update_or_create(
                taxonomy=taxonomy,
                environmental_objective=objective,
                sector=sector,
                taxonomy_code=taxonomy_code,
                defaults={
                    "economic_code": economic_code,
                    "name": activity_name,
                    "description": description,
                    "contribution_type": contribution,
                    "sc_criteria_type": sc_type,
                    "substantial_contribution_criteria": sc_threshold,
                    "sc_criteria_green": sc_green,
                    "sc_criteria_amber": sc_amber,
                    "sc_criteria_red": sc_red,
                    "non_eligibility_criteria": non_elig,
                    "dnsh_climate_adaptation": dnsh_adapt,
                    "dnsh_water": dnsh_water,
                    "dnsh_circular_economy": dnsh_circ,
                    "dnsh_pollution_prevention": dnsh_poll,
                    "dnsh_biodiversity": dnsh_bio,
                    "dnsh_land_management": dnsh_land,
                },
            )
            created_or_updated += 1

        self.stdout.write(self.style.SUCCESS(
            f"✅ Import complete. Activities created/updated: {created_or_updated}. Warnings: {warnings}."
        ))
