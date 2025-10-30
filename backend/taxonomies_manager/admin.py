from django.contrib import admin
from .models import (
    Taxonomy, EnvironmentalObjective, Sector, Subsector,
    Activity, Practice, RwandaAdaptation,
    AdaptationWhitelist, AdaptationGeneralCriterion,
)

# Inlines para navegar jerárquicamente desde Taxonomy
class EnvironmentalObjectiveInline(admin.TabularInline):
    model = EnvironmentalObjective
    extra = 0

class SectorInline(admin.TabularInline):
    model = Sector
    extra = 0

# --- Taxonomy ---
@admin.register(Taxonomy)
class TaxonomyAdmin(admin.ModelAdmin):
    list_display = ("name", "region", "language", "description_short")
    list_filter = ("region", "language")
    search_fields = ("name", "description")
    readonly_fields = ()
    inlines = [EnvironmentalObjectiveInline, SectorInline]
    ordering = ("name",)

    def description_short(self, obj):
        return (obj.description[:80] + "…") if obj.description and len(obj.description) > 80 else obj.description
    description_short.short_description = "Description"


# --- Environmental Objective ---
@admin.register(EnvironmentalObjective)
class EnvironmentalObjectiveAdmin(admin.ModelAdmin):
    list_display = ("taxonomy","generic_name", "display_name")
    list_filter = ("taxonomy__region", "taxonomy")
    search_fields = ("generic_name", "display_name", "taxonomy__name")
    ordering = ("taxonomy__name", "generic_name")
    list_select_related = ("taxonomy",)

class SubsectorInline(admin.TabularInline):
    model = Subsector
    extra = 0

# --- Sector ---
@admin.register(Sector)
class SectorAdmin(admin.ModelAdmin):
    list_display = ("name", "taxonomy","environmental_objective")
    list_filter = ("taxonomy__region", "taxonomy", "environmental_objective")
    search_fields = ("name", "environmental_objective__display_name", "environmental_objective__generic_name", "taxonomy__name")
    ordering = ("taxonomy__name", "environmental_objective__display_name", "environmental_objective__generic_name", "name")
    list_select_related = ("taxonomy", "environmental_objective")
    inlines = [SubsectorInline]


# --- Subsector ---
@admin.register(Subsector)
class SubsectorAdmin(admin.ModelAdmin):
    list_display = ("name", "sector")
    search_fields = (
        "name",
        "sector__name",
        "sector__environmental_objective__display_name",
        "sector__environmental_objective__generic_name",
        "sector__taxonomy__name",
    )
    list_filter = ("sector__taxonomy", "sector__environmental_objective")
    ordering = ("sector__taxonomy__name", "sector__environmental_objective__generic_name", "sector__name", "name")


# --- Activity ---
@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = (
        "taxonomy_code",
        "name",
        "taxonomy",
        "environmental_objective",
        "sector",
        "subsector",
        "sc_criteria_type",
        "contribution_type",
    )
    list_filter = (
        "taxonomy__region",
        "taxonomy",
        "environmental_objective",
        "sector",
        "subsector",
        "sc_criteria_type",
        "contribution_type",
    )
    search_fields = (
        "name",
        "taxonomy_code",
        "taxonomy__name",
        "economic_code",
        "environmental_objective__display_name",
        "environmental_objective__generic_name",
        "sector__name",
    )
    ordering = ("taxonomy__name", "environmental_objective__display_name", "environmental_objective__generic_name", "sector__name", "taxonomy_code")
    list_select_related = ("taxonomy", "environmental_objective", "sector", "subsector")

    fieldsets = (
        ("Identity", {
            "fields": (
                "taxonomy",
                "environmental_objective",
                "sector",
                "subsector",
                "taxonomy_code",
                "economic_code_system",
                "economic_code",
                "name",
                "description",
            )
        }),
        ("Classification", {"fields": ("contribution_type", "sc_criteria_type")}),
        ("Substantial contribution (Threshold mode)", {
            "fields": ("substantial_contribution_criteria", "non_eligibility_criteria"),
            "description": "Used when sc_criteria_type = 'threshold'"
        }),
        ("Substantial contribution (Traffic light mode)", {
            "fields": ("sc_criteria_green", "sc_criteria_amber", "sc_criteria_red"),
            "description": "Used when sc_criteria_type = 'traffic_light'"
        }),
        ("DNSH", {
            "fields": (
                "dnsh_climate_mitigation",
                "dnsh_climate_adaptation",
                "dnsh_water",
                "dnsh_circular_economy",
                "dnsh_pollution_prevention",
                "dnsh_biodiversity",
                "dnsh_land_management",
            )
        }),
    )


@admin.register(Practice)
class PracticeAdmin(admin.ModelAdmin):
    list_display = ("practice_name", "practice_level", "taxonomy", "objective_disp", "sector", "subsector")

    @admin.display(description="Objective", ordering="environmental_objective__display_name")
    def objective_disp(self, obj):
        return obj.environmental_objective.display_name or obj.environmental_objective.generic_name
    
    search_fields = (
        "practice_name",
        "taxonomy__name",
        "sector__name",
        "environmental_objective__display_name",
        "environmental_objective__generic_name",
    )

    list_filter = ("taxonomy", "environmental_objective", "sector", "subsector", "practice_level")
    list_select_related = ("taxonomy", "environmental_objective", "sector", "subsector")

    fieldsets = (
        ("Context", {
            "fields": ("taxonomy", "environmental_objective", "sector", "subsector", "practice_level")
        }),
        ("Practice", {
            "fields": ("practice_name", "practice_description")
        }),
        ("Threshold mode (MEO)", {
            "fields": ("eligible_practices", "non_eligible_practices"),
            "description": "Use these when the practice row corresponds to threshold-type criteria."
        }),
        ("Traffic-light mode (MEO)", {
            "fields": ("green_practices", "amber_practices", "red_practices"),
            "description": "Exactly one of these should be filled per row."
        }),
    )

@admin.register(RwandaAdaptation)
class RwandaAdaptationAdmin(admin.ModelAdmin):
    list_display = ("taxonomy", "environmental_objective", "sector", "hazard", "division", "type", "level", "criteria_type")
    search_fields = ("taxonomy__name", "sector", "hazard", "division", "investment")
    list_filter = ("taxonomy", "environmental_objective", "sector", "hazard", "type", "level", "criteria_type")




# --- NUEVOS: CASO 2 y CASO 3 ---
@admin.register(AdaptationWhitelist)
class AdaptationWhitelistAdmin(admin.ModelAdmin):
    list_display = ("title", "taxonomy", "objective_disp", "sector", "language")

    @admin.display(description="Objective", ordering="environmental_objective__display_name")
    def objective_disp(self, obj):
        return obj.environmental_objective.display_name or obj.environmental_objective.generic_name
    
    list_filter = ("taxonomy", "environmental_objective", "sector", "language")
    search_fields = ("title", "description", "eligible_activities")
    autocomplete_fields = ("taxonomy", "environmental_objective", "sector")
    ordering = ("taxonomy__name", "environmental_objective__generic_name", "sector__name", "title")

@admin.register(AdaptationGeneralCriterion)
class AdaptationGeneralCriterionAdmin(admin.ModelAdmin):
    list_display = ("title", "taxonomy", "objective_disp", "language")

    @admin.display(description="Objective", ordering="environmental_objective__display_name")
    def objective_disp(self, obj):
        return obj.environmental_objective.display_name or obj.environmental_objective.generic_name


    list_filter = ("taxonomy", "environmental_objective", "language")
    search_fields = ("title", "criteria", "subcriteria")
    autocomplete_fields = ("taxonomy", "environmental_objective")
    ordering = ("taxonomy__name", "environmental_objective__generic_name", "title")
