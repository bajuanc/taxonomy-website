import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "light", // You can change to "dark" later if preferred
    primary: {
      main: "#1976d2", // Customize primary color
    },
    secondary: {
      main: "#9c27b0",
    },
  },
  shape: {
    borderRadius: 8,
  },
});

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
