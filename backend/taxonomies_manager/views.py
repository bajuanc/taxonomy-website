from django.shortcuts import render

# Create your views here.

from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Taxonomy, EnvironmentalObjective, Sector, Activity
from .serializers import (
    TaxonomySerializer,
    EnvironmentalObjectiveSerializer,
    SectorSerializer,
    ActivitySerializer,
    ActivityCriteriaSerializer
)

class TaxonomyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Taxonomy.objects.all()
    serializer_class = TaxonomySerializer

class EnvironmentalObjectiveViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EnvironmentalObjective.objects.all()
    serializer_class = EnvironmentalObjectiveSerializer

class SectorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Sector.objects.all()
    serializer_class = SectorSerializer

class ActivityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer


# ✅ Custom API view for environmental objetive by taxonomy ID
@api_view(['GET'])
def environmental_objectives_by_taxonomy(request, taxonomy_id):
    objectives = EnvironmentalObjective.objects.filter(taxonomy_id=taxonomy_id)
    serializer = EnvironmentalObjectiveSerializer(objectives, many=True)
    return Response(serializer.data)

# ✅ Custom API view for sectors by taxonomy ID
@api_view(['GET'])
def sectors_by_taxonomy(request, taxonomy_id):
    sectors = Sector.objects.filter(taxonomy_id=taxonomy_id)
    serializer = SectorSerializer(sectors, many=True)
    return Response(serializer.data)

# ✅ Custom API view for sectors by taxonomy ID and environmental objective
@api_view(['GET'])
def sectors_by_taxonomy_and_objective(request, taxonomy_id, objective_id):
    sectors = Sector.objects.filter(
        taxonomy_id=taxonomy_id,
        environmental_objective_id=objective_id
    )
    serializer = SectorSerializer(sectors, many=True)
    return Response(serializer.data)

# ✅ Custom API view for activities by Sector, Objective, and Taxonomy
@api_view(['GET'])
def activities_by_filters(request, taxonomy_id, objective_id, sector_id):
    activities = Activity.objects.filter(
        taxonomy_id=taxonomy_id,
        environmental_objective_id=objective_id,
        sector_id=sector_id
    )
    serializer = ActivitySerializer(activities, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def activity_criteria(request, activity_id):
    try:
        activity = Activity.objects.get(id=activity_id)
    except Activity.DoesNotExist:
        return Response({"error": "Activity not found"}, status=status.HTTP_404_NOT_FOUND)

    data = ActivityCriteriaSerializer(activity).data
    return Response(data)
