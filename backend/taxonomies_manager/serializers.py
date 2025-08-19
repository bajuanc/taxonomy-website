from rest_framework import serializers
from .models import Taxonomy, EnvironmentalObjective, Sector, Activity

class TaxonomySerializer(serializers.ModelSerializer):
    class Meta:
        model = Taxonomy
        fields = '__all__'


class EnvironmentalObjectiveSerializer(serializers.ModelSerializer):
    taxonomy = TaxonomySerializer(read_only=True)

    class Meta:
        model = EnvironmentalObjective
        fields = '__all__'


class SectorSerializer(serializers.ModelSerializer):
    taxonomy = TaxonomySerializer(read_only=True)
    environmental_objective = EnvironmentalObjectiveSerializer(read_only=True)

    class Meta:
        model = Sector
        fields = '__all__'


class ActivitySerializer(serializers.ModelSerializer):
    taxonomy = TaxonomySerializer(read_only=True)
    environmental_objective = EnvironmentalObjectiveSerializer(read_only=True)
    sector = SectorSerializer(read_only=True)

    class Meta:
        model = Activity
        fields = '__all__'


class ActivityCriteriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = [
            'id',
            'name',
            'description',
            'sc_criteria_type',
            'substantial_contribution_criteria',
            'sc_criteria_green',
            'sc_criteria_amber',
            'sc_criteria_red',
            'non_eligibility_criteria',
            'dnsh_climate_adaptation',
            'dnsh_water',
            'dnsh_circular_economy',
            'dnsh_pollution_prevention',
            'dnsh_biodiversity',
            'dnsh_land_management',
        ]
