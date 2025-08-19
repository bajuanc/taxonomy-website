from django.db import models

# Create your models here.

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
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    region = models.CharField(
        max_length=50,
        choices=REGION_CHOICES,
        blank=True,
        default="Other",
    )
    country_code = models.CharField(max_length=2, blank=True, null=True)
    
    def __str__(self):
        return self.name


class EnvironmentalObjective(models.Model):
    taxonomy = models.ForeignKey(Taxonomy, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} ({self.taxonomy.name})"


class Sector(models.Model):
    taxonomy = models.ForeignKey(Taxonomy, on_delete=models.CASCADE)
    environmental_objective = models.ForeignKey(EnvironmentalObjective, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.name} ({self.taxonomy.name} - {self.environmental_objective.name})"


class Activity(models.Model):
    taxonomy = models.ForeignKey(Taxonomy, on_delete=models.CASCADE)
    environmental_objective = models.ForeignKey(EnvironmentalObjective, on_delete=models.CASCADE)
    sector = models.ForeignKey(Sector, on_delete=models.CASCADE)

    taxonomy_code = models.CharField(max_length=50)  # e.g. CCM 1.1, M1
    economic_code = models.CharField(max_length=255)  # e.g. NACE, ISIC, PSIC codes
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    contribution_type = models.CharField(max_length=50, choices=[
        ('Enabling', 'Enabling'),
        ('Transitional', 'Transitional'),
        ('None', 'None')
    ], default='None')

    # Substantial contribution criteria
    sc_criteria_type = models.CharField(max_length=50, choices=[
        ('threshold', 'Threshold'),
        ('traffic_light', 'Traffic Light')
    ], default='threshold')
    substantial_contribution_criteria = models.TextField(blank=True)  # Used if type = threshold
    non_eligibility_criteria = models.TextField(blank=True)
    sc_criteria_green = models.TextField(blank=True)  # Used if type = traffic_light
    sc_criteria_amber = models.TextField(blank=True)
    sc_criteria_red = models.TextField(blank=True)

    # Fixed DNSH criteria fields
    dnsh_climate_adaptation = models.TextField(blank=True)
    dnsh_water = models.TextField(blank=True)
    dnsh_circular_economy = models.TextField(blank=True)
    dnsh_pollution_prevention = models.TextField(blank=True)
    dnsh_biodiversity = models.TextField(blank=True)
    dnsh_land_management = models.TextField(blank=True)

    def __str__(self):
        return f"{self.taxonomy_code} - {self.name}"
