// frontend/src/theme.js
import { createTheme } from "@mui/material/styles";

const ambire = {
  blue: "#0E9CC8",
  green: "#69B449",
  yellow: "#F1D663",
  slate: "#4D5B6E",
  gray: "#B0BDC4",
  nearWhite: "#EFF2ED",
};

const systemFallback =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji"';

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: ambire.blue,
      light: "#49B6D6",
      dark: "#0B7EA2",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: ambire.green,
      light: "#89C97F",
      dark: "#4F8E4C",
      contrastText: "#FFFFFF",
    },
    success: {
      main: ambire.green,
      contrastText: "#FFFFFF",
    },
    warning: {
      main: ambire.yellow,
      contrastText: "#111111",
    },
    info: {
      main: ambire.slate,
      contrastText: "#FFFFFF",
    },
    text: {
      primary: ambire.slate,
      secondary: "#6C7A89",
    },
    grey: {
      50: "#F9FBFA",
      100: "#F5F7F6",
      200: ambire.nearWhite,
      300: "#DEE5E8",
      400: ambire.gray,
      500: "#94A4AF",
      600: ambire.slate,
    },
    background: {
      default: "#F7FAF9",
      paper: "#FFFFFF",
    },
    divider: "#E0E6EA",
  },
  typography: {
    // Poppins as the app default
    fontFamily: `"Poppins", ${systemFallback}`,
    // Use Abel for display headings (keeps visual brand)
    h1: { fontFamily: `"Abel", "Poppins", ${systemFallback}`, fontWeight: 400, lineHeight: 1.2, letterSpacing: 0 },
    h2: { fontFamily: `"Abel", "Poppins", ${systemFallback}`, fontWeight: 400, lineHeight: 1.25 },
    h3: { fontFamily: `"Abel", "Poppins", ${systemFallback}`, fontWeight: 400, lineHeight: 1.3 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { fontFamily: `"Poppins", ${systemFallback}` }, // apply to raw HTML too
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, textTransform: "none", fontWeight: 600 },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        colorDefault: {
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E0E6EA",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow:
            "0px 1px 2px rgba(0,0,0,0.04), 0px 6px 12px rgba(0,0,0,0.06)",
        },
      },
    },
  },
});

export default theme;
