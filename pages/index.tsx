import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  List,
  ListItem,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip
} from "@mui/material";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

// dynamically import Monaco to disable SSR
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type ValidationError = {
  docIndex: number;
  message: string;
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export default function Home() {
  const [yamlInput, setYamlInput] = useState<string>(`apiVersion: v1
kind: Pod
metadata:
  name: example
spec:
  containers:
  - name: c
    image: nginx`);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copiedYaml, setCopiedYaml] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);

  const submit = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const resp = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yaml: yamlInput })
      });
      const data = await resp.json();
      setResult(data);
    } catch (e) {
      setResult({ success: false, message: "Network or unexpected error" });
    }
    setLoading(false);
  }, [yamlInput]);

  const handleCopyYaml = useCallback(async () => {
    if (!yamlInput) return;
    const ok = await copyToClipboard(yamlInput);
    if (ok) {
      setCopiedYaml(true);
      setTimeout(() => setCopiedYaml(false), 1500);
    }
  }, [yamlInput]);

  const handleCopyResult = useCallback(async () => {
    if (!result) return;
    const serialized = JSON.stringify(result, null, 2);
    const ok = await copyToClipboard(serialized);
    if (ok) {
      setCopiedResult(true);
      setTimeout(() => setCopiedResult(false), 1500);
    }
  }, [result]);

  return (
    <Container maxWidth="md" sx={{ py: 6, position: "relative" }}>
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Kubernetes YAML Validator
        </Typography>
        <Typography variant="body2" gutterBottom>
          Paste one or more Kubernetes YAML documents (--- separated). Structural validation only.
        </Typography>
      </Box>

      <Box position="relative" mb={2} sx={{ borderRadius: 1, overflow: "hidden", border: "1px solid #333" }}>
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            display: "flex",
            gap: 1,
            zIndex: 10
          }}
        >
          <Tooltip title={copiedYaml ? "Copied" : "Copy YAML"}>
            <IconButton
              size="small"
              onClick={handleCopyYaml}
              sx={{
                bgcolor: "#222",
                border: "1px solid #444",
                color: "#f5f5f5",
                "&:hover": { bgcolor: "#2a2a2a" }
              }}
              aria-label="copy yaml"
            >
              {copiedYaml ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        <MonacoEditor
          height="360px"
          defaultLanguage="yaml"
          theme="vs-dark"
          value={yamlInput}
          onChange={(value) => setYamlInput(value || "")}
          options={{
            minimap: { enabled: false },
            fontFamily: "Fira Code, monospace, system-ui",
            fontSize: 13,
            wordWrap: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            lineNumbers: "on",
            tabSize: 2,
            formatOnPaste: true
          }}
          aria-label="kubernetes yaml editor"
        />
      </Box>

      <Box display="flex" gap={2} mb={2}>
        <Button variant="contained" startIcon={<ContentPasteIcon />} onClick={submit} disabled={loading}>
          {loading ? (
            <>
              <CircularProgress size={18} sx={{ mr: 1, color: "inherit" }} /> Validating...
            </>
          ) : (
            "Validate"
          )}
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setYamlInput("");
            setResult(null);
          }}
        >
          Clear
        </Button>
      </Box>

      {result && (
        <Box mb={2} position="relative">
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Box sx={{ flex: 1, mr: 1 }}>
              {result.success ? (
                <Alert severity="success" sx={{ mb: 0 }}>
                  ✅ Validation passed. No structural errors detected.
                </Alert>
              ) : (
                <Alert severity="error" sx={{ mb: 0 }}>
                  ❌ Validation failed.
                </Alert>
              )}
            </Box>
            <Tooltip title={copiedResult ? "Copied" : "Copy result"}>
              <IconButton
                size="small"
                onClick={handleCopyResult}
                sx={{
                  bgcolor: "#222",
                  border: "1px solid #444",
                  color: "#f5f5f5",
                  "&:hover": { bgcolor: "#2a2a2a" }
                }}
                aria-label="copy result"
              >
                {copiedResult ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>

          {result.errors && (
            <Paper
              variant="outlined"
              sx={{
                backgroundColor: "#0f0f0f",
                border: "1px solid",
                borderColor: result.success ? "success.main" : "error.main",
                mt: 1,
                p: 2
              }}
            >
              <List dense>
                {result.errors.map((e: ValidationError, i: number) => (
                  <ListItem key={i} sx={{ py: 0.5 }}>
                    <Typography variant="body2">
                      <code style={{ background: "#222", padding: 4, borderRadius: 4 }}>
                        doc[{e.docIndex}]
                      </code>
                      : {e.message}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
          {result.message && !result.errors && (
            <Typography variant="body2">{result.message}</Typography>
          )}
        </Box>
      )}

      <Box mt={6}>
        <Typography variant="caption" display="block">
          Note: Structural validation only. For full schema enforcement, integrate Kubernetes JSON schemas or tools like
          kubeval.
        </Typography>
      </Box>
    </Container>
  );
}
