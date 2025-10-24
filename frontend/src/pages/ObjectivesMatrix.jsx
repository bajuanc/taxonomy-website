// frontend/src/pages/ObjectivesMatrix.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Tooltip, IconButton
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RemoveIcon from "@mui/icons-material/Remove";
import { Link as RouterLink } from "react-router-dom";
import api from "../api/axios";
import ReactCountryFlag from "react-country-flag";
import { getFlagCodeFromAny } from "../utils/flags";

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

  const allObjectiveNames = useMemo(() => {
    const set = new Set();
    Object.values(objectivesByTaxonomy).forEach((list) =>
      list.forEach((o) => set.add(o.name))
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [objectivesByTaxonomy]);

  const hasObjective = (taxonomyId, objectiveName) =>
    (objectivesByTaxonomy[taxonomyId] || []).some((o) => o.name === objectiveName);

  const getObjectiveByName = (taxonomyId, objectiveName) =>
    (objectivesByTaxonomy[taxonomyId] || []).find((o) => o.name === objectiveName);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Environmental Objectives
      </Typography>

      {loading ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            overflowX: "auto",
            borderRadius: 2,
          }}
        >
          <Table stickyHeader size="small" aria-label="Objectives matrix">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    minWidth: 220,
                    position: "sticky",
                    left: 0,
                    zIndex: 2,
                    bgcolor: "background.paper",
                  }}
                >
                  Taxonomy
                </TableCell>
                {allObjectiveNames.map((obj) => (
                  <TableCell
                    key={obj}
                    align="center"
                    sx={{
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      minWidth: 140,
                    }}
                  >
                    {obj}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {taxonomies.map((t) => (
                <TableRow hover key={t.id}>
                  {/* Sticky first column for taxonomy name */}
                  <TableCell
                    sx={{
                      whiteSpace: "nowrap",
                      position: "sticky",
                      left: 0,
                      zIndex: 1,
                      bgcolor: "background.paper",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {(() => {
                        const flagCode = getFlagCodeFromAny(t);
                        return flagCode ? (
                          <ReactCountryFlag
                            countryCode={flagCode}
                            svg
                            style={{ width: "1.1em", height: "1.1em", borderRadius: 3 }}
                          />
                        ) : null;
                      })()}
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {t.name}
                      </Typography>
                    </Box>
                  </TableCell>

                  {allObjectiveNames.map((obj) => {
                    const present = hasObjective(t.id, obj);
                    if (!present) {
                      return (
                        <TableCell key={`${t.id}-${obj}`} align="center">
                          <RemoveIcon fontSize="small" sx={{ color: "text.disabled" }} />
                        </TableCell>
                      );
                    }

                    const target = getObjectiveByName(t.id, obj); // { id, name }
                    return (
                      <TableCell key={`${t.id}-${obj}`} align="center">
                        <Tooltip title={`Go to ${t.name} → ${obj} sectors`}>
                          <IconButton
                            component={RouterLink}
                            to={`/taxonomies/${t.id}`}
                            state={{ preselectObjectiveId: target?.id, fromObjectivesMatrix: true }}
                            aria-label={`Open sectors for ${obj} in ${t.name}`}
                            size="small"
                          >
                            <CheckCircleOutlineIcon fontSize="small" color="success" />
                          </IconButton>
                        </Tooltip>
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
