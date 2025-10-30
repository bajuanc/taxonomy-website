from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import (
    Taxonomy, EnvironmentalObjective, Sector, Subsector,
    Activity, Practice, RwandaAdaptation,
    AdaptationWhitelist, AdaptationGeneralCriterion
)
from .serializers import (
    TaxonomySerializer, EnvironmentalObjectiveSerializer, SectorSerializer, SubsectorSerializer,
    ActivitySerializer, PracticeSerializer, RwandaAdaptationSerializer,
    ActivitySlimSerializer, PracticeSlimSerializer,
    TaxonomyDetailSerializer,
    AdaptationWhitelistSerializer, AdaptationGeneralCriterionSerializer,
)
from .constants import OBJECTIVE_MEO
from django.db.models import Exists, OuterRef

# =========================
#  ViewSets base (CRUD/lectura)
# =========================

class TaxonomyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Taxonomy.objects.all().prefetch_related("objectives", "sectors")
    serializer_class = TaxonomySerializer


class EnvironmentalObjectiveViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EnvironmentalObjective.objects.select_related("taxonomy").all()
    serializer_class = EnvironmentalObjectiveSerializer


class SectorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Sector.objects.select_related("taxonomy", "environmental_objective").all()
    serializer_class = SectorSerializer


class SubsectorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Subsector.objects.select_related("sector", "sector__taxonomy", "sector__environmental_objective").all()
    serializer_class = SubsectorSerializer


class ActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Endpoints de actividades clásicas.
    Filtros por querystring: ?taxonomy=<id>&objective=<id>&sector=<id>&subsector=<id>
    """
    serializer_class = ActivitySerializer

    def get_queryset(self):
        qs = Activity.objects.select_related(
            "taxonomy", "environmental_objective", "sector", "subsector"
        ).all()

        t = self.request.query_params.get("taxonomy")
        o = self.request.query_params.get("objective")
        s = self.request.query_params.get("sector")
        ss = self.request.query_params.get("subsector")

        if t:
            qs = qs.filter(taxonomy_id=t)
        if o:
            qs = qs.filter(environmental_objective_id=o)
        if s:
            qs = qs.filter(sector_id=s)
        if ss:
            qs = qs.filter(subsector_id=ss)

        return qs.order_by("taxonomy__name", "environmental_objective__name", "sector__name", "taxonomy_code")


class PracticeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Endpoints de prácticas MEO.
    Filtros por querystring:
      ?taxonomy=<id>&objective=<id|MEO>&sector=<id>&subsector=<id>&practice_level=<str>
    """
    serializer_class = PracticeSerializer

    def get_queryset(self):
        qs = Practice.objects.select_related(
            "taxonomy", "environmental_objective", "sector", "subsector"
        ).all()

        t = self.request.query_params.get("taxonomy")
        o = self.request.query_params.get("objective")  # puede venir id o nombre
        s = self.request.query_params.get("sector")
        ss = self.request.query_params.get("subsector")
        lvl = self.request.query_params.get("practice_level")

        if t:
            qs = qs.filter(taxonomy_id=t)

        if o:
            if o.isdigit():
                qs = qs.filter(environmental_objective_id=int(o))
            else:
                # permite pasar nombre (ej. "Multiple environmental objectives")
                qs = qs.filter(environmental_objective__name=o)

        if s:
            qs = qs.filter(sector_id=s)
        if ss:
            qs = qs.filter(subsector_id=ss)
        if lvl:
            qs = qs.filter(practice_level=lvl)

        return qs.order_by("taxonomy__name", "sector__name", "practice_level", "practice_name")


class RwandaAdaptationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Medidas de adaptación de Rwanda.
    Filtros: ?taxonomy=<id>&sector=<str>&hazard=<str>&division=<str>&type=<str>&level=<str>&criteria_type=<str>
    """
    serializer_class = RwandaAdaptationSerializer

    def get_queryset(self):
        qs = RwandaAdaptation.objects.select_related("taxonomy").all()

        qp = self.request.query_params
        if qp.get("taxonomy"):
            qs = qs.filter(taxonomy_id=qp.get("taxonomy"))
        if qp.get("sector"):
            qs = qs.filter(sector=qp.get("sector"))
        if qp.get("hazard"):
            qs = qs.filter(hazard=qp.get("hazard"))
        if qp.get("division"):
            qs = qs.filter(division=qp.get("division"))
        if qp.get("type"):
            qs = qs.filter(type=qp.get("type"))
        if qp.get("level"):
            qs = qs.filter(level=qp.get("level"))
        if qp.get("criteria_type"):
            qs = qs.filter(criteria_type=qp.get("criteria_type"))

        return qs.order_by("sector", "hazard", "division")

class AdaptationWhitelistViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/adaptation-whitelists/?taxonomy=<id>&objective=<id>&sector=<id>
    """
    serializer_class = AdaptationWhitelistSerializer
    queryset = AdaptationWhitelist.objects.all().select_related(
        "taxonomy", "environmental_objective", "sector"
    )

    def get_queryset(self):
        qs = super().get_queryset()
        taxonomy_id = self.request.query_params.get("taxonomy")
        objective_id = self.request.query_params.get("objective")
        sector_id = self.request.query_params.get("sector")
        if taxonomy_id:
            qs = qs.filter(taxonomy_id=taxonomy_id)
        if objective_id:
            qs = qs.filter(environmental_objective_id=objective_id)
        if sector_id:
            qs = qs.filter(sector_id=sector_id)
        return qs.order_by("sector__name", "title")


class AdaptationGeneralCriterionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/adaptation-general-criteria/?taxonomy=<id>&objective=<id>
    """
    serializer_class = AdaptationGeneralCriterionSerializer
    queryset = AdaptationGeneralCriterion.objects.all().select_related(
        "taxonomy", "environmental_objective"
    )

    def get_queryset(self):
        qs = super().get_queryset()
        taxonomy_id = self.request.query_params.get("taxonomy")
        objective_id = self.request.query_params.get("objective")
        if taxonomy_id:
            qs = qs.filter(taxonomy_id=taxonomy_id)
        if objective_id:
            qs = qs.filter(environmental_objective_id=objective_id)
        return qs.order_by("title")


# =========================
#  Vistas personalizadas
# =========================

# Objetivos por taxonomía
@api_view(["GET"])
def environmental_objectives_by_taxonomy(request, taxonomy_id):
    objectives = EnvironmentalObjective.objects.filter(taxonomy_id=taxonomy_id).order_by("display_name", "generic_name")
    serializer = EnvironmentalObjectiveSerializer(objectives, many=True)
    return Response(serializer.data)

# Sectores por taxonomía
@api_view(["GET"])
def sectors_by_taxonomy(request, taxonomy_id):
    sectors = Sector.objects.filter(taxonomy_id=taxonomy_id).select_related("environmental_objective").order_by("name")
    serializer = SectorSerializer(sectors, many=True)
    return Response(serializer.data)

# Sectores por taxonomía y objetivo
@api_view(["GET"])
def sectors_by_taxonomy_and_objective(request, taxonomy_id, objective_id):
    qs = Sector.objects.filter(
        taxonomy_id=taxonomy_id,
        environmental_objective_id=objective_id
    ).order_by("name")

    # Si piden solo Case 1, filtra a sectores con al menos 1 Activity
    only_case1 = request.GET.get("only_case1")
    if only_case1 in ("1", "true", "True"):
        act_qs = Activity.objects.filter(
            taxonomy_id=taxonomy_id,
            environmental_objective_id=objective_id,
            sector_id=OuterRef("pk"),
        )
        qs = qs.annotate(has_acts=Exists(act_qs)).filter(has_acts=True)

    serializer = SectorSerializer(qs, many=True)
    return Response(serializer.data)

# Actividades por T/O/S (como ya tenías)
@api_view(["GET"])
def activities_by_filters(request, taxonomy_id, objective_id, sector_id):
    activities = Activity.objects.filter(
        taxonomy_id=taxonomy_id,
        environmental_objective_id=objective_id,
        sector_id=sector_id
    ).select_related("taxonomy", "environmental_objective", "sector")
    serializer = ActivitySlimSerializer(activities, many=True)
    return Response(serializer.data)

# Criterios de una actividad
@api_view(["GET"])
def activity_criteria(request, activity_id):
    try:
        activity = Activity.objects.get(id=activity_id)
    except Activity.DoesNotExist:
        return Response({"error": "Activity not found"}, status=status.HTTP_404_NOT_FOUND)
    data = ActivitySerializer(activity).data
    return Response(data)

# Detalle anidado de una Taxonomía (para navegar todo desde FE)
@api_view(["GET"])
def taxonomy_detail_nested(request, taxonomy_id: int):
    try:
        t = Taxonomy.objects.get(id=taxonomy_id)
    except Taxonomy.DoesNotExist:
        return Response({"error": "Taxonomy not found"}, status=status.HTTP_404_NOT_FOUND)
    # Prefetch para que sea eficiente
    t = (
        Taxonomy.objects
        .prefetch_related(
            "objectives__sectors__subsectors",
            "objectives__sectors__activities",
            "objectives__sectors__practices",
            "objectives__adaptation_whitelists__sector",
            "objectives__adaptation_general_criteria",
            "rwanda_adaptation_rows",
        )
        .get(id=taxonomy_id)
    )
    return Response(TaxonomyDetailSerializer(t).data)
