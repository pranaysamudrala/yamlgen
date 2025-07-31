import type { AppProps } from "next/app";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import { useMemo } from "react";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#0f0f0f", paper: "#1e1e1e" },
    text: { primary: "#f5f5f5" },
    primary: { main: "#1976d2" },
    success: { main: "#2e7d32" },
    error: { main: "#c62828" }
  },
  typography: {
    fontFamily: "system-ui,-apple-system,BlinkMacSystemFont,sans-serif"
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#1e1e1e"
        }
      }
    }
  }
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
