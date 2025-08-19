from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TaxonomyViewSet,
    EnvironmentalObjectiveViewSet,
    SectorViewSet,
    ActivityViewSet,
    sectors_by_taxonomy,
    environmental_objectives_by_taxonomy,
    sectors_by_taxonomy_and_objective,
)
from . import views

# Create a router and register the viewsets
router = DefaultRouter()
router.register(r'taxonomies', TaxonomyViewSet)
router.register(r'objectives', EnvironmentalObjectiveViewSet)
router.register(r'sectors', SectorViewSet)
router.register(r'activities', ActivityViewSet)

# Include the router in the URL patterns
urlpatterns = [
    path('', include(router.urls)),
    path('taxonomies/<int:taxonomy_id>/sectors/', sectors_by_taxonomy),
    path('taxonomies/<int:taxonomy_id>/environmental-objectives/', environmental_objectives_by_taxonomy),
    path("taxonomies/<int:taxonomy_id>/objectives/<int:objective_id>/sectors/",
        sectors_by_taxonomy_and_objective,
        name="sectors-by-taxonomy-and-objective"
    ),
    path("taxonomies/<int:taxonomy_id>/objectives/<int:objective_id>/sectors/<int:sector_id>/activities/",
    views.activities_by_filters,
    name="activities-by-filters",
    ),
    path("activities/<int:activity_id>/criteria/", views.activity_criteria, name="activity-criteria"),

]
