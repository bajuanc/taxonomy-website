import React from "react";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: "1000px",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  maxHeight: "90vh",
  overflowY: "auto",
  borderRadius: 2,
};

const ActivityCriteriaModal = ({ open, onClose, activity }) => {
  if (!activity) return null;

  const dnshCriteria = [
    { key: "dnsh_climate_adaptation", label: "Climate Adaptation" },
    { key: "dnsh_water", label: "Water" },
    { key: "dnsh_circular_economy", label: "Circular Economy" },
    { key: "dnsh_pollution_prevention", label: "Pollution Prevention" },
    { key: "dnsh_biodiversity", label: "Biodiversity" },
    { key: "dnsh_land_management", label: "Land Management" },
  ];

  const scType = activity.sc_criteria_type
    ? String(activity.sc_criteria_type).toLowerCase().replace(" ", "_")
    : "threshold";

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        {/* Close button */}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>

        {/* Title */}
        <Typography variant="h5" gutterBottom>
          {activity.name}
        </Typography>

        {/* Single-column stack of sections */}
        <Stack spacing={2} mt={1}>
          {/* Description */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Description</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>{activity.description || "No description"}</Typography>
            </AccordionDetails>
          </Accordion>

          {/* Substantial Contribution */}
          <Typography variant="h6" sx={{ mt: 1 }}>
            Substantial Contribution Criteria
          </Typography>

          {scType === "traffic_light" ? (
            <>
              {activity.sc_criteria_green && (
                <Accordion sx={{ borderLeft: "6px solid green" }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Green Criteria</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography>{activity.sc_criteria_green}</Typography>
                  </AccordionDetails>
                </Accordion>
              )}
              {activity.sc_criteria_amber && (
                <Accordion sx={{ borderLeft: "6px solid orange" }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Amber Criteria</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography>{activity.sc_criteria_amber}</Typography>
                  </AccordionDetails>
                </Accordion>
              )}
              {activity.sc_criteria_red && (
                <Accordion sx={{ borderLeft: "6px solid red" }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Red (Ineligible)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography>{activity.sc_criteria_red}</Typography>
                  </AccordionDetails>
                </Accordion>
              )}
            </>
          ) : (
            activity.substantial_contribution_criteria && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Threshold Criteria</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>
                    {activity.substantial_contribution_criteria}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            )
          )}

          {/* Non‑eligibility (if present) */}
          {activity.non_eligibility_criteria ? (
            <>
              <Typography variant="h6" sx={{ mt: 1 }}>
                Non‑eligibility Criteria
              </Typography>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>{activity.non_eligibility_criteria}</Typography>
                </AccordionDetails>
              </Accordion>
            </>
          ) : null}

          {/* DNSH */}
          <Typography variant="h6" sx={{ mt: 1 }}>
            Do No Significant Harm (DNSH) Criteria
          </Typography>

          {dnshCriteria.map((item) => (
            <Accordion key={item.key}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{item.label}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  {activity[item.key] || "No criteria provided"}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}

          {/* Close button */}
          <Box sx={{ textAlign: "right", mt: 1 }}>
            <Button variant="contained" onClick={onClose}>
              Close
            </Button>
          </Box>
        </Stack>
      </Box>
    </Modal>
  );
};

export default ActivityCriteriaModal;
