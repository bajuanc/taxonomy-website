// frontend/src/components/Header.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Typography,
  Button,
  Menu,
  MenuItem,
  Divider,
  Grid,
  CircularProgress,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Link as RouterLink, NavLink, useLocation } from "react-router-dom";
import api from "../api/axios";
import ReactCountryFlag from "react-country-flag";
import { getFlagCodeFromAny } from "../utils/flags";

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

export default function Header() {
  const location = useLocation();

  // Desktop dropdown
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  // Mobile drawer
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleMobile = (next) => () => setMobileOpen(Boolean(next));

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
    <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: "1px solid #E0E6EA" }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1, gap: 1, alignItems: "center" }}>
          {/* Left: logo + wordmark */}
          <Box
            component={RouterLink}
            to="/"
            sx={{ display: "flex", alignItems: "center", textDecoration: "none", color: "inherit", mr: 2 }}
            aria-label="Go to home"
          >
            <Box component="img" src="/ambire-logo.png" alt="Ambire logo" sx={{ height: 45, width: "auto", mr: 1 }} />
            <Typography
              variant="h6"
              sx={{ fontFamily: '"Abel","Poppins",system-ui', fontWeight: 400, color: "text.primary" }}
            >
              LAC Taxonomy compass
            </Typography>
          </Box>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Right: desktop menu */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1 }}>
            <Button component={NavLink} to="/" color={isHome ? "primary" : "inherit"} sx={{ fontWeight: isHome ? 700 : 500 }}>
              Home
            </Button>

            <Button
              id="taxonomies-menu-button"
              aria-controls={open ? "taxonomies-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
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
          </Box>

          {/* Right: mobile hamburger */}
          <IconButton
            edge="end"
            onClick={toggleMobile(true)}
            sx={{ display: { xs: "inline-flex", md: "none" } }}
            aria-label="Open menu"
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </Container>

      {/* Desktop dropdown menu (Taxonomies) */}
      <Menu
        id="taxonomies-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
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
          <Button size="small" component={RouterLink} to="/taxonomies" onClick={handleClose}>
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
                        component={RouterLink}
                        to={`/taxonomies/${t.id}`}
                        onClick={handleClose}
                        sx={{
                          borderRadius: 1,
                          "&:hover": { bgcolor: "action.hover" },
                          whiteSpace: "normal",
                          py: 1,
                          gap: 1,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {(() => {
                          const flagCode = getFlagCodeFromAny(t);
                          return flagCode ? (
                            <ReactCountryFlag
                              countryCode={flagCode}
                              svg
                              style={{ width: "1.1em", height: "1.1em", borderRadius: 3 }}
                              title={flagCode}
                            />
                          ) : null;
                        })()}
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

      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={toggleMobile(false)}
        PaperProps={{ sx: { width: "88vw", maxWidth: 420 } }}
      >
        <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <Box component="img" src="/ambire-logo.png" alt="Ambire logo" sx={{ height: 24, width: "auto" }} />
          <Typography variant="h6" sx={{ fontFamily: '"Abel","Poppins",system-ui', fontWeight: 400 }}>
            Menu
          </Typography>
        </Box>
        <Divider />
        <List sx={{ p: 1 }}>
          <ListItemButton component={RouterLink} to="/" onClick={toggleMobile(false)} selected={isHome}>
            <ListItemText primary="Home" />
          </ListItemButton>

          <Accordion disableGutters elevation={0} sx={{ bgcolor: "transparent" }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: isTax ? 700 : 500 }}>Taxonomies</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {loadingTx ? (
                <Box sx={{ py: 2, textAlign: "center" }}>
                  <CircularProgress size={20} />
                </Box>
              ) : loadErr ? (
                <Typography color="error" sx={{ px: 1, pb: 1 }}>
                  Failed to load: {loadErr}
                </Typography>
              ) : (
                regionsToRender.map((region) => (
                  <Box key={region} sx={{ mb: 1 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", px: 1 }}>
                      {region}
                    </Typography>
                    {grouped[region].map((t) => (
                      <ListItemButton
                        key={t.id}
                        component={RouterLink}
                        to={`/taxonomies/${t.id}`}
                        onClick={toggleMobile(false)}
                        sx={{ pl: 2 }}
                      >
                        <ListItemText primary={t.name} />
                      </ListItemButton>
                    ))}
                  </Box>
                ))
              )}
              <Divider sx={{ my: 1 }} />
              <ListItemButton component={RouterLink} to="/taxonomies" onClick={toggleMobile(false)}>
                <ListItemText primary="View all taxonomies" />
              </ListItemButton>
            </AccordionDetails>
          </Accordion>

          <ListItemButton
            component={RouterLink}
            to="/objectives"
            onClick={toggleMobile(false)}
            selected={location.pathname.startsWith("/objectives")}
          >
            <ListItemText primary="Objectives" />
          </ListItemButton>

          <ListItemButton
            component={RouterLink}
            to="/project-review"
            onClick={toggleMobile(false)}
            selected={location.pathname.startsWith("/project-review")}
          >
            <ListItemText primary="Project Review" />
          </ListItemButton>
        </List>
      </Drawer>
    </AppBar>
  );
}
