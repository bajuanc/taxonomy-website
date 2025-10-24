import { useEffect, useState, useMemo } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ReactCountryFlag from "react-country-flag";
import { getFlagCodeFromAny } from "../utils/flags";

const CONTINENTS = [
  "Europe",
  "Asia",
  "Africa",
  "Latin America and the Caribbean",
  "Oceania",
  "Middle East",
  "Other",
];

const cc = (code) => (code ? String(code).trim().toUpperCase() : "");

// Normalize API region strings into canonical buckets
const normalizeRegion = (raw) => {
  if (!raw) return "Other";
  const n = String(raw).trim().toLowerCase();

  if (n === "europe" || n.includes("eu")) return "Europe";
  if (n === "asia" || n.includes("asian")) return "Asia";
  if (n === "africa" || n.includes("afric")) return "Africa";
  if (
    n === "americas" ||
    n === "lac" ||
    n.includes("latin america") ||
    n.includes("caribbean") ||
    n.includes("latam")
  )
    return "Latin America and the Caribbean";
  if (n === "oceania" || n.includes("australia")) return "Oceania";
  if (n === "middle east" || n.includes("middle-east") || n.includes("gcc")) return "Middle East";
  return "Other";
};

const TaxonomyList = () => {
  const [taxonomies, setTaxonomies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("taxonomies/")
      .then((res) => setTaxonomies(res.data || []))
      .catch((err) => console.error("Error fetching taxonomies:", err))
      .finally(() => setLoading(false));
  }, []);

  // Group by normalized region
  const grouped = useMemo(() => {
    const buckets = {};
    for (const t of taxonomies) {
      const region = normalizeRegion(t.region);
      if (!buckets[region]) buckets[region] = [];
      buckets[region].push(t);
    }
    return buckets;
  }, [taxonomies]);

  return (
    <>
      {loading ? (
        <Container sx={{ textAlign: "center", mt: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading taxonomies...
          </Typography>
        </Container>
      ) : (
        <Container sx={{ mt: 4, mb: 6 }}>
          <Typography variant="h4" gutterBottom>
            Taxonomies
          </Typography>

          {CONTINENTS.filter((c) => grouped[c]?.length).map((continent) => (
            <Accordion key={continent} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">{continent}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  {grouped[continent].map((taxonomy) => (
                    <Grid item xs={12} sm={6} md={4} key={taxonomy.id}>
                      <Card
                        elevation={3}
                        sx={{
                          height: "100%",
                          transition: "transform .2s ease, box-shadow .2s ease",
                          "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                        }}
                      >
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {(() => {
                              const flagCode = getFlagCodeFromAny(taxonomy);
                              return flagCode ? (
                                <ReactCountryFlag
                                  countryCode={flagCode}
                                  svg
                                  style={{ width: "1.2em", height: "1.2em", borderRadius: 3 }}
                                  title={flagCode}
                                />
                              ) : null;
                            })()}
                            
                            {taxonomy.name}
                          </Typography>

                          <Typography variant="body2" sx={{ minHeight: 60 }} color="text.secondary">
                            {taxonomy.description || "No description provided."}
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Button variant="contained" fullWidth component={Link} to={`/taxonomies/${taxonomy.id}`}>
                              Explore
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Container>
      )}
    </>
  );
};

export default TaxonomyList;
