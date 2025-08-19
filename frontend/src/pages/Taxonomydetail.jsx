import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CircularProgress,
  Box,
  Button,
} from "@mui/material";
import Header from "../components/Header";

const TaxonomyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [taxonomy, setTaxonomy] = useState(null);
  const [objectives, setObjectives] = useState([]);
  const [selectedObjective, setSelectedObjective] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTaxonomy = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/taxonomies/${id}/`
        );
        setTaxonomy(response.data);
      } catch (error) {
        console.error("Error fetching taxonomy:", error);
      }
    };

    const fetchObjectives = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/taxonomies/${id}/environmental-objectives/`
        );
        setObjectives(response.data);
      } catch (error) {
        console.error("Error fetching objectives:", error);
      } finally {
        setLoading(false);
      }
    };


    fetchTaxonomy();
    fetchObjectives();
  }, [id]);

  useEffect(() => {
    if (selectedObjective) {
      const fetchSectors = async () => {
        try {
          const response = await axios.get(
            `http://localhost:8000/api/taxonomies/${id}/objectives/${selectedObjective.id}/sectors/`
          );
          setSectors(response.data);
        } catch (error) {
          console.error("Error fetching sectors:", error);
        }
      };

      fetchSectors();
    }
  }, [selectedObjective, id]);

  if (loading)
    return (
      <>
        <Header />
        <Container sx={{ textAlign: "center", marginTop: "4rem" }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ marginTop: 2 }}>
            Loading taxonomy...
          </Typography>
        </Container>
      </>
    );

  return (
    <>
      <Header />

      <Container sx={{ marginTop: "2rem" }}>
        <Box sx={{ marginBottom: "1rem" }}>
          <Button component={RouterLink} to="/taxonomies" variant="outlined">
            ← Back to list
          </Button>
        </Box>

        <Typography variant="h4" gutterBottom>
          {taxonomy?.name} Taxonomy
        </Typography>
        <Typography variant="body1" paragraph>
          {taxonomy?.description}
        </Typography>

        <Typography variant="h5" sx={{ marginTop: 4 }} gutterBottom>
          Environmental Objectives
        </Typography>

        <Grid container spacing={3}>
          {objectives.map((objective) => (
            <Grid item xs={12} sm={6} md={4} key={objective.id}>
              <Card
                elevation={selectedObjective?.id === objective.id ? 6 : 2}
                sx={{
                  cursor: "pointer",
                  width: "100%",
                  maxWidth: "600px",
                  border:
                    selectedObjective?.id === objective.id
                      ? "2px solid #1976d2"
                      : "1px solid #ccc",
                  backgroundColor:
                    selectedObjective?.id === objective.id
                      ? "#e3f2fd"
                      : "white",
                  transition: "all 0.3s ease",
                }}
                onClick={() => setSelectedObjective(objective)}
              >

                <CardActionArea
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    minHeight: 64,
                    px: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ m: 0 }}>
                    {objective.name}
                  </Typography>
                </CardActionArea>                

              </Card>
            </Grid>
          ))}
        </Grid>

        {selectedObjective && (
          <>
            <Typography variant="h6" sx={{ marginTop: 4, marginBottom: 2 }}>
              Sectors for: <strong>{selectedObjective.name}</strong>
            </Typography>
            {sectors.length > 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {sectors.map((sector) => (
                  <Card
                    key={sector.id}
                    sx={{
                      width: "100%",
                      maxWidth: "600px",
                      boxShadow: 3,
                      textDecoration: "none", // Remove underline
                      color: "inherit", // Keep text color
                      transition: "transform 0.2s ease, background-color 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        backgroundColor: "#f5f5f5",
                        boxShadow: 6,
                      },
                    }}
                  >
                    <CardActionArea
                      component={RouterLink}
                      to={`/taxonomies/${id}/objectives/${selectedObjective.id}/sectors/${sector.id}/activities`}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        minHeight: 64,
                        px: 2,
                      }}
                    >
                      <Typography variant="body1" sx={{ m: 0 }}>
                        {sector.name}
                      </Typography>
                    </CardActionArea>

                  </Card>
                ))}
              </Box>
            ) : (
              <Typography>No sectors available for this objective.</Typography>
            )}

          </>
        )}
      </Container>
    </>
  );
};

export default TaxonomyDetail;
