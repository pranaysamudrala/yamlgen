import { useState, useEffect, useMemo } from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  Paper,
  CircularProgress,
  List,
  ListItem
} from "@mui/material";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import Editor from "@monaco-editor/react";
import { parseAllDocuments } from "yaml";
import Ajv from "ajv";

type ValidationError = {
  docIndex: number;
  message: string;
};

const DEFAULT_YAML = `apiVersion: v1
kind: Pod
metadata:
  name: example
spec:
  containers:
  - name: c
    image: nginx`;

export default function Home() {
  const [yamlInput, setYamlInput] = useState<string>(DEFAULT_YAML);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [schemaFetchError, setSchemaFetchError] = useState<string | null>(null);
  const [kubeSchema, setKubeSchema] = useState<any>(null);
  const ajv = useMemo(() => new Ajv({ strict: false, allErrors: true }), []);

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const podSchemaResp = await fetch(
          "https://raw.githubusercontent.com/instrumenta/kubernetes-json-schema/main/v1.27.0-standalone-strict/pod.yaml"
        );
        if (!podSchemaResp.ok) throw new Error(`status ${podSchemaResp.status}`);
        const text = await podSchemaResp.text();
        const doc = parseAllDocuments(text)[0].toJSON();
        setKubeSchema(doc);
      } catch (e: any) {
        setSchemaFetchError("Failed to fetch Kubernetes schema: " + e.message);
      }
    };
    fetchSchema();
  }, []);

  const runValidation = async () => {
    setLoading(true);
    setErrors([]);
    const collected: ValidationError[] = [];

    let docs;
    try {
      docs = parseAllDocuments(yamlInput);
    } catch (e: any) {
      collected.push({ docIndex: 0, message: "YAML parse error: " + e.message });
      setErrors(collected);
      setLoading(false);
      return;
    }

    docs.forEach((docObj, idx) => {
      if (docObj.errors && docObj.errors.length) {
        docObj.errors.forEach((e: any) =>
          collected.push({ docIndex: idx, message: `YAML parse error: ${e.message}` })
        );
        return;
      }
      const doc = docObj.toJSON();
      if (!doc || typeof doc !== "object") {
        collected.push({ docIndex: idx, message: "Document is empty or not an object" });
        return;
      }

      const requiredTop = ["apiVersion", "kind", "metadata"];
      requiredTop.forEach((f) => {
        if (!(f in doc)) {
          collected.push({ docIndex: idx, message: `Missing top-level field '${f}'` });
        }
      });
      if (doc.metadata && typeof doc.metadata === "object" && !("name" in doc.metadata)) {
        collected.push({ docIndex: idx, message: "metadata.name is required" });
      }

      if (doc.kind === "Pod") {
        if (!doc.spec) collected.push({ docIndex: idx, message: "'spec' is required for Pod" });
        else if (!doc.spec.containers)
          collected.push({ docIndex: idx, message: "'spec.containers' is required for Pod" });
      }

      if (kubeSchema && doc.kind === "Pod") {
        try {
          const validate = ajv.compile(kubeSchema);
          const valid = validate(doc);
          if (!valid && validate.errors) {
            validate.errors.forEach((err) => {
              collected.push({
                docIndex: idx,
                message: `Schema: ${err.instancePath || ""} ${err.message}`
              });
            });
          }
        } catch (e: any) {
          collected.push({
            docIndex: idx,
            message: "Internal schema validation error: " + e.message
          });
        }
      }
    });

    setErrors(collected);
    setLoading(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6, background: "#0a0a0a", minHeight: "100vh" }}>
      <Box mb={2}>
        <Typography variant="h4" gutterBottom sx={{ color: "#fff" }}>
          Kubernetes YAML Validator (Monaco + Schema)
        </Typography>
        <Typography variant="body2" gutterBottom sx={{ color: "#ccc" }}>
          VS Code–style editor, line numbers, live structural + schema validation (approximate kubeval).
        </Typography>
      </Box>

      <Box sx={{ mb: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          onClick={runValidation}
          startIcon={<ContentPasteIcon />}
          disabled={loading}
          sx={{
            background: "#fff",
            color: "#000",
            "&:hover": { background: "#e6e6e6" }
          }}
        >
          {loading ? <CircularProgress size={18} /> : "Validate"}
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setYamlInput(DEFAULT_YAML);
            setErrors([]);
          }}
        >
          Clear
        </Button>
      </Box>

      {schemaFetchError && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {schemaFetchError}
        </Alert>
      )}

      <Paper
        elevation={2}
        sx={{
          height: "600px",
          mb: 2,
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid #222"
        }}
      >
        <Editor
          height="100%"
          defaultLanguage="yaml"
          theme="vs-dark"
          value={yamlInput}
          onChange={(v) => setYamlInput(v || "")}
          options={{
            minimap: { enabled: false },
            fontFamily: "Fira Code, monospace",
            fontSize: 14,
            wordWrap: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 2,
            renderValidationDecorations: "on"
          }}
        />
      </Paper>

      <Box>
        {errors.length === 0 && !loading ? (
          <Alert severity="success" sx={{ mb: 1 }}>
            ✅ No structural/schema errors detected.
          </Alert>
        ) : null}
        {errors.length > 0 && (
          <Paper
            variant="outlined"
            sx={{
              backgroundColor: "#0d0d0d",
              border: "1px solid #c62828",
              p: 2,
              mb: 2
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1, color: "#fff" }}>
              ❌ Validation errors ({errors.length})
            </Typography>
            <List dense>
              {errors.map((e, i) => (
                <ListItem key={i} sx={{ py: 0.5 }}>
                  <Typography variant="body2" sx={{ color: "#eee" }}>
                    <code
                      style={{
                        background: "#1e1e1e",
                        padding: "2px 6px",
                        borderRadius: 4,
                        marginRight: 6,
                        fontSize: "0.75rem"
                      }}
                    >
                      doc[{e.docIndex}]
                    </code>
                    {e.message}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      <Box mt={4}>
        <Typography variant="caption" sx={{ color: "#999" }}>
          This merges lightweight structural checks with Kubernetes JSON schema validation (approximate kubeval).
          For full parity you can run the official <code>kubeval</code> binary in CI or extend the backend to execute it.
        </Typography>
      </Box>
    </Container>
  );
}
