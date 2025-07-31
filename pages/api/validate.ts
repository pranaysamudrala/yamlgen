import type { NextApiRequest, NextApiResponse } from "next";
import { validateKubernetesYAML, ValidationError } from "../../utils/validator";

type ResponseBody = {
  success: boolean;
  errors?: ValidationError[];
  message?: string;
};

export default function handler(req: NextApiRequest, res: NextApiResponse<ResponseBody>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  const { yaml } = req.body;
  if (typeof yaml !== "string") {
    return res.status(400).json({ success: false, message: "`yaml` string is required in body" });
  }

  try {
    const errors = validateKubernetesYAML(yaml);
    if (errors.length) {
      return res.status(200).json({ success: false, errors });
    }
    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: `Internal error: ${err.message}` });
  }
}
