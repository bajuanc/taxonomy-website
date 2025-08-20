import React, { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Divider,
  Grid,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import ReactCountryFlag from "react-country-flag";

const cc = (code) => (code ? String(code).trim().toUpperCase() : "");

const ORDER = [
  "Europe",
  "Asia",
  "Africa",
  "Latin America and the Caribbean",
  "Oceania",
  "Middle East",
  "Other",
];

const normalizeRegion = (raw) => {
  if (!raw) return "Other";
  const n = String(raw).trim().toLowerCase();
  if (n === "europe" || n.includes("eu")) return "Europe";
  if (n === "asia" || n.includes("asian")) return "Asia";
  if (n === "africa" || n.includes("afric")) return "Africa";
  if (n === "americas" || n === "lac" || n.includes("latin america") || n.includes("caribbean") || n.includes("latam"))
    return "Latin America and the Caribbean";
  if (n === "oceania" || n.includes("australia")) return "Oceania";
  if (n === "middle east" || n.includes("middle-east") || n.includes("gcc")) return "Middle East";
  return "Other";
};

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const [taxonomies, setTaxonomies] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [loadErr, setLoadErr] = useState(null);

  useEffect(() => {
    setLoadingTx(true);
    api
      .get("taxonomies/")
      .then((res) => setTaxonomies(res.data || []))
      .catch((err) => setLoadErr(err?.message || "Failed to load"))
      .finally(() => setLoadingTx(false));
  }, []);

  const grouped = useMemo(() => {
    const b = {};
    for (const t of taxonomies) {
      const region = normalizeRegion(t.region);
      if (!b[region]) b[region] = [];
      b[region].push(t);
    }
    return b;
  }, [taxonomies]);

  const regionsToRender = useMemo(() => {
    const known = ORDER.filter((r) => grouped[r]?.length);
    const extras = Object.keys(grouped).filter((r) => !ORDER.includes(r)).sort();
    return [...known, ...extras];
  }, [grouped]);

  const isHome = location.pathname === "/";
  const isTax = location.pathname.startsWith("/taxonomies");

  return (
    <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: "1px solid #eee" }}>
      {/* Row 1: same width as pages, no gutters, left-aligned title, search right */}
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
            <Typography
              component={Link}
              to="/"
              variant="h6"
              sx={{ textDecoration: "none", color: "inherit", fontWeight: 700 }}
            >
              Taxonomy Navigator
            </Typography>

            <TextField
              size="small"
              placeholder="Search for an activity"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 360, maxWidth: "60vw", ml: "auto" }} // <- pushes search to the right
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => navigate("/taxonomies")}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Toolbar>
      </Container>

      {/* Row 2: same container/disableGutters so left edge matches page content */}
      <Box sx={{ borderTop: "1px solid #eee" }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 0.5, gap: 1 }}>
            <Button
              component={NavLink}
              to="/"
              color={isHome ? "primary" : "inherit"}
              sx={{ fontWeight: isHome ? 700 : 500 }}
            >
              Home
            </Button>

            <Button
              endIcon={<KeyboardArrowDownIcon />}
              onClick={handleOpen}
              color={isTax ? "primary" : "inherit"}
              sx={{ fontWeight: isTax ? 700 : 500 }}
            >
              Taxonomies
            </Button>

            <Button
              component={NavLink}
              to="/objectives"
              color={location.pathname.startsWith("/objectives") ? "primary" : "inherit"}
              sx={{ fontWeight: location.pathname.startsWith("/objectives") ? 700 : 500 }}
            >
              Objectives
            </Button>


            <Button
              component={NavLink}
              to="/project-review"
              color={location.pathname.startsWith("/project-review") ? "primary" : "inherit"}
              sx={{ fontWeight: location.pathname.startsWith("/project-review") ? 700 : 500 }}
            >
              Project Review
            </Button>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              PaperProps={{
                sx: {
                  p: 2,
                  width: { xs: "90vw", sm: "80vw", md: 900 },
                  maxWidth: "90vw",
                  maxHeight: "70vh",
                  overflowY: "auto",
                },
              }}
            >
              <Box sx={{ px: 1, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Browse by region
                </Typography>
                <Button size="small" component={Link} to="/taxonomies" onClick={handleClose}>
                  View all taxonomies
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {loadingTx ? (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <CircularProgress size={22} />
                </Box>
              ) : loadErr ? (
                <Box sx={{ p: 2 }}>
                  <Typography color="error">Failed to load: {loadErr}</Typography>
                </Box>
              ) : (
                <Box sx={{ px: 1 }}>
                  {regionsToRender.map((region) => (
                    <Box key={region} sx={{ mb: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ mb: 0.5, color: "text.secondary" }}>
                        {region}
                      </Typography>
                      <Grid container spacing={0.5}>
                        {grouped[region].map((t) => (
                          <Grid item xs={12} sm={6} md={4} key={t.id}>
                            <MenuItem
                              component={Link}
                              to={`/taxonomies/${t.id}`}
                              onClick={handleClose}
                              sx={{
                                borderRadius: 1,
                                "&:hover": { bgcolor: "action.hover" },
                                whiteSpace: "normal",
                                py: 1,
                                gap: 1.0,                  // add a bit of gap
                                display: "flex",          // align flag + text nicely
                                alignItems: "center",
                              }}
                            >
                              {cc(t.country_code) && (
                                <ReactCountryFlag
                                  countryCode={cc(t.country_code)}
                                  svg
                                  style={{ width: "1.1em", height: "1.1em", borderRadius: 3 }}
                                  title={cc(t.country_code)}
                                />
                              )}
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {t.name}
                              </Typography>
                            </MenuItem>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </Box>
              )}
            </Menu>
          </Toolbar>
        </Container>
      </Box>
    </AppBar>
  );
};

export default Header;
