// frontend/src/pages/TaxonomyDetail.jsx
import { useParams, Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
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
  Breadcrumbs,
  Chip,
  Divider,
  Link as MuiLink,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

// Icons for sector tiles (tu mapeo existente)
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

import ReactCountryFlag from "react-country-flag";
import { getFlagCodeFromAny } from "../utils/flags";

const TILE_MIN_HEIGHT = 112;

const TaxonomyDetail = () => {
  const { id } = useParams();

  const [taxonomy, setTaxonomy] = useState(null);
  const [objectives, setObjectives] = useState([]);
  const [selectedObjective, setSelectedObjective] = useState(null);

  const [sectors, setSectors] = useState([]);
  const [sectorsLoading, setSectorsLoading] = useState(false);

  const [objectiveSectorCounts, setObjectiveSectorCounts] = useState({}); // { [objectiveId]: number }
  const [countsLoading, setCountsLoading] = useState(false);

  // Adaptation extra (Case 2 & 3)
  const [adaptationWhitelistGroups, setAdaptationWhitelistGroups] = useState([]); // [{ sector:{id,name}, entries:[...] }]
  const [adaptationGeneralCriteria, setAdaptationGeneralCriteria] = useState([]); // [{...}]
  const [detailFetched, setDetailFetched] = useState(false); // evita múltiples fetch del detail

  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();
  const cameFromObjectives = location.state?.fromObjectivesMatrix === true;

  // --- Fetch taxonomy + objectives
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
        const response = await api.get(`taxonomies/${id}/environmental-objectives/`);
        const list = response?.data || [];
        setObjectives(list);
      } catch (error) {
        console.error("Error fetching objectives:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTaxonomy();
    fetchObjectives();
  }, [id]);

  // --- Preselect from router state (ObjectivesMatrix)
  useEffect(() => {
    const preId = location.state?.preselectObjectiveId;
    if (!preId || objectives.length === 0) return;
    const found = objectives.find((o) => String(o.id) === String(preId));
    if (found) setSelectedObjective(found);
  }, [objectives, location.state]);

  // --- Fetch sector counts per objective (for the small "X sectors" badge)
  useEffect(() => {
    const loadCounts = async () => {
      if (!objectives?.length) return;
      try {
        setCountsLoading(true);
        const pairs = await Promise.all(
          objectives.map(async (o) => {
            try {
              const res = await api.get(`taxonomies/${id}/objectives/${o.id}/sectors/`);
              const arr = Array.isArray(res?.data) ? res.data : [];
              return [o.id, arr.length];
            } catch {
              return [o.id, 0];
            }
          })
        );
        const map = {};
        for (const [oid, cnt] of pairs) map[oid] = cnt;
        setObjectiveSectorCounts(map);
      } finally {
        setCountsLoading(false);
      }
    };
    loadCounts();
  }, [id, objectives]);

  // --- Load sectors for the selected objective
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

  // --- If Adaptation objective: fetch detail once and extract Case2/Case3 for this objective
  useEffect(() => {
    const isAdaptation = !!selectedObjective?.name?.toLowerCase().includes("adapt");
    if (!isAdaptation) {
      setAdaptationWhitelistGroups([]);
      setAdaptationGeneralCriteria([]);
      return;
    }

    const fetchDetail = async () => {
      try {
        const res = await api.get(`taxonomies/${id}/detail/`);
        const data = res?.data;
        // Busca lista de objetivos dentro del detail (flexible a estructura)
        const candidates =
          data?.objectives ||
          data?.environmental_objectives ||
          data?.results ||
          [];

        const match =
          candidates.find?.((o) => String(o?.id) === String(selectedObjective.id)) || null;

        if (match) {
          setAdaptationWhitelistGroups(match.adaptation_whitelists || []);
          setAdaptationGeneralCriteria(match.adaptation_general_criteria || []);
        } else {
          // Fallback: limpia si no hay match
          setAdaptationWhitelistGroups([]);
          setAdaptationGeneralCriteria([]);
        }
      } catch (e) {
        console.warn("Detail endpoint not available or different shape:", e?.message);
        setAdaptationWhitelistGroups([]);
        setAdaptationGeneralCriteria([]);
      } finally {
        setDetailFetched(true);
      }
    };

    // Evita múltiples fetch si ya lo trajimos una vez; igual refrescamos al cambiar objetivo
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, selectedObjective]);

  // -------- icon mapper helpers (EN + ES), accent-insensitive
  const normalizeName = (s = "") =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const hasAny = (n, keywords) => keywords.some((k) => n.includes(k));

  const iconForSector = (name = "") => {
    const n = normalizeName(name);

    // Energy / Power
    if (hasAny(n, ["solar", "fotovolta"])) return SolarPowerIcon;
    if (hasAny(n, ["wind", "eolic", "eolico", "eolica"])) return WindPowerIcon;
    if (hasAny(n, ["energy", "energia", "energet", "electric", "electricidad", "power", "grid", "generation", "generacion", "renovable", "renewable", "hydrogen", "hidrogeno", "fuel"])) return BoltIcon;

    // Transport / Mobility
    if (hasAny(n, ["rail", "ferrocarril", "tren"])) return TrainIcon;
    if (hasAny(n, ["aviation", "flight", "aereo", "aviacion", "aeropuerto"])) return FlightIcon;
    if (hasAny(n, ["shipping", "logistic", "freight", "barco", "maritimo"])) return LocalShippingIcon;
    if (hasAny(n, ["transport", "transporte", "movilidad", "bus", "vehiculo"])) return DirectionsBusIcon;

    // Buildings / Construction
    if (hasAny(n, ["construction", "construccion", "building", "buildings", "edificacion", "vivienda", "real estate", "housing"])) return HomeWorkIcon;
    if (hasAny(n, ["arquitect", "architecture"])) return ArchitectureIcon;

    // Manufacturing / Industry
    if (hasAny(n, ["manufacturing", "manufactur", "manufactura", "fabricacion", "industr", "industrial", "machinery", "factory"])) return PrecisionManufacturingIcon;
    if (hasAny(n, ["maintenance", "mantenimiento", "repair", "reparacion", "equipment", "equipamiento", "tools", "herramient"])) return BuildIcon;

    // Agriculture / Forestry / Nature
    if (hasAny(n, ["agri", "agricultura", "forestry", "forestal", "farming", "ganader", "land use", "uso del suelo"])) return AgricultureIcon;
    if (hasAny(n, ["park", "parque", "naturaleza", "ecosystem", "ecosistema", "biodiversity", "biodiversidad", "protec"])) return ParkIcon;

    // Waste / Emissions
    if (hasAny(n, ["waste", "residuo", "basura", "desech", "recicl", "circular"])) return RecyclingIcon;
    if (hasAny(n, ["emission", "emisiones", "captura", "limpieza", "clean-up"])) return DeleteSweepIcon;

    // Water
    if (hasAny(n, ["water", "wastewater", "desal", "agua", "potable", "residual", "alcantarill", "saneamiento"])) return WaterDropIcon;

    // ICT / Digital
    if (hasAny(n, ["ict", "it ", " information ", "communications", "technology", "tic", "tecnologias de la informacion", "tecnologia", "informa", "comunicacion", "digital", "software", "cloud", "data"])) return MemoryIcon;
    if (hasAny(n, ["network", "telecom", "server", "dns", "red"])) return DnsIcon;

    // Finance / Services
    if (hasAny(n, ["finance", "financial", "bank", "loan", "investment", "finanzas", "banca", "credito", "inversion"])) return AccountBalanceIcon;
    if (hasAny(n, ["services", "servicios", "consult", "business"])) return BusinessCenterIcon;

    // Mining / Materials
    if (hasAny(n, ["mining", "mineria", "materiales", "cement", "concrete", "quarry"])) return ConstructionIcon;
    if (hasAny(n, ["geologia", "soil", "terrain"])) return TerrainIcon;

    // Health / Education
    if (hasAny(n, ["health", "salud", "hospital", "medical"])) return LocalHospitalIcon;
    if (hasAny(n, ["education", "educacion", "school", "training", "formacion", "scien"])) return SchoolIcon;

    // Chemicals / Science / Textiles / Tourism
    if (hasAny(n, ["chemic", "quimic", "laboratorio", "science"])) return ScienceIcon;
    if (hasAny(n, ["textil", "garment", "apparel", "confeccion"])) return CheckroomIcon;
    if (hasAny(n, ["tourism", "turismo", "hotel", "hospitality", "accommodation"])) return HotelIcon;
    if (hasAny(n, ["beach", "coast", "mar", "ocean", "oceano"])) return BeachAccessIcon;

    // Disaster Risk Management
    if (hasAny(n, ["disaster risk", "disaster management", "risk management", "hazard", "emergency", "resilience", "preparedness", "gestion del riesgo", "gestion de riesgo", "gestion de desastres", "gestion del riesgo de desastres", "riesgo de desastre", "desastre", "emergencia", "resiliencia", "prevencion del riesgo", "prevencion de desastres"])) return CrisisAlertIcon;

    // Fallback
    return CategoryIcon;
  };

  // Skeleton tiles while sectors load (mantienen layout y ancho/alto)
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
              <Skeleton variant="rounded" width={72} height={20} />
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

  const flagCode = getFlagCodeFromAny(taxonomy);
  const isAdaptation = !!selectedObjective?.name?.toLowerCase().includes("adapt");

  return (
    <Container sx={{ mt: 2, mb: 6 }}>
      {/* Breadcrumb moderno */}
      <Box
        sx={(theme) => ({
          display: "inline-block",
          px: 1.5,
          py: 0.75,
          mb: 1.5,
          borderRadius: 500,
          bgcolor: theme.palette.mode === "light" ? "grey.100" : "grey.900",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        })}
      >
        <Breadcrumbs
          aria-label="breadcrumbs"
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{
            "& a": { textDecoration: "none", fontWeight: 500 },
            "& .MuiBreadcrumbs-separator": { mx: 1 },
          }}
        >
          <MuiLink component={RouterLink} to="/taxonomies" color="text.primary">
            Taxonomies
          </MuiLink>
          <Typography color="text.secondary" sx={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {taxonomy?.name}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Título + bandera */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        {flagCode ? (
          <ReactCountryFlag
            countryCode={flagCode}
            svg
            style={{ width: "1.4em", height: "1.4em", borderRadius: 3 }}
            title={flagCode}
          />
        ) : null}
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          {taxonomy?.name} Taxonomy
        </Typography>
      </Box>

      {/* --- META BLOCK --- */}
      <Card
        elevation={0}
        sx={{
          mt: 2,
          mb: 4,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1.5,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
            p: 2,
          }}
        >
          {taxonomy?.region && (
            <Box>
              <Typography variant="overline" color="text.secondary">
                Region
              </Typography>
              <Typography variant="body1">{taxonomy.region}</Typography>
            </Box>
          )}
          {taxonomy?.language && (
            <Box>
              <Typography variant="overline" color="text.secondary">
                Language
              </Typography>
              <Typography variant="body1">{taxonomy.language}</Typography>
            </Box>
          )}
          {taxonomy?.published_on && (
            <Box>
              <Typography variant="overline" color="text.secondary">
                Published on
              </Typography>
              <Typography variant="body1">
                {new Date(taxonomy.published_on).toLocaleDateString()}
              </Typography>
            </Box>
          )}
          {taxonomy?.description && (
            <Box sx={{ gridColumn: { xs: "1/2", sm: "1/3" } }}>
              <Typography variant="overline" color="text.secondary">
                Description
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
                title={taxonomy.description}
              >
                {taxonomy.description}
              </Typography>
            </Box>
          )}
        </Box>
      </Card>

      {/* --- OBJECTIVES BLOCK --- */}
      <Typography variant="h5" sx={{ mt: 2 }} gutterBottom>
        Environmental objectives
      </Typography>

      <Grid container spacing={3}>
        {objectives.map((objective) => {
          const selected = selectedObjective?.id === objective.id;
          const count = objectiveSectorCounts[objective.id];
          return (
            <Grid item xs={12} sm={6} md={4} key={objective.id}>
              <Card
                elevation={selected ? 6 : 2}
                sx={{
                  cursor: "pointer",
                  width: "100%",
                  height: "100%",
                  border: selected ? "2px solid" : "1px solid",
                  borderColor: selected ? "primary.main" : "divider",
                  bgcolor: selected ? "action.hover" : "background.paper",
                  transition: "all 0.2s ease",
                }}
                onClick={() => setSelectedObjective(objective)}
              >
                <CardActionArea
                  sx={{
                    minHeight: 72,
                    px: 2,
                    py: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ m: 0, pr: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {objective.display_name ?? objective.generic_name}
                  </Typography>

                  {/* Badge de sectores */}
                  {countsLoading && count === undefined ? (
                    <Skeleton variant="rounded" width={88} height={22} />
                  ) : count !== undefined ? (
                    <Chip size="small" label={`${count} sectors`} color={selected ? "primary" : "default"} />
                  ) : null}
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* --- CONTENT BLOCKS (dependen del objetivo seleccionado) --- */}
      {selectedObjective && (
        <Box sx={{ mt: 4 }}>
          {/* Si NO es Adaptation: solo sectores */}
          {!isAdaptation && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Sectors for: <strong>{selectedObjective.display_name ?? selectedObjective.generic_name}</strong>
              </Typography>

              {/* Contenedor centrado, 2 columnas iguales */}
              <Box sx={{ maxWidth: 960, mx: "auto" }}>
                <Grid container spacing={2} alignItems="stretch">
                  {sectorsLoading
                    ? SectorSkeletons
                    : (sectors.length > 0
                      ? sectors.map((sector) => {
                        const Icon = iconForSector(sector.name); // <- define Icon aquí
                        return (
                          <Grid item xs={12} sm={6} md={6} key={sector.id} sx={{ display: "flex" }}>
                            <Card
                              sx={{
                                width: "100%",
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
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                      }}
                                      title={sector.name}
                                    >
                                      {sector.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      View activities
                                    </Typography>
                                  </Box>
                                </Box>

                                {/* Right: optional activities badge + chevron */}
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  {typeof sector.activity_count === "number" && (
                                    <Chip size="small" label={`${sector.activity_count} activities`} />
                                  )}
                                  <ChevronRightIcon sx={{ color: "action.active", flexShrink: 0 }} />
                                </Box>
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
                      )
                    )
                  }
                </Grid>
              </Box>
            </>

          )}

          {/* Si es Adaptation: tres secciones */}
          
          {isAdaptation && (
            <>
              {/* --- Section A: Sectors (Case 1) --- */}
              <Typography variant="h6" sx={{ mb: 1 }}>
                Sectors
              </Typography>
              <Divider sx={{ mb: 2 }} />

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
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                      }}
                                      title={sector.name}
                                    >
                                      {sector.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      View activities
                                    </Typography>
                                  </Box>
                                </Box>
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

              {/* --- Section B: Adaptation whitelist (Case 2) --- */}
              <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
                Adaptation whitelist
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ maxWidth: 960, mx: "auto" }}>
                <Grid container spacing={2} justifyContent="center">
                  {(adaptationWhitelistGroups || []).length > 0 ? (
                    adaptationWhitelistGroups.map((group) => {
                      const s = group?.sector || {};
                      const Icon = iconForSector(s?.name || "");
                      return (
                        <Grid item xs={12} sm={6} md={6} key={`wl-${s.id}`}>
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
                              to={`/taxonomies/${id}/objectives/${selectedObjective.id}/whitelist/${s.id}`}
                              aria-label={`Open whitelist for ${s.name}`}
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
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                    }}
                                    title={s.name}
                                  >
                                    {s.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    View whitelist
                                  </Typography>
                                </Box>
                              </Box>

                              <ChevronRightIcon sx={{ color: "action.active", flexShrink: 0 }} />
                            </CardActionArea>
                          </Card>
                        </Grid>
                      );
                    })
                  ) : detailFetched ? (
                    <Grid item xs={12}>
                      <Typography color="text.secondary">
                        No whitelist records for this objective.
                      </Typography>
                    </Grid>
                  ) : (
                    SectorSkeletons /* reuso skeleton para coherencia visual */
                  )}
                </Grid>
              </Box>

              {/* --- Section C: General criteria (Case 3) --- */}
              <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
                General criteria
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Button
                  component={RouterLink}
                  to={`/taxonomies/${id}/objectives/${selectedObjective.id}/general-criteria`}
                  variant="outlined"
                >
                  View general criteria
                </Button>
              </Box>
            </>
          )}
        </Box>
      )}
    </Container>
  );
};

export default TaxonomyDetail;
