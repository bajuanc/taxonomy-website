// frontend/src/pages/ObjectivesMatrix.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Chip, Tooltip
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RemoveIcon from "@mui/icons-material/Remove";
import api from "../api/axios";
import ReactCountryFlag from "react-country-flag"; // optional flags

const cc = (code) => (code ? String(code).trim().toUpperCase() : "");

const ObjectivesMatrix = () => {
  const [loading, setLoading] = useState(true);
  const [taxonomies, setTaxonomies] = useState([]);
  const [objectivesByTaxonomy, setObjectivesByTaxonomy] = useState({}); // { [taxonomyId]: [{id,name}, ...] }
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const txRes = await api.get("taxonomies/");
        const txs = txRes.data || [];
        setTaxonomies(txs);

        // fetch objectives for each taxonomy in parallel
        const pairs = await Promise.all(
          txs.map(async (t) => {
            const res = await api.get(`taxonomies/${t.id}/environmental-objectives/`);
            return [t.id, res.data || []];
          })
        );
        const map = {};
        for (const [id, list] of pairs) map[id] = list;
        setObjectivesByTaxonomy(map);
      } catch (e) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Build the union of all objective names (sorted)
  const allObjectiveNames = useMemo(() => {
    const set = new Set();
    Object.values(objectivesByTaxonomy).forEach((list) =>
      list.forEach((o) => set.add(o.name))
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [objectivesByTaxonomy]);

  const hasObjective = (taxonomyId, objectiveName) =>
    (objectivesByTaxonomy[taxonomyId] || []).some((o) => o.name === objectiveName);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: 2 }}>
        <Typography variant="h4">Environmental Objectives</Typography>
        <Chip label={`Taxonomies: ${taxonomies.length}`} size="small" />
        <Chip label={`Objectives: ${allObjectiveNames.length}`} size="small" />
      </Box>

      {loading ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
          <Table stickyHeader size="small" aria-label="Objectives matrix">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, minWidth: 220 }}>Taxonomy</TableCell>
                {allObjectiveNames.map((obj) => (
                  <TableCell
                    key={obj}
                    align="center"
                    sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                  >
                    {obj}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {taxonomies.map((t) => (
                <TableRow hover key={t.id}>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {cc(t.country_code) && (
                        <ReactCountryFlag
                          countryCode={cc(t.country_code)}
                          svg
                          style={{ width: "1.1em", height: "1.1em", borderRadius: 3 }}
                        />
                      )}
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {t.name}
                      </Typography>
                    </Box>
                  </TableCell>

                  {allObjectiveNames.map((obj) => {
                    const present = hasObjective(t.id, obj);
                    return (
                      <TableCell key={`${t.id}-${obj}`} align="center">
                        {present ? (
                          <Tooltip title="Objective available in this taxonomy">
                            <CheckCircleOutlineIcon fontSize="small" color="success" />
                          </Tooltip>
                        ) : (
                          <RemoveIcon fontSize="small" sx={{ color: "text.disabled" }} />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default ObjectivesMatrix;
