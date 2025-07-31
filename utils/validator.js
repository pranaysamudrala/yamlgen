import { parseAllDocuments } from "yaml";

export type ValidationError = {
  docIndex: number;
  message: string;
  path?: string;
};

const mandatoryTopLevel = ["apiVersion", "kind", "metadata"];

const kindSpecificRequirements: Record<string, (doc: any) => ValidationError[]> = {
  Deployment: (doc) => {
    const errs: ValidationError[] = [];
    if (!doc.spec) {
      errs.push({ docIndex: -1, message: "'spec' is required for Deployment" });
      return errs;
    }
    if (!doc.spec.template) {
      errs.push({ docIndex: -1, message: "'spec.template' is required for Deployment" });
    }
    return errs;
  },
  Service: (doc) => {
    const errs: ValidationError[] = [];
    if (!doc.spec) {
      errs.push({ docIndex: -1, message: "'spec' is required for Service" });
    } else if (!doc.spec.ports) {
      errs.push({ docIndex: -1, message: "'spec.ports' is required for Service" });
    }
    return errs;
  },
  Pod: (doc) => {
    const errs: ValidationError[] = [];
    if (!doc.spec) {
      errs.push({ docIndex: -1, message: "'spec' is required for Pod" });
    } else if (!doc.spec.containers) {
      errs.push({ docIndex: -1, message: "'spec.containers' is required for Pod" });
    }
    return errs;
  }
};

export function validateKubernetesYAML(yamlText: string): ValidationError[] {
  const docs = parseAllDocuments(yamlText);
  const errors: ValidationError[] = [];

  docs.forEach((docObj, idx) => {
    if (docObj.errors && docObj.errors.length) {
      docObj.errors.forEach((e: any) => {
        errors.push({
          docIndex: idx,
          message: `YAML parse error: ${e.message}`
        });
      });
      return;
    }

    const doc = docObj.toJSON();
    if (doc === null || typeof doc !== "object") {
      errors.push({
        docIndex: idx,
        message: "Document is empty or not a mapping/object"
      });
      return;
    }

    mandatoryTopLevel.forEach((field) => {
      if (!(field in doc)) {
        errors.push({
          docIndex: idx,
          message: `Missing required top-level field '${field}'`
        });
      }
    });

    if (doc.metadata && typeof doc.metadata === "object") {
      if (!("name" in doc.metadata)) {
        errors.push({
          docIndex: idx,
          message: "metadata.name is required"
        });
      }
    }

    if (typeof doc.kind === "string") {
      const validatorFn = kindSpecificRequirements[doc.kind];
      if (validatorFn) {
        const kindErrs = validatorFn(doc);
        kindErrs.forEach((e) => {
          errors.push({
            docIndex: idx,
            message: e.message
          });
        });
      }
    }
  });

  return errors;
}
