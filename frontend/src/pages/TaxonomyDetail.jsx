// frontend/src/pages/TaxonomyDetail.jsx
import { useParams, Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import api from "../api/axios";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CircularProgress,
  Box,
  Button,
  Skeleton,
} from "@mui/material";

// Icons for sector tiles
import BoltIcon from "@mui/icons-material/Bolt";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import WindPowerIcon from "@mui/icons-material/WindPower";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import TrainIcon from "@mui/icons-material/Train";
import FlightIcon from "@mui/icons-material/Flight";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import ArchitectureIcon from "@mui/icons-material/Architecture";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import BuildIcon from "@mui/icons-material/Build";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import ParkIcon from "@mui/icons-material/Park";
import RecyclingIcon from "@mui/icons-material/Recycling";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import OpacityIcon from "@mui/icons-material/Opacity";
import MemoryIcon from "@mui/icons-material/Memory";
import DnsIcon from "@mui/icons-material/Dns";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import ConstructionIcon from "@mui/icons-material/Construction";
import TerrainIcon from "@mui/icons-material/Terrain";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import SchoolIcon from "@mui/icons-material/School";
import ScienceIcon from "@mui/icons-material/Science";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import HotelIcon from "@mui/icons-material/Hotel";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import CategoryIcon from "@mui/icons-material/Category";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CrisisAlertIcon from "@mui/icons-material/CrisisAlert";

const TILE_MIN_HEIGHT = 112;

const TaxonomyDetail = () => {
  const { id } = useParams();

  const [taxonomy, setTaxonomy] = useState(null);
  const [objectives, setObjectives] = useState([]);
  const [selectedObjective, setSelectedObjective] = useState(null);

  const [sectors, setSectors] = useState([]);
  const [sectorsLoading, setSectorsLoading] = useState(false);

  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();
  const cameFromObjectives = location.state?.fromObjectivesMatrix === true;


  useEffect(() => {
    const fetchTaxonomy = async () => {
      try {
        const response = await api.get(`taxonomies/${id}/`);
        setTaxonomy(response.data);
      } catch (error) {
        console.error("Error fetching taxonomy:", error);
      }
    };

    const fetchObjectives = async () => {
      try {
        const response = await api.get(
          `taxonomies/${id}/environmental-objectives/`
        );
        setObjectives(response.data || []);
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
    if (!selectedObjective) return;
    const fetchSectors = async () => {
      try {
        setSectorsLoading(true);
        const response = await api.get(
          `taxonomies/${id}/objectives/${selectedObjective.id}/sectors/`
        );
        setSectors(response.data || []);
      } catch (error) {
        console.error("Error fetching sectors:", error);
      } finally {
        setSectorsLoading(false);
      }
    };
    fetchSectors();
  }, [selectedObjective, id]);

  useEffect(() => {
    const preId = location.state?.preselectObjectiveId;
    if (!preId || objectives.length === 0) return;
    const found = objectives.find((o) => String(o.id) === String(preId));
    if (found) setSelectedObjective(found);
  }, [objectives, location.state]);


  // -------- icon mapper helpers (EN + ES), accent-insensitive
  const normalizeName = (s = "") =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const hasAny = (n, keywords) => keywords.some((k) => n.includes(k));

  const iconForSector = (name = "") => {
    const n = normalizeName(name);

    // Energy / Power
    if (hasAny(n, ["solar", "fotovolta"])) return SolarPowerIcon;
    if (hasAny(n, ["wind", "eolic", "eolico", "eolica"])) return WindPowerIcon;
    if (
      hasAny(n, [
        "energy",
        "energia",
        "energet",
        "electric",
        "electricidad",
        "power",
        "grid",
        "generation",
        "generacion",
        "renovable",
        "renewable",
        "hydrogen",
        "hidrogeno",
        "fuel",
      ])
    )
      return BoltIcon;

    // Transport / Mobility
    if (hasAny(n, ["rail", "ferrocarril", "tren"])) return TrainIcon;
    if (hasAny(n, ["aviation", "flight", "aereo", "aviacion", "aeropuerto"]))
      return FlightIcon;
    if (hasAny(n, ["shipping", "logistic", "freight", "barco", "maritimo"]))
      return LocalShippingIcon;
    if (hasAny(n, ["transport", "transporte", "movilidad", "bus", "vehiculo"]))
      return DirectionsBusIcon;

    // Buildings / Construction
    if (
      hasAny(n, [
        "construction",
        "construccion",
        "building",
        "buildings",
        "edificacion",
        "vivienda",
        "real estate",
        "housing",
      ])
    )
      return HomeWorkIcon;
    if (hasAny(n, ["arquitect", "architecture"])) return ArchitectureIcon;

    // Manufacturing / Industry
    if (
      hasAny(n, [
        "manufacturing",
        "manufactur",
        "manufactura",
        "fabricacion",
        "industr",
        "industrial",
        "machinery",
        "factory",
      ])
    )
      return PrecisionManufacturingIcon;
    if (
      hasAny(n, [
        "maintenance",
        "mantenimiento",
        "repair",
        "reparacion",
        "equipment",
        "equipamiento",
        "tools",
        "herramient",
      ])
    )
      return BuildIcon;

    // Agriculture / Forestry / Nature
    if (
      hasAny(n, [
        "agri",
        "agricultura",
        "forestry",
        "forestal",
        "farming",
        "ganader",
        "land use",
        "uso del suelo",
        
      ])
    )
      return AgricultureIcon;
    if (
      hasAny(n, [
        "park",
        "parque",
        "naturaleza",
        "ecosystem",
        "ecosistema",
        "biodiversity",
        "biodiversidad",
        "protec",
      ])
    )
      return ParkIcon;

    // Waste / Emissions
    if (hasAny(n, ["waste", "residuo", "basura", "desech", "recicl", "circular"]))
      return RecyclingIcon;
    if (
      hasAny(n, [
        "emission",
        "emisiones",
        "captura",
        "limpieza",
        "clean-up",
      ])
    )
      return DeleteSweepIcon;

    // Water
    if (
      hasAny(n, [
        "water",
        "wastewater",
        "desal",
        "agua",
        "potable",
        "residual",
        "alcantarill",
        "saneamiento",
      ])
    )
      return WaterDropIcon;

    // ICT / Digital
    if (
      hasAny(n, [
        "ict",
        "it ",
        " information ",
        "communications",
        "technology",
        "tic",
        "tecnologias de la informacion",
        "tecnologia",
        "informa",
        "comunicacion",
        "digital",
        "software",
        "cloud",
        "data",
      ])
    )
      return MemoryIcon;
    if (hasAny(n, ["network", "telecom", "server", "dns", "red"])) return DnsIcon;

    // Finance / Services
    if (
      hasAny(n, [
        "finance",
        "financial",
        "bank",
        "loan",
        "investment",
        "finanzas",
        "banca",
        "credito",
        "inversion",
      ])
    )
      return AccountBalanceIcon;
    if (hasAny(n, ["services", "servicios", "consult", "business"]))
      return BusinessCenterIcon;

    // Mining / Materials
    if (hasAny(n, ["mining", "mineria", "materiales", "cement", "concrete", "quarry"]))
      return ConstructionIcon;
    if (hasAny(n, ["geologia", "soil", "terrain"])) return TerrainIcon;

    // Health / Education
    if (hasAny(n, ["health", "salud", "hospital", "medical"])) return LocalHospitalIcon;
    if (hasAny(n, ["education", "educacion", "school", "training", "formacion", "scien",]))
      return SchoolIcon;

    // Chemicals / Science / Textiles / Tourism
    if (hasAny(n, ["chemic", "quimic", "laboratorio", "science"])) return ScienceIcon;
    if (hasAny(n, ["textil", "garment", "apparel", "confeccion"])) return CheckroomIcon;
    if (hasAny(n, ["tourism", "turismo", "hotel", "hospitality", "accommodation",])) return HotelIcon;
    if (hasAny(n, ["beach", "coast", "mar", "ocean", "oceano"])) return BeachAccessIcon;

    // Disaster Risk Management / Gestión del Riesgo de Desastres
    if (
      hasAny(n, [
        "disaster risk", "disaster management", "risk management", "hazard",
        "emergency", "resilience", "preparedness",
        "gestion del riesgo", "gestion de riesgo", "gestion de desastres",
        "gestion del riesgo de desastres", "riesgo de desastre", "desastre",
        "emergencia", "resiliencia", "prevencion del riesgo", "prevencion de desastres"
      ])
    ) return CrisisAlertIcon;


    // Fallback
    return CategoryIcon;
  };

  // Skeleton tiles while sectors load
  const SectorSkeletons = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => (
        <Grid item xs={12} sm={6} md={6} key={`sk-${i}`}>
          <Card sx={{ height: "100%", border: "1px solid", borderColor: "divider" }}>
            <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, minHeight: TILE_MIN_HEIGHT }}>
              <Skeleton variant="circular" width={48} height={48} />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" width="70%" height={26} />
                <Skeleton variant="text" width="45%" height={18} />
              </Box>
              <Skeleton variant="circular" width={24} height={24} />
            </Box>
          </Card>
        </Grid>
      )),
    []
  );

  if (loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading taxonomy...
        </Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 2, mb: 6 }}>
      <Box sx={{ mb: 1 }}>
        <Button
          variant="outlined"
          onClick={() =>
            cameFromObjectives ? navigate(-1) : navigate("/taxonomies")
          }
        >  
          ← Back {cameFromObjectives ? "to objectives" : "to list"}
        </Button>
      </Box>

      <Typography variant="h4" gutterBottom>
        {taxonomy?.name} Taxonomy
      </Typography>
      <Typography variant="body1" paragraph>
        {taxonomy?.description}
      </Typography>

      <Typography variant="h5" sx={{ mt: 4 }} gutterBottom>
        Environmental Objectives
      </Typography>

      <Grid container spacing={3}>
        {objectives.map((objective) => {
          const selected = selectedObjective?.id === objective.id;
          return (
            <Grid item xs={12} sm={6} md={4} key={objective.id}>
              <Card
                elevation={selected ? 6 : 2}
                sx={{
                  cursor: "pointer",
                  width: "100%",
                  maxWidth: "600px",
                  border: selected ? "2px solid" : "1px solid",
                  borderColor: selected ? "primary.main" : "divider",
                  bgcolor: selected ? "action.hover" : "background.paper",
                  transition: "all 0.3s ease",
                }}
                onClick={() => setSelectedObjective(objective)}
              >
                <CardActionArea
                  sx={{ display: "flex", alignItems: "center", minHeight: 64, px: 2 }}
                >
                  <Typography variant="h6" sx={{ m: 0 }}>
                    {objective.name}
                  </Typography>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {selectedObjective && (
        <>
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Sectors for: <strong>{selectedObjective.name}</strong>
          </Typography>

          {/* Center the grid and keep two columns on sm+ */}
          <Box sx={{ maxWidth: 960, mx: "auto" }}>
            <Grid container spacing={2} justifyContent="center">
              {sectorsLoading
                ? SectorSkeletons
                : sectors.length > 0
                ? sectors.map((sector) => {
                    const Icon = iconForSector(sector.name);
                    return (
                      <Grid item xs={12} sm={6} md={6} key={sector.id}>
                        <Card
                          sx={{
                            height: "100%",
                            border: "1px solid",
                            borderColor: "divider",
                            transition: "transform .2s ease, box-shadow .2s ease",
                            "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                          }}
                        >
                          <CardActionArea
                            component={RouterLink}
                            to={`/taxonomies/${id}/objectives/${selectedObjective.id}/sectors/${sector.id}/activities`}
                            aria-label={`Open ${sector.name} activities`}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              p: 2,
                              minHeight: TILE_MIN_HEIGHT,
                              height: "100%",
                              gap: 2,
                            }}
                          >
                            {/* Left: icon badge + text */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0, flex: 1 }}>
                              <Box
                                sx={(theme) => ({
                                  width: 48,
                                  height: 48,
                                  borderRadius: "50%",
                                  display: "grid",
                                  placeItems: "center",
                                  color: "common.white",
                                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                                  flexShrink: 0,
                                })}
                              >
                                <Icon fontSize="medium" />
                              </Box>

                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  variant="h6"
                                  sx={{
                                    m: 0,
                                    fontFamily: '"Abel","Poppins",system-ui',
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  {sector.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  View activities
                                </Typography>
                              </Box>
                            </Box>

                            {/* Right: chevron */}
                            <ChevronRightIcon sx={{ color: "action.active", flexShrink: 0 }} />
                          </CardActionArea>
                        </Card>
                      </Grid>
                    );
                  })
                : (
                  <Grid item xs={12}>
                    <Typography color="text.secondary">
                      No sectors available for this objective.
                    </Typography>
                  </Grid>
                )}
            </Grid>
          </Box>
        </>
      )}
    </Container>
  );
};

export default TaxonomyDetail;
