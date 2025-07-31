import { useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  List,
  ListItem,
  Paper,
  CircularProgress
} from "@mui/material";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";

type ValidationError = {
  docIndex: number;
  message: string;
};

export default function Home() {
  const [yamlInput, setYamlInput] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
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
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Kubernetes YAML Validator
        </Typography>
        <Typography variant="body2" gutterBottom>
          Paste one or more Kubernetes YAML documents (--- separated). Performs lightweight structural validation.
        </Typography>
      </Box>

      <TextField
        label="Kubernetes YAML"
        placeholder={`apiVersion: v1
kind: Pod
metadata:
  name: example
spec:
  containers:
  - name: c
    image: nginx`}
        multiline
        minRows={12}
        fullWidth
        value={yamlInput}
        onChange={(e) => setYamlInput(e.target.value)}
        inputProps={{ style: { fontFamily: "monospace" } }}
        sx={{
          mb: 2,
          "& .MuiInputBase-root": {
            backgroundColor: "#1e1e1e",
            color: "#f5f5f5"
          }
        }}
      />

      <Box display="flex" gap={2} mb={2}>
        <Button
          variant="contained"
          startIcon={<ContentPasteIcon />}
          onClick={submit}
          disabled={loading}
        >
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
        <Box mb={2}>
          {result.success ? (
            <Alert severity="success">✅ Validation passed. No structural errors detected.</Alert>
          ) : (
            <Alert severity="error" sx={{ mb: 1 }}>
              ❌ Validation failed.
            </Alert>
          )}
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
          Note: This is structural validation only. For full Kubernetes schema validation, integrate official JSON
          schemas or use tools like kubeval in a pipeline.
        </Typography>
      </Box>
    </Container>
  );
}
