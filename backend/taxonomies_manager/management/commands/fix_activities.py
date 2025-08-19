from django.core.management.base import BaseCommand
from taxonomies_manager.models import Activity, Taxonomy

class Command(BaseCommand):
    help = "Fixes EU taxonomy activities with wrong sc_criteria_type and moves SC text if needed."

    def handle(self, *args, **kwargs):
        try:
            eu_taxonomy = Taxonomy.objects.get(name="EU")
            activities = Activity.objects.filter(taxonomy=eu_taxonomy)

            updated = 0

            for activity in activities:
                needs_update = False

                if activity.sc_criteria_type == "traffic_light":
                    activity.sc_criteria_type = "threshold"
                    needs_update = True

                if (
                    not activity.substantial_contribution_criteria.strip()
                    and activity.sc_criteria_green
                    and activity.sc_criteria_green.strip()
                ):
                    activity.substantial_contribution_criteria = activity.sc_criteria_green
                    activity.sc_criteria_green = ""
                    needs_update = True

                if needs_update:
                    activity.save()
                    updated += 1

            self.stdout.write(self.style.SUCCESS(f"{updated} activities were updated."))

        except Taxonomy.DoesNotExist:
            self.stdout.write(self.style.ERROR("EU taxonomy not found."))
