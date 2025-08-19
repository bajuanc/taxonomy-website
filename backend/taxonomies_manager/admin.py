from django.contrib import admin
from .models import Taxonomy, EnvironmentalObjective, Sector, Activity

# --- Taxonomy ---
@admin.register(Taxonomy)
class TaxonomyAdmin(admin.ModelAdmin):
    list_display = ("name", "region", "description_short")
    list_filter = ("region",)
    search_fields = ("name", "description")
    ordering = ("name",)

    def description_short(self, obj):
        return (obj.description[:80] + "…") if obj.description and len(obj.description) > 80 else obj.description
    description_short.short_description = "Description"


# --- Environmental Objective ---
@admin.register(EnvironmentalObjective)
class EnvironmentalObjectiveAdmin(admin.ModelAdmin):
    list_display = ("name", "taxonomy")
    list_filter = ("taxonomy__region", "taxonomy")
    search_fields = ("name", "taxonomy__name")
    ordering = ("taxonomy__name", "name")
    list_select_related = ("taxonomy",)


# --- Sector ---
@admin.register(Sector)
class SectorAdmin(admin.ModelAdmin):
    list_display = ("name", "environmental_objective", "taxonomy")
    list_filter = ("taxonomy__region", "taxonomy", "environmental_objective")
    search_fields = ("name", "environmental_objective__name", "taxonomy__name")
    ordering = ("taxonomy__name", "environmental_objective__name", "name")
    list_select_related = ("taxonomy", "environmental_objective")

    def taxonomy(self, obj):
        return obj.taxonomy
    taxonomy.admin_order_field = "environmental_objective__taxonomy__name"


# --- Activity ---
@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = (
        "taxonomy_code",
        "name",
        "taxonomy",
        "environmental_objective",
        "sector",
        "sc_criteria_type",
        "contribution_type",
    )
    list_filter = (
        "taxonomy__region",
        "taxonomy",
        "environmental_objective",
        "sector",
        "sc_criteria_type",
        "contribution_type",
    )
    search_fields = (
        "name",
        "taxonomy_code",
        "economic_code",
        "taxonomy__name",
        "environmental_objective__name",
        "sector__name",
    )
    ordering = ("taxonomy__name", "environmental_objective__name", "sector__name", "taxonomy_code")
    list_select_related = ("taxonomy", "environmental_objective", "sector")

    fieldsets = (
        ("Identity", {
            "fields": (
                "taxonomy", "environmental_objective", "sector",
                "taxonomy_code", "economic_code", "name", "description",
            )
        }),
        ("Classification", {
            "fields": ("contribution_type", "sc_criteria_type")
        }),
        ("Substantial contribution (Threshold mode)", {
            "fields": ("substantial_contribution_criteria",),
            "description": "Used when sc_criteria_type = 'threshold'"
        }),
        ("Substantial contribution (Traffic light mode)", {
            "fields": ("sc_criteria_green", "sc_criteria_amber", "sc_criteria_red"),
            "description": "Used when sc_criteria_type = 'traffic_light'"
        }),
        ("Non-eligibility", {
            "fields": ("non_eligibility_criteria",),
        }),
        ("DNSH", {
            "fields": (
                "dnsh_climate_adaptation",
                "dnsh_water",
                "dnsh_circular_economy",
                "dnsh_pollution_prevention",
                "dnsh_biodiversity",
                "dnsh_land_management",
            )
        }),
    )
