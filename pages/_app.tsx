import type { AppProps } from "next/app";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#0a0a0a", paper: "#1e1e1e" },
    text: { primary: "#f5f5f5" },
    primary: { main: "#ffffff" },
    success: { main: "#2e7d32" },
    error: { main: "#c62828" }
  },
  typography: {
    fontFamily: "system-ui,-apple-system,BlinkMacSystemFont,sans-serif"
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: "#ffffff",
          color: "#000",
          fontWeight: 600,
          "&:hover": {
            backgroundColor: "#e6e6e6"
          }
        },
        outlined: {
          borderColor: "#fff",
          color: "#fff",
          fontWeight: 600,
          "&:hover": {
            background: "rgba(255,255,255,0.08)"
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#0f0f0f"
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
