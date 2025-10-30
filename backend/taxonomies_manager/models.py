from django.db import models
from .constants import (
    DJANGO_SC_CRITERIA_CHOICES,
    DJANGO_PRACTICE_LEVEL_CHOICES,
    DJANGO_RW_TYPE_CHOICES,
    DJANGO_RW_LEVEL_CHOICES,
    DJANGO_RW_CRITERIA_CHOICES,
)

# -------------------------
# Core entities
# -------------------------

class Taxonomy(models.Model):
    REGION_CHOICES = [
        ("Europe", "Europe"),
        ("Asia", "Asia"),
        ("Africa", "Africa"),
        ("Latin America and the Caribbean", "Latin America and the Caribbean"),
        ("Oceania", "Oceania"),
        ("Middle East", "Middle East"),
        ("Other", "Other"),
    ]
    name = models.TextField(unique=True)
    description = models.TextField(blank=True)
    region = models.CharField(
        max_length=50,
        choices=REGION_CHOICES,
        blank=True,
        default="Other",
    )
    country_code = models.CharField(max_length=2, blank=True, null=True)
    
    language = models.CharField(max_length=5, blank=True, default="EN")  # "EN" | "ES"
    dnsh_general = models.TextField(blank=True)
    mss = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Taxonomies"

    def __str__(self):
        return self.name


class EnvironmentalObjective(models.Model):
    taxonomy = models.ForeignKey(Taxonomy, on_delete=models.CASCADE, related_name="objectives")
    generic_name = models.CharField(max_length=100)
    display_name = models.TextField(blank=True)

    class Meta:
        unique_together = ("taxonomy", "generic_name")

    def __str__(self):
        shown = self.display_name or self.generic_name
        return f"{shown} ({self.taxonomy.name})"


class Sector(models.Model):
    taxonomy = models.ForeignKey(Taxonomy, on_delete=models.CASCADE, related_name="sectors")
    environmental_objective = models.ForeignKey(EnvironmentalObjective, on_delete=models.CASCADE, related_name="sectors")
    name = models.CharField(max_length=512)

    class Meta:
        unique_together = ("taxonomy", "environmental_objective", "name")

    def __str__(self):
        return f"{self.name} ({self.taxonomy.name} - {self.environmental_objective.display_name})"

class Subsector(models.Model):
    """
    Subsector opcional. En Rwanda_Adaptation usaremos 'division' en otra tabla,
    pero para la hoja maestra general es útil tener subsector cuando exista.
    """
    sector = models.ForeignKey(Sector, on_delete=models.CASCADE, related_name="subsectors")
    name = models.TextField()

    class Meta:
        unique_together = ("sector", "name")
        verbose_name_plural = "Subsectors"

    def __str__(self):
        return f"{self.name} ({self.sector})"

# -------------------------
# Activities (objetivos 'clásicos', no MEO)
# -------------------------

class Activity(models.Model):
    taxonomy = models.ForeignKey(Taxonomy, on_delete=models.CASCADE, related_name="activities")
    environmental_objective = models.ForeignKey(EnvironmentalObjective, on_delete=models.CASCADE, related_name="activities")
    sector = models.ForeignKey(Sector, on_delete=models.CASCADE, related_name="activities")
    subsector = models.ForeignKey(Subsector, on_delete=models.SET_NULL, null=True, blank=True, related_name="activities")

    # Codificación
    taxonomy_code = models.CharField(max_length=50)  # e.g. CCM 1.1, M1
    economic_code_system = models.CharField(max_length=50, blank=True)  # e.g. NACE, ISIC, CNAE
    economic_code = models.CharField(max_length=255)  # e.g. NACE, ISIC, PSIC codes
    
    # Actividad
    name = models.TextField()
    description = models.TextField(blank=True)

    contribution_type = models.CharField(max_length=50, choices=[
        ('Enabling', 'Enabling'),
        ('Transitional', 'Transitional'),
        ('None', 'None')
    ], default='None')

    # Substantial contribution criteria
    sc_criteria_type = models.CharField(max_length=50, choices=DJANGO_SC_CRITERIA_CHOICES, default='threshold')
    
    # Threshold
    substantial_contribution_criteria = models.TextField(blank=True)  # Used if type = threshold
    non_eligibility_criteria = models.TextField(blank=True)
    
    # Traffic light (no MEO)
    sc_criteria_green = models.TextField(blank=True)  # Used if type = traffic_light
    sc_criteria_amber = models.TextField(blank=True)
    sc_criteria_red = models.TextField(blank=True)

    # Fixed DNSH criteria fields
    dnsh_climate_mitigation = models.TextField(blank=True)
    dnsh_climate_adaptation = models.TextField(blank=True)
    dnsh_water = models.TextField(blank=True)
    dnsh_circular_economy = models.TextField(blank=True)
    dnsh_pollution_prevention = models.TextField(blank=True)
    dnsh_biodiversity = models.TextField(blank=True)
    dnsh_land_management = models.TextField(blank=True)

    class Meta:
        unique_together = ("taxonomy", "environmental_objective", "sector", "subsector", "name")
        verbose_name = "Activity"
        verbose_name_plural = "Activities"

    def __str__(self):
        return f"{self.taxonomy.name} | {self.environmental_objective.display_name} | {self.sector.name} | {self.name}"
    
# -------------------------
# Practices (MEO: Multiple environmental objectives — AFOLU, Turismo, etc.)
# -------------------------

class Practice(models.Model):
    taxonomy = models.ForeignKey(Taxonomy, on_delete=models.CASCADE, related_name="practices")
    environmental_objective = models.ForeignKey(EnvironmentalObjective, on_delete=models.CASCADE, related_name="practices")
    sector = models.ForeignKey(Sector, on_delete=models.CASCADE, related_name="practices")
    subsector = models.ForeignKey(Subsector, on_delete=models.SET_NULL, null=True, blank=True, related_name="practices")

    # Niveles MEO (Basic, Intermediate, Advanced, Additional eligible green practices, Amber, Red)
    practice_level = models.CharField(max_length=80, choices=DJANGO_PRACTICE_LEVEL_CHOICES)

    practice_name = models.TextField(blank=True)         # puede venir vacío en algunos casos
    practice_description = models.TextField(blank=True)

    # MEO threshold
    eligible_practices = models.TextField(blank=True)
    non_eligible_practices = models.TextField(blank=True)

    # MEO traffic light (texto; exclusividad por fila la controlaremos en validaciones del import/serializer)
    green_practices = models.TextField(blank=True)
    amber_practices = models.TextField(blank=True)
    red_practices = models.TextField(blank=True)

    class Meta:
        unique_together = (
            "taxonomy",
            "environmental_objective",
            "sector",
            "subsector",
            "practice_level",
            "practice_name",
        )
        verbose_name = "Practice"
        verbose_name_plural = "Practices"

    def __str__(self):
        return f"{self.taxonomy.name} | {self.environmental_objective.display_name} | {self.sector.name} | {self.practice_level} | {self.practice_name or '-'}"


# -------------------------
# Rwanda Adaptation (tabla hija con semántica propia)
# -------------------------

class RwandaAdaptation(models.Model):
    taxonomy = models.ForeignKey(Taxonomy, on_delete=models.CASCADE, related_name="rwanda_adaptation_rows")
    language = models.CharField(max_length=5, blank=True, default="EN")

    environmental_objective = models.CharField(max_length=100)  # "Climate adaptation"
    sector = models.TextField()
    hazard = models.TextField()
    division = models.CharField(max_length=255)  # Rwanda usa 'division' en lugar de subsector

    investment = models.TextField()
    expected_effect = models.TextField(blank=True)
    expected_result = models.TextField(blank=True)

    type = models.CharField(max_length=50, choices=DJANGO_RW_TYPE_CHOICES)          # Adapted | Adapting | Enabling
    level = models.CharField(max_length=50, choices=DJANGO_RW_LEVEL_CHOICES)        # Activity | Measure
    criteria_type = models.CharField(max_length=50, choices=DJANGO_RW_CRITERIA_CHOICES)  # Process-based | Quantitative | Qualitative | Whitelist

    generic_dnsh = models.TextField(blank=True)  # por ahora repetido por fila, como acordaste
    source_ref = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = "Rwanda Adaptation"
        verbose_name_plural = "Rwanda Adaptation"
        unique_together = (
            "taxonomy",
            "environmental_objective",
            "sector",
            "hazard",
            "division",
            "investment",
            "type",
            "level",
            "criteria_type",
            "expected_effect",
            "expected_result",
        )

    def __str__(self):
        return f"{self.taxonomy.name} | {self.sector} | {self.hazard} | {self.division}"    

# --- Adaptation: CASO2 (whitelist por sector) ---
class AdaptationWhitelist(models.Model):
    taxonomy = models.ForeignKey(Taxonomy, on_delete=models.CASCADE, related_name="adaptation_whitelists")
    language = models.CharField(max_length=5, blank=True, default="ES")
    environmental_objective = models.ForeignKey(
        EnvironmentalObjective, on_delete=models.CASCADE, related_name="adaptation_whitelists"
    )
    sector = models.ForeignKey(Sector, on_delete=models.CASCADE, related_name="adaptation_whitelists")

    title = models.TextField()

    description = models.TextField(blank=True)
    eligible_activities = models.TextField(blank=True)

    class Meta:
        unique_together = ("taxonomy", "environmental_objective", "sector", "title")
        verbose_name = "Adaptation whitelist (Case 2)"
        verbose_name_plural = "Adaptation whitelists (Case 2)"

    def __str__(self):
        return f"{self.taxonomy.name} | {self.environmental_objective.display_name} | {self.sector.name} | {self.title}"


# --- Adaptation: CASO3 (criterios generales sin sector) ---
class AdaptationGeneralCriterion(models.Model):
    taxonomy = models.ForeignKey(Taxonomy, on_delete=models.CASCADE, related_name="adaptation_general_criteria")
    language = models.CharField(max_length=5, blank=True, default="ES")
    environmental_objective = models.ForeignKey(
        EnvironmentalObjective, on_delete=models.CASCADE, related_name="adaptation_general_criteria"
    )

    title = models.TextField()
    criteria = models.TextField(blank=True)     # puede repetirse
    subcriteria = models.TextField(blank=True)  # distingue filas con mismo título

    class Meta:
        # ✅ Reemplaza el unique_together anterior por este UniqueConstraint
        constraints = [
            models.UniqueConstraint(
                fields=["taxonomy", "environmental_objective", "title", "subcriteria"],
                name="uniq_agc_tax_obj_title_subcriteria",
            ),
        ]
        verbose_name = "Adaptation general criterion (Case 3)"
        verbose_name_plural = "Adaptation general criteria (Case 3)"

    def __str__(self):
        obj_name = self.environmental_objective.display_name or self.environmental_objective.generic_name
        return f"{self.taxonomy.name} | {obj_name} | {self.title}"
