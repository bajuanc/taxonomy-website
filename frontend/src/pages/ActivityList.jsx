import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import {
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Box,
  CircularProgress,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useNavigate } from "react-router-dom";
import ActivityCriteriaModal from "../components/ActivityCriteriaModal";
import Header from "../components/Header";

const ActivityList = () => {
  const { taxonomyId, objectiveId, sectorId } = useParams();
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [criteriaModalOpen, setCriteriaModalOpen] = useState(false);
  const [taxonomyName, setTaxonomyName] = useState("");
  const [objectiveName, setObjectiveName] = useState("");
  const [sectorName, setSectorName] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      try {
        setLoading(true);

        const [activitiesRes, taxonomyRes, objectiveRes, sectorRes] =
          await Promise.all([
            api.get(
              `\taxonomies/${taxonomyId}/objectives/${objectiveId}/sectors/${sectorId}/activities/`
            ),
            api.get(`taxonomies/${taxonomyId}/`),
            api.get(`objectives/${objectiveId}/`),
            api.get(`sectors/${sectorId}/`),
          ]);

        if (cancelled) return;

        setActivities(activitiesRes.data);
        setTaxonomyName(taxonomyRes.data?.name || "");
        setObjectiveName(objectiveRes.data?.name || "");
        setSectorName(sectorRes.data?.name || "");
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [taxonomyId, objectiveId, sectorId]);

  const filteredActivities = activities.filter((activity) =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClick = async (activity) => {
  try {
    const response = await api.get(`activities/${activity.id}/criteria/`);
    setSelectedActivity(response.data);
    setCriteriaModalOpen(true);
  } catch (error) {
    console.error("Error fetching criteria:", error);
  }
  };

  return (
    <>
      <Header activePage="taxonomies" />
      <Container sx={{ mt: 4 }}>

        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          ← Back
        </Button>

        <Typography variant="h4" gutterBottom>
          {taxonomyName && sectorName
            ? `${taxonomyName} Taxonomy — ${objectiveName ? objectiveName + " — " : ""}${sectorName} Activities`
            : "Activities"}
        </Typography>

        <TextField
          fullWidth
          placeholder="Search for an activity"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton>
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box textAlign="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {filteredActivities.map((activity) => (
              <Card
                key={activity.id}
                variant="outlined"
                sx={{ p: 2, cursor: "pointer" }}
                onClick={() => handleClick(activity)}
              >
                <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="h6">{activity.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {activity.description.slice(0, 200)}...
                    </Typography>
                  </Box>
                  <ArrowForwardIosIcon />
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        <ActivityCriteriaModal
          open={criteriaModalOpen}
          onClose={() => setCriteriaModalOpen(false)}
          activity={selectedActivity}
        />

      </Container>
    
    </>
  );
};

export default ActivityList;
