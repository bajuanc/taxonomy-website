from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    TaxonomyViewSet, EnvironmentalObjectiveViewSet, SectorViewSet, SubsectorViewSet,
    ActivityViewSet, PracticeViewSet, RwandaAdaptationViewSet,
    AdaptationWhitelistViewSet, AdaptationGeneralCriterionViewSet,
    sectors_by_taxonomy, environmental_objectives_by_taxonomy, sectors_by_taxonomy_and_objective,
    activities_by_filters, activity_criteria, taxonomy_detail_nested
)

router = DefaultRouter()
router.register(r"taxonomies", TaxonomyViewSet, basename="taxonomies")
router.register(r"objectives", EnvironmentalObjectiveViewSet, basename="objectives")
router.register(r"sectors", SectorViewSet, basename="sectors")
router.register(r"subsectors", SubsectorViewSet, basename="subsectors")
router.register(r"activities", ActivityViewSet, basename="activities")
router.register(r"practices", PracticeViewSet, basename="practices")
router.register(r"rwanda-adaptation", RwandaAdaptationViewSet, basename="rwanda-adaptation")
router.register(r'adaptation-whitelists', AdaptationWhitelistViewSet, basename="adaptation-whitelists")
router.register(r'adaptation-general-criteria', AdaptationGeneralCriterionViewSet, basename="adaptation-general-criteria")

urlpatterns = [
    path("", include(router.urls)),

    # Anidados simples (compatibilidad)
    path("taxonomies/<int:taxonomy_id>/environmental-objectives/", environmental_objectives_by_taxonomy),
    path("taxonomies/<int:taxonomy_id>/sectors/", sectors_by_taxonomy),
    path("taxonomies/<int:taxonomy_id>/objectives/<int:objective_id>/sectors/", sectors_by_taxonomy_and_objective),

    # Actividades por T/O/S y criterios
    path("taxonomies/<int:taxonomy_id>/objectives/<int:objective_id>/sectors/<int:sector_id>/activities/", activities_by_filters),
    path("activities/<int:activity_id>/criteria/", activity_criteria),

    # Detalle anidado de una taxonomía (la “vista grande” para FE)
    path("taxonomies/<int:taxonomy_id>/detail/", taxonomy_detail_nested, name="taxonomy-detail-nested"),
]
