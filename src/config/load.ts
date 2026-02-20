import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";

export type GatewayConfig = any;

export function loadConfig(configPath: string): GatewayConfig {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config not found: ${configPath}`);
  }
  const raw = fs.readFileSync(configPath, "utf8");
  const cfg = JSON.parse(raw);

  const schemasDir = path.resolve(process.cwd(), "schemas");
  const schemaMainPath = path.join(schemasDir, "gateway_config.schema.json");

  const ajv = new Ajv2020({ allErrors: true, strict: false });

  for (const file of fs.readdirSync(schemasDir)) {
    if (!file.endsWith(".schema.json") || file === "gateway_config.schema.json") continue;
    const p = path.join(schemasDir, file);
    const s = JSON.parse(fs.readFileSync(p, "utf8"));
    ajv.addSchema(s, file);
  }

  const mainSchema = JSON.parse(fs.readFileSync(schemaMainPath, "utf8"));
  const validate = ajv.compile(mainSchema);

  const ok = validate(cfg);
  if (!ok) {
    const msg = ajv.errorsText(validate.errors, { separator: "\\n" });
    throw new Error(`Config schema validation failed:\n${msg}`);
  }

  return cfg;
}
