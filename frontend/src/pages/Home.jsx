import React from "react";
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Link } from "react-router-dom";
import Header from "../components/Header";

const Home = () => {
  return (
    <>
      <Header />

      <Container maxWidth="lg" sx={{ mt: 6 }}>
        {/* Title */}
        <Typography variant="h4" gutterBottom>
          Taxonomies Navigator
        </Typography>

        {/* Subtitle */}
        <Typography variant="h6" gutterBottom color="text.secondary">
          A simple and practical guide for users
        </Typography>

        {/* Description */}
        <Typography variant="body1" paragraph>
          The Taxonomy Navigator is a user-friendly website that offers a series of online tools to help users better understand the Sustainable Finance Taxonomies in a simple and practical manner, ultimately facilitating its implementation and supporting companies in their reporting obligations.
        </Typography>

        <Typography variant="body1" paragraph>
          The Navigator offers tools to help you explore taxonomies, filter activities, and view alignment criteria.
        </Typography>

        {/* 1. Taxonomy Compass */}
        <Accordion defaultExpanded sx={{ mt: 4 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>1. Taxonomy Compass – explore sectors, activities & criteria</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              Browse taxonomies by environmental objective, sector, and activity. View substantial contribution and DNSH criteria for each activity.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                component={Link}
                to="/taxonomies"
              >
                Explore Now
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* 2. Project Review */}
        <Accordion defaultExpanded sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>2. Project Review – check eligibility & alignment</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              Evaluate whether a specific project is eligible and aligned with a taxonomy activity.
              Select a taxonomy, objective, sector, and activity, then complete a guided self‑assessment
              of substantial contribution, DNSH, and minimum safeguards (supports traffic‑light and threshold criteria).
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                component={Link}
                to="/project-review"
              >
                Start Project Review
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Container>
    </>
  );
};

export default Home;
