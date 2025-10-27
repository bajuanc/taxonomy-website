from rest_framework import serializers
from .models import (
    Taxonomy, EnvironmentalObjective, Sector, Subsector,
    Activity, Practice, 
    RwandaAdaptation, AdaptationWhitelist, AdaptationGeneralCriterion

)
from .constants import OBJECTIVE_MEO


# =========================
#  Base (planos / CRUD)
# =========================

class TaxonomySerializer(serializers.ModelSerializer):
    class Meta:
        model = Taxonomy
        fields = "__all__"

class TaxonomyBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Taxonomy
        fields = ("id", "name", "region", "language")

class EnvironmentalObjectiveSerializer(serializers.ModelSerializer):
    taxonomy = TaxonomyBriefSerializer(read_only=True)

    class Meta:
        model = EnvironmentalObjective
        fields = "__all__"

class EnvironmentalObjectiveBriefSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    def get_name(self, obj):
        return obj.display_name or obj.generic_name

    class Meta:
        model = EnvironmentalObjective
        fields = ("id", "generic_name", "display_name", "name")

class SubsectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subsector
        fields = ["id", "name", "sector"]


class SectorSerializer(serializers.ModelSerializer):
    taxonomy = TaxonomyBriefSerializer(read_only=True)
    environmental_objective = EnvironmentalObjectiveBriefSerializer(read_only=True)

    class Meta:
        model = Sector
        fields = "__all__"

class SectorBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sector
        fields = ("id", "name")

# --- Activity (caso 1) ---
class ActivitySerializer(serializers.ModelSerializer):
    """
    Actividades 'clásicas' (no MEO). Incluye criterios threshold/traffic y DNSH.
    """
    taxonomy = TaxonomyBriefSerializer(read_only=True)
    environmental_objective = EnvironmentalObjectiveBriefSerializer(read_only=True)
    sector = SectorBriefSerializer(read_only=True)

    class Meta:
        model = Activity
        fields = "__all__"

class ActivityCriteriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = [
            "id",
            "name",
            "description",
            "sc_criteria_type",
            "substantial_contribution_criteria",
            "sc_criteria_green",
            "sc_criteria_amber",
            "sc_criteria_red",
            "non_eligibility_criteria",
            "dnsh_climate_adaptation",
            "dnsh_water",
            "dnsh_circular_economy",
            "dnsh_pollution_prevention",
            "dnsh_biodiversity",
            "dnsh_land_management",
        ]

# --- Practices (MEO) ---
class PracticeSerializer(serializers.ModelSerializer):
    """
    Prácticas para Multiple environmental objectives (AFOLU, Turismo, etc.).
    """
    taxonomy = TaxonomyBriefSerializer(read_only=True)
    environmental_objective = EnvironmentalObjectiveBriefSerializer(read_only=True)
    sector = SectorBriefSerializer(read_only=True)
    subsector = SubsectorSerializer(read_only=True)

    class Meta:
        model = Practice
        fields = "__all__"


class RwandaAdaptationSerializer(serializers.ModelSerializer):
    taxonomy = TaxonomySerializer(read_only=True)

    class Meta:
        model = RwandaAdaptation
        fields = "__all__"

# --- Adaptation: CASO2 (whitelist por sector) ---
class AdaptationWhitelistSerializer(serializers.ModelSerializer):
    taxonomy = TaxonomyBriefSerializer(read_only=True)
    environmental_objective = EnvironmentalObjectiveBriefSerializer(read_only=True)
    sector = SectorBriefSerializer(read_only=True)

    class Meta:
        model = AdaptationWhitelist
        fields = (
            "id",
            "taxonomy",
            "environmental_objective",
            "sector",
            "language",
            "title",
            "description",
            "eligible_activities",
        )

# --- Adaptation: CASO3 (criterios generales sin sector) ---
class AdaptationGeneralCriterionSerializer(serializers.ModelSerializer):
    taxonomy = TaxonomyBriefSerializer(read_only=True)
    environmental_objective = EnvironmentalObjectiveBriefSerializer(read_only=True)

    class Meta:
        model = AdaptationGeneralCriterion
        fields = (
            "id",
            "taxonomy",
            "environmental_objective",
            "language",
            "title",
            "criteria",
            "subcriteria",
        )

# ==================================================
#  Slim serializers (para listas / vistas anidadas)
# ==================================================

class ActivitySlimSerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = [
            "id", "taxonomy_code", "economic_code_system", "economic_code",
            "name", "description", "contribution_type", "sc_criteria_type",
            "substantial_contribution_criteria", "non_eligibility_criteria",
            "sc_criteria_green", "sc_criteria_amber", "sc_criteria_red",
            "dnsh_climate_mitigation", "dnsh_climate_adaptation", "dnsh_water",
            "dnsh_circular_economy", "dnsh_pollution_prevention",
            "dnsh_biodiversity", "dnsh_land_management",
        ]


class PracticeSlimSerializer(serializers.ModelSerializer):
    class Meta:
        model = Practice
        fields = [
            "id", "practice_level", "practice_name", "practice_description",
            "eligible_practices", "non_eligible_practices",
            "green_practices", "amber_practices", "red_practices",
        ]


# ==================================================
#  Serializers anidados para navegación FE
# ==================================================

class SectorWithContentSerializer(serializers.ModelSerializer):
    """
    Devuelve, por sector, sus Activities (clásicas) y sus Practices (solo si el objetivo es MEO).
    """
    activities = serializers.SerializerMethodField()
    practices = serializers.SerializerMethodField()
    subsectors = SubsectorSerializer(many=True, read_only=True)

    class Meta:
        model = Sector
        fields = ["id", "name", "subsectors", "activities", "practices"]

    def get_activities(self, obj):
        # actividades del sector (para objetivos clásicos)
        qs = obj.activities.all().select_related("sector", "environmental_objective", "taxonomy")
        return ActivitySlimSerializer(qs, many=True).data

    def get_practices(self, obj):
        # prácticas solo si el objetivo es MEO
        if obj.environmental_objective.name != OBJECTIVE_MEO:
            return []
        qs = obj.practices.all().select_related("sector", "environmental_objective", "taxonomy")
        return PracticeSlimSerializer(qs, many=True).data


class ObjectiveDetailSerializer(serializers.ModelSerializer):
    """
    Un objetivo con sus sectores y contenido (activities/practices).
    """
    sectors = serializers.SerializerMethodField()
    adaptation_whitelists = serializers.SerializerMethodField()
    adaptation_general_criteria = serializers.SerializerMethodField()

    class Meta:
        model = EnvironmentalObjective
        fields = ["id", "name", "sectors", "adaptation_whitelists", "adaptation_general_criteria"]

    def get_sectors(self, obj):
        qs = obj.sectors.all().select_related("taxonomy", "environmental_objective")
        return SectorWithContentSerializer(qs, many=True).data

    def get_adaptation_whitelists(self, obj):
        # Solo si es un objetivo de adaptación
        if "adaptation" not in obj.name.lower():
            return []
        items = obj.adaptation_whitelists.select_related("taxonomy","environmental_objective","sector").all().order_by("sector__name", "title")
        # Agrupado por sector
        data = {}
        for it in items:
            sid = it.sector_id
            data.setdefault(sid, {
                "sector": {"id": sid, "name": it.sector.name},
                "entries": [],
            })
            data[sid]["entries"].append(AdaptationWhitelistSerializer(it).data)
        # devuelve lista
        return list(data.values())

    def get_adaptation_general_criteria(self, obj):
        if "adaptation" not in obj.name.lower():
            return []
        items = obj.adaptation_general_criteria.select_related("taxonomy","environmental_objective").all().order_by("title")
        return AdaptationGeneralCriterionSerializer(items, many=True).data

class TaxonomyDetailSerializer(serializers.ModelSerializer):
    """
    Una taxonomía con objetivos (anidados) + (opcional) medidas Rwanda.
    """
    objectives = ObjectiveDetailSerializer(source="objectives", many=True, read_only=True)
    # Si quieres adjuntar Rwanda en el detalle de la taxonomía:
    rwanda_adaptation = serializers.SerializerMethodField()

    class Meta:
        model = Taxonomy
        fields = [
            "id", "name", "description", "region", "country_code", "language",
            "dnsh_general", "mss", "objectives", "rwanda_adaptation"
        ]

    def get_rwanda_adaptation(self, obj):
        rows = obj.rwanda_adaptation_rows.all()
        return RwandaAdaptationSerializer(rows, many=True).data


# ========================================
#  Validaciones extra (opcional pero útil)
# ========================================

class PracticeValidatedSerializer(PracticeSerializer):
    """
    Igual que PracticeSerializer pero valida la matriz MEO (threshold/traffic).
    Úsalo en endpoints de creación/edición si vas a permitir POST/PUT desde API.
    """

    def validate(self, attrs):
        # Determina columnas esperadas según objetivo + (no tenemos sc_type en Practice; lo inferimos por columnas llenas)
        # Regla: en modo traffic (MEO) solo debe haber UNA de green/amber/red_practices con texto.
        green = (attrs.get("green_practices") or "").strip()
        amber = (attrs.get("amber_practices") or "").strip()
        red = (attrs.get("red_practices") or "").strip()

        filled_traffic = sum(bool(x) for x in [green, amber, red])

        elig = (attrs.get("eligible_practices") or "").strip()
        non_elig = (attrs.get("non_eligible_practices") or "").strip()

        # Si trae algo en traffic, no debería traer threshold y viceversa
        if filled_traffic > 0 and (elig or non_elig):
            raise serializers.ValidationError("MEO: no mezcles traffic (green/amber/red_practices) con threshold (eligible/non_eligible_practices) en la misma fila.")

        # Si es traffic, debe haber exactamente una columna de color
        if filled_traffic not in (0, 1):
            raise serializers.ValidationError("MEO (traffic): debe haber exactamente UNA de green_practices, amber_practices o red_practices con texto.")

        return attrs
