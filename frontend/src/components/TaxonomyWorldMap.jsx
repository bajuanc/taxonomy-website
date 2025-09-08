import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Chip, useTheme, Tooltip } from "@mui/material";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import api from "../api/axios";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const cc = (code) => (code ? String(code).trim().toUpperCase() : "");

/** EU members */
const EU_ISO2 = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU",
  "IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE"
]);

/** Normalized EU names as they often appear in world-atlas */
const EU_NAMES = new Set([
  "austria","belgium","bulgaria","croatia","cyprus","czechia","denmark",
  "estonia","finland","france","germany","greece","hungary","ireland",
  "italy","latvia","lithuania","luxembourg","malta","netherlands","poland",
  "portugal","romania","slovakia","slovenia","spain","sweden"
]);

/** normalize strings: lowercase, strip accents, remove punctuation */
const norm = (s = "") =>
  s.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** alias helper to align variations / languages */
const alias = (n) => {
  if (!n) return n;
  // Spanish ↔ English + common abbreviations
  if (n === "republica dominicana" || n === "dominican rep") return "dominican republic";
  if (n === "emiratos arabes unidos") return "united arab emirates";
  if (n === "cote divoire" || n === "cote d ivoire") return "ivory coast";
  if (n === "czech republic") return "czechia";
  return n;
};

const iso2Of = (props = {}) => {
  const cand = props.ISO_A2_EH || props.ISO_A2 || props.iso_a2 || props.ISO2 || null;
  if (cand && cand !== "-99") return String(cand).toUpperCase();
  return null;
};

const nameOf = (props = {}) => {
  const raw = props.NAME_LONG || props.NAME || props.ADMIN || props.name || "";
  return alias(norm(raw));
};

export default function TaxonomyWorldMap() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [taxonomies, setTaxonomies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("taxonomies/");
        if (!cancelled) setTaxonomies(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // National taxonomies: ISO code -> taxonomy
  const byCode = useMemo(() => {
    const m = new Map();
    for (const t of taxonomies) {
      const code = cc(t.country_code);
      if (!code || code === "EU") continue;
      if (!m.has(code)) m.set(code, t);
    }
    return m;
  }, [taxonomies]);

  // National taxonomies: normalized name -> taxonomy
  const byName = useMemo(() => {
    const m = new Map();
    for (const t of taxonomies) {
      if (cc(t.country_code) === "EU") continue;
      const n = alias(norm(t.name || ""));
      if (n && !m.has(n)) m.set(n, t);
    }
    return m;
  }, [taxonomies]);

  // EU taxonomy present?
  const euTaxonomy = useMemo(
    () => taxonomies.find((t) => cc(t.country_code) === "EU"),
    [taxonomies]
  );

  const colorBase = theme.palette.grey[300];
  const colorHover = theme.palette.action.hover;
  const colorActive = theme.palette.primary.light;
  const colorStroke = theme.palette.divider;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "background.paper", boxShadow: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>Browse by map</Typography>
        <Chip size="small" label={loading ? "Loading…" : `${taxonomies.length} taxonomies`} />
      </Box>

      {/* Static (no pan/zoom) */}
      <Box sx={{ width: "100%", overflow: "hidden" }}>
        <ComposableMap projectionConfig={{ scale: 155 }} style={{ width: "100%", height: "auto" }}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const iso2 = iso2Of(geo.properties);
                const mapName = nameOf(geo.properties);

                // 1) Prefer any national taxonomy (code or name)
                let tax =
                  (iso2 && byCode.get(iso2)) ||
                  (mapName && byName.get(mapName));

                // 2) Otherwise, if we have EU taxonomy and this country is an EU member, use EU
                if (!tax && euTaxonomy && ((iso2 && EU_ISO2.has(iso2)) || EU_NAMES.has(mapName))) {
                  tax = euTaxonomy;
                }

                const clickable = Boolean(tax);

                const cell = (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => clickable && navigate(`/taxonomies/${tax.id}`)}
                    style={{
                      default: {
                        fill: clickable ? colorActive : colorBase,
                        stroke: colorStroke,
                        strokeWidth: 0.5,
                        outline: "none",
                        cursor: clickable ? "pointer" : "default",
                      },
                      hover: {
                        fill: clickable ? theme.palette.primary.main : colorHover,
                        stroke: colorStroke,
                        strokeWidth: 0.6,
                        outline: "none",
                        cursor: clickable ? "pointer" : "default",
                      },
                      pressed: { fill: theme.palette.primary.dark, outline: "none" },
                    }}
                  />
                );

                return clickable ? (
                  <Tooltip key={geo.rsmKey} title={`Open ${tax.name}`}>
                    {cell}
                  </Tooltip>
                ) : (
                  cell
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </Box>

      <Box sx={{ mt: 1.5, display: "flex", gap: 2, flexWrap: "wrap", color: "text.secondary" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: colorActive }} />
          <Typography variant="caption">Taxonomy available (incl. EU)</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: colorBase }} />
          <Typography variant="caption">No taxonomy yet</Typography>
        </Box>
      </Box>
    </Box>
  );
}
