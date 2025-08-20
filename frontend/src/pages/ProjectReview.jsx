import React, { useEffect, useMemo, useState } from "react";
import {
  Container, Box, Typography, Stepper, Step, StepLabel, Button, Card, CardContent,
  TextField, MenuItem, CircularProgress, FormGroup, FormControlLabel, Checkbox,
  RadioGroup, Radio, Divider, Alert
} from "@mui/material";
import api from "../api/axios";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

const steps = [
  "Project Info",
  "Taxonomy",
  "Objective",
  "Sector",
  "Activity",
  "Assessment",
  "Results",
];

const DNSH_FIELDS = [
  { key: "dnsh_climate_adaptation", label: "Climate Adaptation" },
  { key: "dnsh_water", label: "Water" },
  { key: "dnsh_circular_economy", label: "Circular Economy" },
  { key: "dnsh_pollution_prevention", label: "Pollution Prevention" },
  { key: "dnsh_biodiversity", label: "Biodiversity" },
  { key: "dnsh_land_management", label: "Land Management" },
];

const normalizeSCType = (val) =>
  (val || "").toString().trim().toLowerCase().replace(/\s+/g, "_"); // e.g. "Traffic light" -> "traffic_light"

const ProjectReview = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  // Step 1: Project info
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectRegion, setProjectRegion] = useState("");

  // Selections
  const [taxonomyId, setTaxonomyId] = useState("");
  const [objectiveId, setObjectiveId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [activityId, setActivityId] = useState("");

  // Data lists
  const [taxonomies, setTaxonomies] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [activities, setActivities] = useState([]);

  // Loading flags
  const [loadingTx, setLoadingTx] = useState(true);
  const [loadingObjectives, setLoadingObjectives] = useState(false);
  const [loadingSectors, setLoadingSectors] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Activity criteria (for assessment)
  const [criteria, setCriteria] = useState(null);
  const [loadingCriteria, setLoadingCriteria] = useState(false);

  // Assessment state
  const [scType, setScType] = useState("threshold");
  // threshold
  const [meetsThreshold, setMeetsThreshold] = useState(false);
  // traffic-light
  const [trafficChoice, setTrafficChoice] = useState(""); // "green" | "amber" | "red"
  const [meetsTrafficChoice, setMeetsTrafficChoice] = useState(false);
  // dnsh
  const [dnshChecks, setDnshChecks] = useState({});
  // minimum safeguards (not in DB; user confirms)
  const [meetsMS, setMeetsMS] = useState(false);

  // Computed result
  const [result, setResult] = useState(null); // {status: 'Not eligible' | 'Eligible but not aligned' | 'Aligned', reason: string}

  // --- Load taxonomies on mount
  useEffect(() => {
    api
      .get("taxonomies/")
      .then((res) => setTaxonomies(res.data || []))
      .catch((e) => console.error(e))
      .finally(() => setLoadingTx(false));
  }, []);

  // --- When taxonomy changes, load objectives
  useEffect(() => {
    setObjectives([]);
    setObjectiveId("");
    setSectors([]);
    setSectorId("");
    setActivities([]);
    setActivityId("");
    setCriteria(null);

    if (!taxonomyId) return;
    setLoadingObjectives(true);
    api
      .get(`taxonomies/${taxonomyId}/environmental-objectives/`)
      .then((res) => setObjectives(res.data || []))
      .catch((e) => console.error(e))
      .finally(() => setLoadingObjectives(false));
  }, [taxonomyId]);

  // --- When objective changes, load sectors
  useEffect(() => {
    setSectors([]);
    setSectorId("");
    setActivities([]);
    setActivityId("");
    setCriteria(null);

    if (!taxonomyId || !objectiveId) return;
    setLoadingSectors(true);
    api
      .get(`taxonomies/${taxonomyId}/objectives/${objectiveId}/sectors/`)
      .then((res) => setSectors(res.data || []))
      .catch((e) => console.error(e))
      .finally(() => setLoadingSectors(false));
  }, [objectiveId, taxonomyId]);

  // --- When sector changes, load activities
  useEffect(() => {
    setActivities([]);
    setActivityId("");
    setCriteria(null);

    if (!taxonomyId || !objectiveId || !sectorId) return;
    if (sectorId === "__none__") return; // "I don't see a sector"

    setLoadingActivities(true);
    api
      .get(
        `taxonomies/${taxonomyId}/objectives/${objectiveId}/sectors/${sectorId}/activities/`
      )
      .then((res) => setActivities(res.data || []))
      .catch((e) => console.error(e))
      .finally(() => setLoadingActivities(false));
  }, [sectorId, objectiveId, taxonomyId]);

  // --- When activity changes, load criteria
  useEffect(() => {
    setCriteria(null);
    setScType("threshold");
    setMeetsThreshold(false);
    setTrafficChoice("");
    setMeetsTrafficChoice(false);
    setDnshChecks({});
    setMeetsMS(false);

    if (!activityId || activityId === "__none__") return;

    setLoadingCriteria(true);
    api
      .get(`activities/${activityId}/criteria/`)
      .then((res) => {
        const data = res.data;
        setCriteria(data);

        const norm = normalizeSCType(data.sc_criteria_type);
        setScType(norm || "threshold");

        // Initialize DNSH checkboxes for only the fields that have content
        const init = {};
        DNSH_FIELDS.forEach(({ key }) => {
          if ((data[key] || "").trim().length > 0) init[key] = false;
        });
        setDnshChecks(init);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoadingCriteria(false));
  }, [activityId]);

  const presentDnshKeys = useMemo(
    () => Object.keys(dnshChecks),
    [dnshChecks]
  );

  // --- Navigation guards (simple)
  const canNext = useMemo(() => {
    switch (activeStep) {
      case 0:
        return true; // project info optional to proceed
      case 1:
        return !!taxonomyId;
      case 2:
        return !!objectiveId;
      case 3:
        return !!sectorId; // can be "__none__"
      case 4:
        return !!activityId; // can be "__none__"
      case 5:
        if (sectorId === "__none__" || activityId === "__none__") return true; // skip assessment
        if (loadingCriteria || !criteria) return false;

        if (scType === "traffic_light") {
          if (!trafficChoice) return false;
          if (trafficChoice === "red") return true; // can proceed to results
          // green/amber → need a choice checkbox + DNSH & MS answers (checked or unchecked is fine; user can proceed)
          return true;
        } else {
          // threshold → user can proceed (checked or not); result will compute accordingly
          return true;
        }
      default:
        return true;
    }
  }, [activeStep, taxonomyId, objectiveId, sectorId, activityId, scType, trafficChoice, loadingCriteria, criteria]);

  const handleNext = () => {
    if (activeStep === steps.length - 2) {
      // compute result before final step
      const res = computeResult();
      setResult(res);
    }
    setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  // --- Result engine
  const computeResult = () => {
    // 1) Not eligible path
    if (sectorId === "__none__" || activityId === "__none__") {
      return { status: "Not eligible", reason: "No matching sector or activity was selected." };
    }

    // 2) Evaluate alignment
    // DNSH all met = all present DNSH fields must be checked true (if none present, treat as true)
    const dnshAllMet = presentDnshKeys.length === 0
      ? true
      : presentDnshKeys.every((k) => dnshChecks[k]);

    const msMet = meetsMS === true;

    if (scType === "traffic_light") {
      // user must pick one
      if (trafficChoice === "red") {
        return { status: "Eligible but not aligned", reason: "Red criteria selected." };
      }
      const scMet = meetsTrafficChoice === true;

      if (scMet && dnshAllMet && msMet) {
        return { status: "Aligned", reason: "Selected traffic-light criteria, DNSH, and minimum safeguards met." };
      }
      return { status: "Eligible but not aligned", reason: "One or more criteria not met (SC / DNSH / MS)." };
    }

    // threshold
    const scMet = meetsThreshold === true;
    if (scMet && dnshAllMet && msMet) {
      return { status: "Aligned", reason: "Threshold criteria, DNSH, and minimum safeguards met." };
    }
    return { status: "Eligible but not aligned", reason: "One or more criteria not met (SC / DNSH / MS)." };
  };

  // --- Render sections
  const renderProjectInfo = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Project Info</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { md: "1fr 1fr" }, gap: 2 }}>
          <TextField
            label="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Country/Region"
            value={projectRegion}
            onChange={(e) => setProjectRegion(e.target.value)}
            fullWidth
          />
        </Box>
        <TextField
          label="Short Description"
          value={projectDesc}
          onChange={(e) => setProjectDesc(e.target.value)}
          fullWidth
          multiline
          minRows={3}
          sx={{ mt: 2 }}
        />
      </CardContent>
    </Card>
  );

  const renderTaxonomy = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Select Taxonomy</Typography>
        {loadingTx ? (
          <Box sx={{ py: 3, textAlign: "center" }}><CircularProgress /></Box>
        ) : (
          <TextField
            select
            label="Taxonomy"
            value={taxonomyId}
            onChange={(e) => setTaxonomyId(e.target.value)}
            fullWidth
          >
            {taxonomies.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </TextField>
        )}
      </CardContent>
    </Card>
  );

  const renderObjective = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Select Environmental Objective</Typography>
        {loadingObjectives ? (
          <Box sx={{ py: 3, textAlign: "center" }}><CircularProgress /></Box>
        ) : (
          <TextField
            select
            label="Environmental Objective"
            value={objectiveId}
            onChange={(e) => setObjectiveId(e.target.value)}
            fullWidth
            disabled={!taxonomyId}
          >
            {objectives.map((o) => (
              <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
            ))}
          </TextField>
        )}
      </CardContent>
    </Card>
  );

  const renderSector = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Select Sector</Typography>
        {loadingSectors ? (
          <Box sx={{ py: 3, textAlign: "center" }}><CircularProgress /></Box>
        ) : (
          <TextField
            select
            label="Sector"
            value={sectorId}
            onChange={(e) => setSectorId(e.target.value)}
            fullWidth
            disabled={!objectiveId}
          >
            <MenuItem value="__none__">I don’t see a sector related to my project</MenuItem>
            {sectors.map((s) => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </TextField>
        )}
      </CardContent>
    </Card>
  );

  const renderActivity = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Select Activity</Typography>
        {sectorId === "__none__" ? (
          <Alert severity="info" sx={{ my: 2 }}>
            Since you didn’t find a matching sector, you can proceed to results. The project will be marked <strong>Not eligible</strong>.
          </Alert>
        ) : loadingActivities ? (
          <Box sx={{ py: 3, textAlign: "center" }}><CircularProgress /></Box>
        ) : (
          <TextField
            select
            label="Activity"
            value={activityId}
            onChange={(e) => setActivityId(e.target.value)}
            fullWidth
            disabled={!sectorId || sectorId === "__none__"}
          >
            <MenuItem value="__none__">I don’t see an activity related to my project</MenuItem>
            {activities.map((a) => (
              <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
            ))}
          </TextField>
        )}
      </CardContent>
    </Card>
  );

  const renderAssessment = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Self‑Assessment</Typography>

        {(sectorId === "__none__" || activityId === "__none__") && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No matching sector or activity was selected. You can continue to results (Not eligible).
          </Alert>
        )}

        {!(sectorId === "__none__" || activityId === "__none__") && (
          <>
            {loadingCriteria || !criteria ? (
              <Box sx={{ py: 3, textAlign: "center" }}><CircularProgress /></Box>
            ) : (
              <>
                {/* SC Section */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Substantial Contribution (SC)</Typography>

                  {normalizeSCType(criteria.sc_criteria_type) === "traffic_light" ? (
                    <>
                      <RadioGroup
                        row
                        value={trafficChoice}
                        onChange={(e) => setTrafficChoice(e.target.value)}
                        sx={{ mb: 1 }}
                      >
                        <FormControlLabel value="green" control={<Radio />} label="Green" />
                        <FormControlLabel value="amber" control={<Radio />} label="Amber" />
                        <FormControlLabel value="red" control={<Radio />} label="Red" />
                      </RadioGroup>

                      {trafficChoice && trafficChoice !== "red" && (
                        <>
                          <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1, mb: 1 }}>
                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                              {trafficChoice === "green" ? (criteria.sc_criteria_green || "No details provided.")
                                : trafficChoice === "amber" ? (criteria.sc_criteria_amber || "No details provided.")
                                : ""}
                            </Typography>
                          </Box>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={meetsTrafficChoice}
                                onChange={(e) => setMeetsTrafficChoice(e.target.checked)}
                              />
                            }
                            label="My project meets the selected traffic-light criteria"
                          />
                        </>
                      )}

                      {trafficChoice === "red" && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                          You selected <strong>Red</strong>. This will be treated as <strong>Eligible but not aligned</strong>.
                        </Alert>
                      )}
                    </>
                  ) : (
                    <>
                      <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1, mb: 1 }}>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                          {criteria.substantial_contribution_criteria || "No details provided."}
                        </Typography>
                      </Box>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={meetsThreshold}
                            onChange={(e) => setMeetsThreshold(e.target.checked)}
                          />
                        }
                        label="My project meets the threshold criteria"
                      />
                    </>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* DNSH Section */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Do No Significant Harm (DNSH)</Typography>
                  {presentDnshKeys.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No DNSH criteria provided for this activity.</Typography>
                  ) : (
                    presentDnshKeys.map((key) => {
                      const label = DNSH_FIELDS.find((d) => d.key === key)?.label || key;
                      return (
                        <Box key={key} sx={{ mb: 1.5 }}>
                          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 0.5 }}>
                            <strong>{label}:</strong> {criteria[key]}
                          </Typography>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!dnshChecks[key]}
                                onChange={(e) =>
                                  setDnshChecks((prev) => ({ ...prev, [key]: e.target.checked }))
                                }
                              />
                            }
                            label={`My project meets the ${label} DNSH criteria`}
                          />
                        </Box>
                      );
                    })
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Minimum safeguards */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>Minimum Safeguards</Typography>
                  <FormControlLabel
                    control={<Checkbox checked={meetsMS} onChange={(e) => setMeetsMS(e.target.checked)} />}
                    label="My project meets the minimum safeguards"
                  />
                </Box>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderResults = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Results</Typography>
        {!result ? (
          <Typography variant="body2" color="text.secondary">No result computed.</Typography>
        ) : (
          <>
            {result.status === "Aligned" && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <strong>Aligned</strong> — {result.reason}
              </Alert>
            )}
            {result.status === "Eligible but not aligned" && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>Eligible but not aligned</strong> — {result.reason}
              </Alert>
            )}
            {result.status === "Not eligible" && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <strong>Not eligible</strong> — {result.reason}
              </Alert>
            )}

            <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5 }}>Project</Typography>
            <Typography variant="body2" color="text.secondary">
              {projectName || "Untitled"}{projectRegion ? ` — ${projectRegion}` : ""}
            </Typography>
            {projectDesc && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                {projectDesc}
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Selection</Typography>
            <Typography variant="body2" color="text.secondary">
              Taxonomy: {taxonomies.find(t => String(t.id) === String(taxonomyId))?.name || "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Objective: {objectives.find(o => String(o.id) === String(objectiveId))?.name || "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sector: {sectorId === "__none__" ? "Not found" : (sectors.find(s => String(s.id) === String(sectorId))?.name || "—")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Activity: {activityId === "__none__" ? "Not found" : (activities.find(a => String(a.id) === String(activityId))?.name || "—")}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Typography variant="h4" gutterBottom>Project Review</Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ display: "grid", gap: 2 }}>
          {activeStep === 0 && renderProjectInfo()}
          {activeStep === 1 && renderTaxonomy()}
          {activeStep === 2 && renderObjective()}
          {activeStep === 3 && renderSector()}
          {activeStep === 4 && renderActivity()}
          {activeStep === 5 && renderAssessment()}
          {activeStep === 6 && renderResults()}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
          <Button variant="outlined" disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>

          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!canNext}
            >
              {activeStep === steps.length - 2 ? "Finish" : "Next"}
            </Button>
          ) : (
            <Button variant="contained" onClick={() => navigate("/")}>
              Done
            </Button>
          )}
        </Box>
      </Container>
    </>
  );
};

export default ProjectReview;
